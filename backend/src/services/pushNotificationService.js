import webpush from "web-push";
import { getPrisma } from "../config/database.js";
import { logger } from "../utils/logger.js";

// Configure VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "admin@dataguy.shop"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  logger.info("VAPID details set for Web Push Notifications");
} else {
  logger.warn("VAPID public or private key missing from environment variables");
}

/**
 * Save or update a push subscription in the database
 */
export const saveSubscription = async (subscriptionData, userId = null, phone = null, role = "customer") => {
  const prisma = getPrisma();
  const { endpoint, keys } = subscriptionData;

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new Error("Invalid subscription data: endpoint and keys (p256dh, auth) are required");
  }

  // Deduplicate/Update or Create
  const subscription = await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      phone,
      role,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId,
      phone,
      role,
    },
  });

  return subscription;
};

/**
 * Send a push notification to a single database subscription record
 */
export const sendPushNotification = async (dbSubscription, payload) => {
  const prisma = getPrisma();

  const pushSubscription = {
    endpoint: dbSubscription.endpoint,
    keys: {
      p256dh: dbSubscription.p256dh,
      auth: dbSubscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true, endpoint: dbSubscription.endpoint };
  } catch (error) {
    // If the browser push service returns 410 (Gone) or 404 (Not Found), 
    // it means the subscription is no longer active / has expired or been revoked.
    if (error.statusCode === 410 || error.statusCode === 404) {
      logger.info("Push subscription expired or revoked. Cleaning up database row.", {
        id: dbSubscription.id,
        endpoint: dbSubscription.endpoint,
        statusCode: error.statusCode,
      });
      await prisma.pushSubscription.delete({
        where: { id: dbSubscription.id },
      }).catch(err => {
        logger.error("Failed to delete expired subscription", err);
      });
    } else {
      logger.error("Error sending web push notification", {
        endpoint: dbSubscription.endpoint,
        error: error.message,
      });
    }
    return { success: false, endpoint: dbSubscription.endpoint, error: error.message };
  }
};

/**
 * Broadcast a push notification payload to a targeted set of subscriptions
 */
export const broadcastPush = async (target, payload, orderStatus = null) => {
  const prisma = getPrisma();
  let subscriptions = [];

  if (target === "all_agents") {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { role: { in: ["agent", "sub_agent"] } }
    });
  } else if (target === "active_agents") {
    // Agents/sub-agents who have successfully completed at least one order
    subscriptions = await prisma.pushSubscription.findMany({
      where: {
        role: { in: ["agent", "sub_agent"] },
        user: {
          orders: {
            some: {
              status: "completed"
            }
          }
        }
      }
    });
  } else if (target === "all_customers") {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { role: "customer" }
    });
  } else if (target === "both") {
    subscriptions = await prisma.pushSubscription.findMany();
  } else if (target === "order_status" && orderStatus) {
    // Find customers or agents with orders of a specific status
    const orders = await prisma.order.findMany({
      where: { status: orderStatus },
      select: { sellerId: true, customerPhone: true }
    });

    const sellerIds = [...new Set(orders.map(o => o.sellerId).filter(Boolean))];
    const customerPhones = [...new Set(orders.map(o => o.customerPhone).filter(Boolean))];

    subscriptions = await prisma.pushSubscription.findMany({
      where: {
        OR: [
          { userId: { in: sellerIds } },
          { phone: { in: customerPhones } }
        ]
      }
    });
  } else {
    // Fallback: everyone
    subscriptions = await prisma.pushSubscription.findMany();
  }

  logger.info(`Broadcasting web push to ${subscriptions.length} subscription(s)`, { target });

  if (subscriptions.length === 0) {
    return { success: true, count: 0 };
  }

  // Send notifications in parallel
  const results = await Promise.all(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  const successCount = results.filter(r => r.success).length;

  return {
    success: true,
    total: subscriptions.length,
    successCount,
    failedCount: subscriptions.length - successCount,
  };
};

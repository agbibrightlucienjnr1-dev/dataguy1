import { getPrisma } from "../config/database.js";

export const upsertCustomerOnOrderPlacement = async ({
  customerPhone,
  customerName,
  orderCreatedAt,
}) => {
  const prisma = getPrisma();
  const sanitizedPhone = customerPhone.replace(/[^0-9]/g, "");
  const now = new Date();

  await prisma.customer.upsert({
    where: { phone: sanitizedPhone },
    create: {
      phone: sanitizedPhone,
      name: customerName,
      totalOrdersCount: 1,
      successfulOrdersCount: 0,
      firstOrderAt: orderCreatedAt || now,
      lastOrderAt: now,
    },
    update: {
      name: customerName || undefined,
      totalOrdersCount: {
        increment: 1,
      },
      lastOrderAt: now,
    },
  });
};

export const getCustomers = async (user) => {
  const prisma = getPrisma();

  if (user.role === "admin") {
    // Load tracked customers and merge with orders data for complete coverage
    const [trackedCustomers, totalOrdersByPhone, successOrdersByPhone] =
      await Promise.all([
        prisma.customer.findMany(),
        prisma.order.groupBy({
          by: ["customerPhone"],
          _count: { id: true },
          _max: { createdAt: true },
        }),
        prisma.order.groupBy({
          by: ["customerPhone"],
          _count: { id: true },
          where: { status: "completed" },
        }),
      ]);

    const customerMap = new Map();

    for (const c of trackedCustomers) {
      customerMap.set(c.phone, {
        phone: c.phone,
        name: c.name || null,
        totalOrdersCount: c.totalOrdersCount || 0,
        successfulOrdersCount: c.successfulOrdersCount || 0,
        lastOrderAt: c.lastOrderAt || c.createdAt,
      });
    }

    const totalMap = new Map(
      totalOrdersByPhone.map((row) => [row.customerPhone, row._count.id]),
    );
    const successMap = new Map(
      successOrdersByPhone.map((row) => [row.customerPhone, row._count.id]),
    );

    for (const [phone, totalCount] of totalMap.entries()) {
      const existing = customerMap.get(phone);
      if (existing) {
        existing.totalOrdersCount = Math.max(
          existing.totalOrdersCount,
          totalCount,
        );
        existing.successfulOrdersCount = Math.max(
          existing.successfulOrdersCount,
          successMap.get(phone) || 0,
        );
      } else {
        customerMap.set(phone, {
          phone,
          name: null,
          totalOrdersCount: totalCount,
          successfulOrdersCount: successMap.get(phone) || 0,
          lastOrderAt: null,
        });
      }
    }

    const customers = [...customerMap.values()];
    return customers.sort((a, b) => {
      const aDate = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
      const bDate = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  // For agents and sub-agents, return customer list from their own orders
  const sellerOrders = await prisma.order.findMany({
    where: {
      sellerId: user.id,
    },
    select: {
      customerPhone: true,
      customerName: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const customersMap = new Map();

  for (const order of sellerOrders) {
    const phone = order.customerPhone;
    if (!customersMap.has(phone)) {
      customersMap.set(phone, {
        phone,
        name: order.customerName || null,
        totalOrdersCount: 0,
        successfulOrdersCount: 0,
        lastOrderAt: order.createdAt,
      });
    }

    const existing = customersMap.get(phone);
    existing.totalOrdersCount += 1;
    if (order.status === "completed") {
      existing.successfulOrdersCount += 1;
    }
    if (order.createdAt > existing.lastOrderAt) {
      existing.lastOrderAt = order.createdAt;
    }
    if (!existing.name && order.customerName) {
      existing.name = order.customerName;
    }
  }

  return [...customersMap.values()].sort(
    (a, b) => b.lastOrderAt - a.lastOrderAt,
  );
};

export const incrementCustomerSuccessfulOrders = async ({
  customerPhone,
  customerName,
}) => {
  const prisma = getPrisma();
  const sanitizedPhone = customerPhone.replace(/[^0-9]/g, "");
  const now = new Date();

  await prisma.customer.upsert({
    where: { phone: sanitizedPhone },
    create: {
      phone: sanitizedPhone,
      name: customerName,
      totalOrdersCount: 0,
      successfulOrdersCount: 1,
      firstOrderAt: now,
      lastOrderAt: now,
    },
    update: {
      name: customerName || undefined,
      successfulOrdersCount: {
        increment: 1,
      },
      lastOrderAt: now,
    },
  });
};

/**
 * Manually add a batch of customers from the admin panel ensuring they bypass USSD limits
 * by receiving successfulOrdersCount = 1
 */
export const addCustomersManually = async (phones) => {
  const prisma = getPrisma();
  const now = new Date();
  
  // Clean, validate, and deduplicate
  const sanitizedPhones = [...new Set(
    (phones || [])
      .map(p => typeof p === 'string' ? p.replace(/[^0-9]/g, "") : "")
      .filter(p => /^0\d{9}$/.test(p) || /^233\d{9}$/.test(p) || /^\d{9}$/.test(p))
  )];

  if (sanitizedPhones.length === 0) return 0;
  
  let addedCount = 0;

  for (let phone of sanitizedPhones) {
    if (phone.length === 9) phone = "0" + phone;
    if (phone.startsWith("233")) phone = "0" + phone.slice(3);

    const existing = await prisma.customer.findUnique({ where: { phone } });

    if (!existing) {
      await prisma.customer.create({
        data: {
          phone,
          name: "Admin Added",
          totalOrdersCount: 1, 
          successfulOrdersCount: 1, // Crucial for USSD bypass
          firstOrderAt: now,
          lastOrderAt: now
        }
      });
      addedCount++;
    } else if (existing.successfulOrdersCount === 0) {
      await prisma.customer.update({
        where: { phone },
        data: { 
          successfulOrdersCount: 1,
          totalOrdersCount: existing.totalOrdersCount === 0 ? 1 : existing.totalOrdersCount
        } 
      });
      addedCount++;
    }
  }

  return addedCount;
};

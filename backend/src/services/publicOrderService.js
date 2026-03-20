import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { initializeTransaction } from "./paystackService.js";
import { logger } from "../utils/logger.js";
import { Prisma } from "@prisma/client";
import { upsertCustomerOnOrderPlacement } from "./customerService.js";

/**
 * Get seller by payment link code
 */
export const getSellerByCode = async (code) => {
  const prisma = getPrisma();

  const seller = await prisma.user.findUnique({
    where: { paymentLinkCode: code },
    select: {
      id: true,
      name: true,
      shopName: true,
      phone: true,
      role: true,
      paymentLinkCode: true,
    },
  });

  if (!seller) {
    throw new AppError("Invalid payment link", 404);
  }

  if (seller.role === "admin") {
    throw new AppError("Invalid seller", 400);
  }

  return seller;
};

/**
 * Get bundles with seller's pricing
 */
export const getBundlesWithSellerPricing = async (sellerCode) => {
  const prisma = getPrisma();

  // Get seller
  const seller = await getSellerByCode(sellerCode);

  // Get all active bundles
  const bundles = await prisma.dataBundle.findMany({
    where: { isActive: true },
    orderBy: [{ network: "asc" }, { volume: "asc" }],
  });

  // Get seller's prices
  let pricesMap = new Map();

  if (seller.role === "agent") {
    const agentPrices = await prisma.agentPrice.findMany({
      where: { agentId: seller.id },
      select: {
        bundleId: true,
        customerPrice: true,
      },
    });

    agentPrices.forEach((price) => {
      pricesMap.set(price.bundleId, price.customerPrice);
    });
  } else if (seller.role === "sub_agent") {
    const subAgentPrices = await prisma.subAgentPrice.findMany({
      where: { subAgentId: seller.id },
      select: {
        bundleId: true,
        customerPrice: true,
      },
    });

    subAgentPrices.forEach((price) => {
      pricesMap.set(price.bundleId, price.customerPrice);
    });
  }

  // Map bundles with seller's pricing
  const bundlesWithPricing = bundles
    .map((bundle) => {
      const price = pricesMap.get(bundle.id);
      if (!price) return null; // Skip bundles without pricing

      return {
        id: bundle.id,
        network: bundle.network,
        volume: bundle.volume,
        price: price,
        isActive: bundle.isActive,
      };
    })
    .filter(Boolean); // Remove null entries

  // Group by network
  const grouped = bundlesWithPricing.reduce((acc, bundle) => {
    if (!acc[bundle.network]) {
      acc[bundle.network] = [];
    }
    acc[bundle.network].push(bundle);
    return acc;
  }, {});

  return {
    seller: {
      name: seller.name,
      shopName: seller.shopName,
      phone: seller.phone,
      code: seller.paymentLinkCode,
    },
    bundles: grouped,
    totalBundles: bundlesWithPricing.length,
  };
};

/**
 * Create order from payment link
 */
export const createOrderFromLink = async (sellerCode, orderData) => {
  const prisma = getPrisma();
  const { customerPhone, customerName, bundleId } = orderData;

  // Get and validate seller
  const seller = await getSellerByCode(sellerCode);

  // Get bundle
  const bundle = await prisma.dataBundle.findUnique({
    where: { id: bundleId },
  });

  if (!bundle) {
    throw new AppError("Bundle not found", 404);
  }

  if (!bundle.isActive) {
    throw new AppError("Bundle is not available", 400);
  }

  // Get pricing based on seller type
  let pricePaid;

  if (seller.role === "agent") {
    const agentPrice = await prisma.agentPrice.findUnique({
      where: {
        agentId_bundleId: {
          agentId: seller.id,
          bundleId,
        },
      },
    });

    if (!agentPrice) {
      throw new AppError("This bundle is not available from this seller", 400);
    }

    pricePaid = agentPrice.customerPrice;
  } else if (seller.role === "sub_agent") {
    const subAgentPrice = await prisma.subAgentPrice.findUnique({
      where: {
        subAgentId_bundleId: {
          subAgentId: seller.id,
          bundleId,
        },
      },
    });

    if (!subAgentPrice) {
      throw new AppError("This bundle is not available from this seller", 400);
    }

    pricePaid = subAgentPrice.customerPrice;
  }

  // Check for recent duplicate order (same customer phone + bundle + seller within last 30 seconds)
  // This prevents accidental duplicate orders from double-clicks or page refreshes
  // Only blocks if there's an active (pending/payment_confirmed/processing) order
  // Completed/failed orders don't block, and different bundles/sellers are always allowed
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const existingOrder = await prisma.order.findFirst({
    where: {
      customerPhone,
      bundleId,
      sellerId: seller.id,
      createdAt: {
        gte: thirtySecondsAgo,
      },
      status: {
        in: ["pending", "payment_confirmed", "processing"], // Only block active orders
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // If a recent pending/processing order exists, return it instead of creating a new one
  if (existingOrder) {
    logger.info("Duplicate order prevented", {
      existingOrderId: existingOrder.id,
      customerPhone,
      bundleId,
    });

    // Re-initialize payment for the existing order if it doesn't have a payment reference
    if (!existingOrder.paymentReference) {
      const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/callback`;

      // Calculate total amount (pricePaid + transactionFee)
      const existingTotalAmount = existingOrder.pricePaid.add(
        existingOrder.transactionFee || 0,
      );

      const paymentData = await initializeTransaction({
        email: customerPhone + "@customer.dataguy.com",
        amount: existingTotalAmount.toString(), // Total amount including transaction fee
        reference: existingOrder.id,
        callbackUrl,
        metadata: {
          orderId: existingOrder.id,
          customerPhone,
          customerName,
          bundleId,
          sellerId: seller.id,
          sellerName: seller.name,
          bundleInfo: `${bundle.network} ${bundle.volume}`,
        },
      });

      // Return order without transactionFee for customer-facing response
      const { transactionFee: _, ...orderWithoutFee } = existingOrder;

      return {
        order: orderWithoutFee, // Exclude transactionFee from customer response
        payment: paymentData,
      };
    }

    // If payment already exists, just return the order (without transactionFee)
    const { transactionFee: __, ...orderWithoutFee2 } = existingOrder;

    return {
      order: orderWithoutFee2, // Exclude transactionFee from customer response
      payment: null, // Payment already initialized
    };
  }

  // Calculate transaction fee (hidden from customer)
  // If amount < 20: flat fee of 0.5
  // If amount >= 20: 4% of amount
  const priceAsNumber = parseFloat(pricePaid.toString());
  const transactionFee =
    priceAsNumber < 20 ? new Prisma.Decimal(0.5) : pricePaid.mul(0.04);
  const totalAmount = pricePaid.add(transactionFee); // Total amount to charge

  // Upsert customer record each time an order is created
  await upsertCustomerOnOrderPlacement({
    customerPhone,
    customerName,
    orderCreatedAt: new Date(),
  });

  // Create order
  const order = await prisma.order.create({
    data: {
      customerPhone,
      customerName,
      bundleId,
      sellerId: seller.id,
      sellerType: seller.role,
      pricePaid, // Original price (what customer sees)
      transactionFee, // Fee: 0.5 if < 20, else 4% (hidden from customer)
      status: "pending",
    },
    include: {
      bundle: true,
      seller: {
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  // Initialize Paystack transaction
  const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/callback`;

  // Initialize Paystack transaction with total amount (pricePaid + fee)
  const paymentData = await initializeTransaction({
    email: customerPhone + "@customer.dataguy.com", // Convert phone to email format
    amount: totalAmount.toString(), // Total amount including transaction fee
    reference: order.id,
    callbackUrl,
    metadata: {
      orderId: order.id,
      customerPhone,
      customerName,
      bundleId,
      sellerId: seller.id,
      sellerName: seller.name,
      bundleInfo: `${bundle.network} ${bundle.volume}`,
    },
  });

  // Return order without transactionFee for customer-facing response
  // Customers should only see pricePaid, not the hidden transaction fee
  const { transactionFee: _, ...orderWithoutFee } = order;

  return {
    order: orderWithoutFee, // Exclude transactionFee from customer response
    payment: paymentData,
  };
};

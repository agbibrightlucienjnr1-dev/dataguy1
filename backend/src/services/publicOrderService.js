import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { initializeTransaction } from "./paystackService.js";

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

  // Create order
  const order = await prisma.order.create({
    data: {
      customerPhone,
      customerName,
      bundleId,
      sellerId: seller.id,
      sellerType: seller.role,
      pricePaid,
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

  const paymentData = await initializeTransaction({
    email: customerPhone + "@customer.dataguy.com", // Convert phone to email format
    amount: pricePaid.toString(),
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

  return {
    order,
    payment: paymentData,
  };
};

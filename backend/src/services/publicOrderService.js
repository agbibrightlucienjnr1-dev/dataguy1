import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { initializeTransaction } from "./paystackService.js";
import { getActivePaymentProvider, getSystemSettings } from "./settingsService.js";
import { initiateMoolrePayment } from "./moolreService.js";
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
      parentAgentId: true,
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

  // Get parent agent prices if seller is sub_agent
  let parentPricesMap = new Map();
  if (seller.role === "sub_agent" && seller.parentAgentId) {
    const parentPrices = await prisma.agentPrice.findMany({
      where: { agentId: seller.parentAgentId },
      select: {
        bundleId: true,
        subAgentPrice: true,
      },
    });

    parentPrices.forEach((price) => {
      parentPricesMap.set(price.bundleId, price.subAgentPrice);
    });
  }

  // Map bundles with seller's pricing
  const bundlesWithPricing = bundles
    .map((bundle) => {
      let price = pricesMap.get(bundle.id);
      
      // If not set, apply fallbacks:
      if (!price) {
        if (seller.role === "agent") {
          price = bundle.adminPrice;
        } else if (seller.role === "sub_agent") {
          price = parentPricesMap.get(bundle.id) || bundle.adminPrice;
        }
      }

      return {
        id: bundle.id,
        network: bundle.network,
        volume: bundle.volume,
        price: price,
        isActive: bundle.isActive,
      };
    })
    .filter(Boolean); // Keep all active bundles

  // Group by network
  const grouped = bundlesWithPricing.reduce((acc, bundle) => {
    if (!acc[bundle.network]) {
      acc[bundle.network] = [];
    }
    acc[bundle.network].push(bundle);
    return acc;
  }, {});

  const settings = await getSystemSettings();
  const activeProvider = settings.activePaymentProvider;

  return {
    seller: {
      name: seller.name,
      shopName: seller.shopName,
      phone: seller.phone,
      code: seller.paymentLinkCode,
    },
    bundles: grouped,
    totalBundles: bundlesWithPricing.length,
    settings: {
      activePaymentProvider: activeProvider,
      moolreFlatFee: settings.moolreFlatFee,
      moolreFeePercentage: settings.moolreFeePercentage,
      paystackFlatFee: settings.paystackFlatFee,
      paystackFeePercentage: settings.paystackFeePercentage,
    }
  };
};

/**
 * Create order from payment link
 */
export const createOrderFromLink = async (sellerCode, orderData) => {
  const prisma = getPrisma();
  const { customerPhone, paymentNumber, network, customerName, bundleId } = orderData;

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

    pricePaid = agentPrice ? agentPrice.customerPrice : bundle.adminPrice;
  } else if (seller.role === "sub_agent") {
    const subAgentPrice = await prisma.subAgentPrice.findUnique({
      where: {
        subAgentId_bundleId: {
          subAgentId: seller.id,
          bundleId,
        },
      },
    });

    if (subAgentPrice) {
      pricePaid = subAgentPrice.customerPrice;
    } else {
      // Fallback to parent agent's subAgentPrice
      let parentPrice = null;
      if (seller.parentAgentId) {
        const parentAgentPrice = await prisma.agentPrice.findUnique({
          where: {
            agentId_bundleId: {
              agentId: seller.parentAgentId,
              bundleId,
            },
          },
        });
        parentPrice = parentAgentPrice ? parentAgentPrice.subAgentPrice : null;
      }
      pricePaid = parentPrice || bundle.adminPrice;
    }
  }

  // Check for recent duplicate order (same customer phone + bundle + seller within last 30 seconds)
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
      const activeProvider = await getActivePaymentProvider();
      
      // Calculate total amount (pricePaid + transactionFee)
      const existingTotalAmount = existingOrder.pricePaid.add(
        existingOrder.transactionFee || 0,
      );

      let paymentData;
      
      if (activeProvider === "moolre") {
        if (!network) throw new AppError("Network selection is required for Moolre payments", 400);

        paymentData = await initiateMoolrePayment({
          amount: existingTotalAmount,
          phone: paymentNumber || customerPhone,
          network,
          reference: existingOrder.id
        });

        // Update provider on order to track who initiated this successfully
        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { paymentProvider: "moolre" }
        });
      } else {
        const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/callback`;

        paymentData = await initializeTransaction({
          email: customerPhone + "@customer.dataguy.com",
          amount: existingTotalAmount.toString(),
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

        await prisma.order.update({
          where: { id: existingOrder.id },
          data: { paymentProvider: "paystack" }
        });
      }

      return {
        order: existingOrder,
        payment: paymentData,
      };
    }

    return {
      order: existingOrder,
      payment: null, // Payment already initialized
    };
  }

  // Calculate transaction fee
  const settings = await getSystemSettings();
  const activeProvider = settings.activePaymentProvider;
  const provider = activeProvider === "moolre" ? "moolre" : "paystack";
  
  const flatFee = provider === "moolre" ? settings.moolreFlatFee : settings.paystackFlatFee;
  const percentage = provider === "moolre" ? settings.moolreFeePercentage : settings.paystackFeePercentage;
  
  const priceAsNumber = parseFloat(pricePaid.toString());
  
  let transactionFeeValue;

  if (provider === "moolre") {
    // Your service fee: always a percentage (this is what is stored in DB)
    transactionFeeValue = pricePaid.mul(new Prisma.Decimal(percentage.toString()).div(100));
    
    logger.info("Moolre fee breakdown", {
      bundlePrice: priceAsNumber,
      serviceFee: transactionFeeValue.toString(),
    });
  } else {
    // Paystack: flat fee for small amounts, percentage for larger ones
    if (priceAsNumber < 20) {
      transactionFeeValue = flatFee;
    } else {
      transactionFeeValue = pricePaid.mul(new Prisma.Decimal(percentage.toString()).div(100));
    }
  }
  
  const transactionFee = new Prisma.Decimal(transactionFeeValue.toString());
  const totalAmount = pricePaid.add(transactionFee); // Total amount to charge customer (price + our fee)

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
      transactionFee, 
      status: "pending",
      paymentProvider: activeProvider
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

  let paymentData;
  
  if (activeProvider === "moolre") {
    if (!network) throw new AppError("Network selection is required for Moolre payments", 400);

    paymentData = await initiateMoolrePayment({
      amount: totalAmount,
      phone: paymentNumber || customerPhone,
      network,
      reference: order.id
    });
  } else {
    // Initialize Paystack transaction
    const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/callback`;

    // Initialize Paystack transaction with total amount (pricePaid + fee)
    paymentData = await initializeTransaction({
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
  }

  return {
    order,
    payment: paymentData,
  };
};

import { getPrisma } from "../config/database.js";
import { AppError } from "../middlewares/errorHandler.js";
import { Prisma } from "@prisma/client";

/**
 * Get agent's sub-agents with statistics
 */
export const getAgentSubAgents = async (agentId) => {
  const prisma = getPrisma();

  // Verify agent exists and is an agent
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
    include: {
      wallet: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!agent) {
    throw new AppError("Agent not found", 404);
  }

  if (agent.role !== "agent") {
    throw new AppError("User is not an agent", 400);
  }

  // Get all sub-agents for this agent
  const subAgents = await prisma.user.findMany({
    where: {
      parentAgentId: agentId,
      role: "sub_agent",
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      paymentLinkCode: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get statistics for each sub-agent
  const subAgentsWithStats = await Promise.all(
    subAgents.map(async (subAgent) => {
      // Get wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: { userId: subAgent.id },
        select: {
          balance: true,
          totalEarned: true,
        },
      });

      // Get order statistics
      const [orderStats, totalRevenue] = await Promise.all([
        prisma.order.groupBy({
          by: ["status"],
          where: { sellerId: subAgent.id },
          _count: true,
        }),
        prisma.order.aggregate({
          where: {
            sellerId: subAgent.id,
            status: { in: ["completed", "processing"] },
          },
          _sum: {
            pricePaid: true,
          },
        }),
      ]);

      // Get parent agent commission from sub-agent orders
      // We calculate this by finding wallet transactions with PARENT- prefix
      // that reference orders from this sub-agent
      const subAgentOrderIds = (
        await prisma.order.findMany({
          where: { sellerId: subAgent.id },
          select: { id: true },
        })
      ).map((o) => o.id);

      let totalParentCommission = new Prisma.Decimal(0);

      if (subAgentOrderIds.length > 0 && agent.wallet?.id) {
        const parentCommissions = await prisma.walletTransaction.findMany({
          where: {
            walletId: agent.wallet.id,
            type: "commission",
            reference: {
              in: subAgentOrderIds.map((id) => `PARENT-${id}`),
            },
          },
          select: {
            amount: true,
          },
        });

        totalParentCommission = parentCommissions.reduce(
          (sum, tx) => sum.add(tx.amount),
          new Prisma.Decimal(0),
        );
      }

      return {
        id: subAgent.id,
        name: subAgent.name,
        email: subAgent.email,
        phone: subAgent.phone,
        paymentLinkCode: subAgent.paymentLinkCode,
        registeredAt: subAgent.createdAt,
        walletBalance: wallet?.balance || "0.00",
        totalEarned: wallet?.totalEarned || "0.00",
        totalOrders: subAgent._count.orders,
        totalRevenue: totalRevenue._sum.pricePaid || "0.00",
        totalParentCommission: totalParentCommission.toString(),
        orderStats: orderStats.map((stat) => ({
          status: stat.status,
          count: stat._count,
        })),
      };
    }),
  );

  return {
    subAgents: subAgentsWithStats,
    total: subAgentsWithStats.length,
  };
};

/**
 * Update agent/sub-agent shop name
 */
export const updateAgentShopName = async (userId, shopName) => {
  const prisma = getPrisma();

  // Verify user exists and is agent or sub-agent
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "admin") {
    throw new AppError("Admins cannot set shop names", 400);
  }

  // Update shop name
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { shopName: shopName || null },
    select: {
      id: true,
      name: true,
      shopName: true,
      paymentLinkCode: true,
    },
  });

  return updated;
};

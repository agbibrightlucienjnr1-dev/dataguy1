import { getPrisma } from "../config/database.js";
import { logger } from "../utils/logger.js";
import { Prisma } from "@prisma/client";

/**
 * Log a traffic event robustly without blocking the main thread.
 */
export const trackEvent = async (eventData) => {
  try {
    const { sessionId, eventType, path, sellerId, device } = eventData;
    const prisma = getPrisma();

    // Fast-insert into Postgres
    await prisma.visitorLog.create({
      data: {
        sessionId,
        eventType,
        path,
        sellerId: sellerId || null,
        device,
      },
    });

  } catch (error) {
    logger.error("Failed to track analytics event", { error: error.message });
    // Silent fail so we don't crash the user
  }
};

/**
 * Pull aggregated traffic stats for the Dashboard
 * @param {number} days - Time window to pull
 */
export const getAnalyticsStats = async (days = 30) => {
  const prisma = getPrisma();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  try {
    const [
      totalPageViews,
      uniqueVisitors,
      ussdDials,
      checkoutStarts,
      totalOrders
    ] = await Promise.all([
      // 1. Total Page Views
      prisma.visitorLog.count({
        where: { eventType: "PAGE_VIEW", createdAt: { gte: dateFrom } },
      }),
      
      // 2. Unique Leads (distinct session IDs - Web + USSD)
      prisma.$queryRaw`SELECT COUNT(DISTINCT session_id) as count FROM visitor_logs WHERE created_at >= ${dateFrom}`,

      // 3. USSD Dials
      prisma.visitorLog.count({
        where: { eventType: "USSD_DIAL", createdAt: { gte: dateFrom } },
      }),

      // 4. Checkouts Started
      prisma.visitorLog.count({
        where: { eventType: "CHECKOUT_INITIATED", createdAt: { gte: dateFrom } },
      }),

      // 5. Total Successful Orders (as a conversion metric)
      prisma.order.count({
        where: { status: "completed", createdAt: { gte: dateFrom } },
      }),
    ]);

    // 6. Device Breakdown
    const deviceGroups = await prisma.visitorLog.groupBy({
      by: ['device'],
      _count: { device: true },
      where: { createdAt: { gte: dateFrom } }
    });

    const deviceBreakdown = deviceGroups.map(g => ({
      name: g.device || "Unknown",
      value: g._count.device
    }));

    // 7. Top Performing Agents by Footprints
    const topAgentGroups = await prisma.visitorLog.groupBy({
      by: ['sellerId'],
      _count: { sessionId: true },
      where: { sellerId: { not: null }, createdAt: { gte: dateFrom } },
      orderBy: { _count: { sessionId: 'desc' } },
      take: 5
    });

    let topAgents = [];
    if (topAgentGroups.length > 0) {
      const agentIds = topAgentGroups.map(g => g.sellerId);
      const agents = await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, name: true, agentCode: true }
      });
      // Merge
      topAgents = topAgentGroups.map(g => {
        const ag = agents.find(a => a.id === g.sellerId) || {};
        return {
          sellerId: g.sellerId,
          name: ag.name || "Unknown Agent",
          code: ag.agentCode || "???",
          views: g._count.sessionId
        };
      });
    }

    // 8. Top Entry Paths (most popular portal links)
    const topPaths = await prisma.visitorLog.groupBy({
      by: ['path'],
      _count: { sessionId: true },
      where: { eventType: "PAGE_VIEW", createdAt: { gte: dateFrom } },
      orderBy: { _count: { sessionId: 'desc' } },
      take: 5
    });

    const uniqueCount = uniqueVisitors[0] ? Number(uniqueVisitors[0].count) : 0;
    const conversionRate = uniqueCount > 0 ? ((totalOrders / uniqueCount) * 100).toFixed(2) : "0.00";

    return {
      totalPageViews,
      uniqueVisitors: uniqueCount,
      ussdDials,
      checkoutStarts,
      totalOrders,
      conversionRate: parseFloat(conversionRate),
      deviceBreakdown,
      topAgents,
      topPaths: topPaths.map(p => ({ path: p.path, views: p._count.sessionId }))
    };
  } catch (error) {
    logger.error("Error fetching analytics stats", error);
    throw new Error("Failed to load robust analytics");
  }
};

/**
 * Returns daily aggregate graph data for Recharts (Admin Page)
 */
export const getAnalyticsChartData = async (days = 7) => {
  const prisma = getPrisma();
  
  // To avoid complex timezone timezone raw queries, we map it via JS for small periods
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  try {
    const logs = await prisma.visitorLog.findMany({
      where: {
        createdAt: { gte: dateFrom },
        eventType: { in: ["PAGE_VIEW", "USSD_DIAL"] }
      },
      select: {
        createdAt: true,
        eventType: true,
        sessionId: true,
      }
    });

    const dateMap = {};

    // Initialize map
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0]; // YYYY-MM-DD
      dateMap[str] = { date: str, views: 0, ussd: 0, uniqueSessions: new Set() };
    }

    logs.forEach(log => {
      const dayStr = log.createdAt.toISOString().split("T")[0];
      if (dateMap[dayStr]) {
        if (log.eventType === "PAGE_VIEW") {
          dateMap[dayStr].views += 1;
          dateMap[dayStr].uniqueSessions.add(log.sessionId);
        } else if (log.eventType === "USSD_DIAL") {
          dateMap[dayStr].ussd += 1;
        }
      }
    });

    return Object.values(dateMap).map(d => ({
      date: d.date,
      views: d.views,
      unique: d.uniqueSessions.size,
      ussd: d.ussd
    }));
  } catch (error) {
    logger.error("Error fetching analytics chart data", error);
    return [];
  }
};

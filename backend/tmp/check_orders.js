import 'dotenv/config';
import { initDatabase, getPrisma } from '../src/config/database.js';

async function main() {
  try {
    await initDatabase();
    const prisma = getPrisma();

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        bundle: true
      }
    });

    console.log("Recent Orders:");
    recentOrders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}, Provider: ${order.paymentProvider}, Reference: ${order.paymentReference}, Hubnet ID: ${order.hubnetOrderId}, CreatedAt: ${order.createdAt}`);
    });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
  } finally {
    const prisma = getPrisma();
    if (prisma) await prisma.$disconnect();
  }
}

main();

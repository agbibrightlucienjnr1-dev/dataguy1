import 'dotenv/config';
import { initDatabase, getPrisma } from '../src/config/database.js';

async function main() {
  try {
    await initDatabase();
    const prisma = getPrisma();

    const moolreOrders = await prisma.order.findMany({
      where: { paymentProvider: 'moolre' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log("Recent Moolre Orders:");
    if (moolreOrders.length === 0) {
      console.log("No Moolre orders found.");
    }
    moolreOrders.forEach(order => {
      console.log(`ID: ${order.id}, Status: ${order.status}, phone: ${order.customerPhone}, CreatedAt: ${order.createdAt}`);
    });
  } catch (error) {
    console.error("Error fetching Moolre orders:", error);
  } finally {
    const prisma = getPrisma();
    if (prisma) await prisma.$disconnect();
  }
}

main();

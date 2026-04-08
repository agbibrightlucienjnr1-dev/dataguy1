import 'dotenv/config';
import { initDatabase, getPrisma } from '../src/config/database.js';
import { verifyOrderPayment } from '../src/services/paymentVerificationService.js';

async function main() {
  const orderId = 'd4904ff2-08dc-4947-9034-ce8d4697eb7b';
  try {
    await initDatabase();
    console.log(`Starting verification for order ${orderId}...`);
    const result = await verifyOrderPayment(orderId);
    console.log("Verification Result:", result);
  } catch (error) {
    console.error("Error during verification:", error);
  } finally {
    const prisma = getPrisma();
    if (prisma) await prisma.$disconnect();
  }
}

main();

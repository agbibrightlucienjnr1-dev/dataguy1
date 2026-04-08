import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to query User table...");
    const user = await prisma.user.findFirst();
    console.log("Success findFirst:", user);
  } catch (error) {
    console.error("Failed findFirst:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

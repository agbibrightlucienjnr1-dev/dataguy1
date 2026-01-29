import { config } from "dotenv";
config();

import { initDatabase, getPrisma, closeDatabase } from "./config/database.js";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "./utils/logger.js";

/**
 * Populate payment link codes for existing users
 */
async function populatePaymentCodes() {
  try {
    await initDatabase();
    const prisma = getPrisma();

    logger.info("Starting to populate payment link codes...");

    // Get all users without payment link codes
    const usersWithoutCodes = await prisma.user.findMany({
      where: {
        paymentLinkCode: null,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    logger.info(
      `Found ${usersWithoutCodes.length} users without payment codes`,
    );

    // Update each user with a unique code
    for (const user of usersWithoutCodes) {
      const code = createId();

      await prisma.user.update({
        where: { id: user.id },
        data: { paymentLinkCode: code },
      });

      logger.success(
        `✓ Updated ${user.name} (${user.role}) with code: ${code}`,
      );
    }

    logger.success(
      `\n✓ Successfully updated ${usersWithoutCodes.length} users`,
    );
  } catch (error) {
    logger.error("Error populating payment codes:", error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run the script
populatePaymentCodes()
  .then(() => {
    logger.success("\nPayment code population completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("\nPayment code population failed:", error);
    process.exit(1);
  });

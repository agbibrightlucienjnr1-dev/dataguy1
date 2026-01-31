import { getPrisma } from "./config/database.js";
import { hashPassword } from "./utils/password.js";
import { logger } from "./utils/logger.js";

/**
 * Seed an admin user
 * Run this script once to create the initial admin account
 * Can be called directly or imported and called from server startup
 * @param {boolean} shouldDisconnect - Whether to disconnect from database after seeding (default: false)
 */
export async function seedAdmin(shouldDisconnect = false) {
  const prisma = getPrisma();

  const adminData = {
    name: "Bright Lucien Jnr Agbi",
    email: "agbibrightlucienjnr@gmail.com",
    phone: "0533853708", // Change this
    password: "Admin@123", // Change this immediately after first login!
    role: "admin",
  };

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: "admin",
      },
    });

    if (existingAdmin) {
      logger.info("Admin user already exists - skipping seed");
      return { created: false, message: "Admin already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(adminData.password);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: adminData.name,
        email: adminData.email,
        phone: adminData.phone,
        passwordHash,
        role: adminData.role,
      },
    });

    logger.info("Admin user created successfully", {
      email: admin.email,
      phone: admin.phone,
    });
    console.log("✅ Admin user created successfully");
    console.log("📧 Email:", admin.email);
    console.log("📱 Phone:", admin.phone);
    console.log("⚠️ IMPORTANT: Change the admin password immediately!");

    return { created: true, admin };
  } catch (error) {
    logger.error("Error seeding admin", { error: error.message });
    console.error("❌ Error seeding admin:", error.message);
    throw error; // Re-throw so caller can handle it
  } finally {
    // Only disconnect if explicitly requested (when running directly)
    if (shouldDisconnect) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
      }
    }
  }
}

// Only run if this file is executed directly (not imported)
// Check if running as main module
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  process.argv[1]?.includes("seedAdmin.js");

if (isMainModule) {
  // Load environment variables if running directly
  import("dotenv").then((dotenv) => {
    dotenv.config();
    import("./config/database.js").then(({ initDatabase, closeDatabase }) => {
      initDatabase()
        .then(() => seedAdmin(true)) // Disconnect after seeding when run directly
        .then(() => closeDatabase())
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          console.error("Failed to seed admin:", error);
          process.exit(1);
        });
    });
  });
}

import { initDatabase } from "./config/database.js";
import { hashPassword } from "./utils/password.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Seed an admin user
 * Run this script once to create the initial admin account
 */
async function seedAdmin() {
  const prisma = await initDatabase();

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
      console.log("⚠️ Admin user already exists");
      return;
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

    console.log("✅ Admin user created successfully");
    console.log("📧 Email:", admin.email);
    console.log("📱 Phone:", admin.phone);
    console.log("⚠️ IMPORTANT: Change the admin password immediately!");
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

import { getDatabase, connectToDatabase } from "../db/mongodb";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function createDefaultAdmin() {
  try {
    // Ensure database connection
    await connectToDatabase();
    const db = getDatabase();

    console.log("🔍 Checking for existing admin users...");

    // Check if any admin user exists
    const existingAdmin = await db.collection("users").findOne({
      $or: [
        { userType: "admin" },
        { role: "super_admin" },
        { role: "admin" }
      ]
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return;
    }

    console.log("📦 Creating default admin user...");

    // Create default admin credentials
    const defaultAdmins = [
      {
        name: "Super Admin",
        email: "admin@ashishproperty.com",
        phone: "9999999999",
        password: "admin123",
        userType: "admin",
        role: "super_admin",
        username: "superadmin"
      },
      {
        name: "Test Admin",
        email: "test@ashishproperty.com", 
        phone: "8888888888",
        password: "test123",
        userType: "admin",
        role: "admin",
        username: "testadmin"
      }
    ];

    for (const adminData of defaultAdmins) {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

      // Create admin user
      const adminUser = {
        ...adminData,
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
        permissions: ["all"],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        isFirstLogin: false
      };

      const result = await db.collection("users").insertOne(adminUser);
      console.log(`✅ Created admin user: ${adminData.email} (${result.insertedId})`);
    }

    console.log("🎉 Default admin users created successfully!");

  } catch (error) {
    console.error("❌ Failed to create default admin:", error);
    throw error;
  }
}

// Run this script directly if called (Node.js compatible)
if (typeof require !== 'undefined' && require.main === module) {
  createDefaultAdmin()
    .then(() => {
      console.log("✅ Admin creation completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Admin creation failed:", error);
      process.exit(1);
    });
}

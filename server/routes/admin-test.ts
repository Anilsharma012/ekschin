import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { createDefaultAdmin } from "../scripts/createDefaultAdmin";

// Test admin connectivity
export const testAdminConnectivity: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Admin connectivity test requested");
    
    const db = getDatabase();
    
    // Test database connection
    const dbTest = await db.admin().ping();
    
    // Check if admin users exist
    const adminCount = await db.collection("users").countDocuments({
      $or: [
        { userType: "admin" },
        { role: "super_admin" },
        { role: "admin" }
      ]
    });

    res.json({
      success: true,
      data: {
        database: dbTest ? "connected" : "disconnected",
        adminUsers: adminCount,
        timestamp: new Date().toISOString(),
        server: "online"
      },
      message: "Admin connectivity test passed"
    });

  } catch (error) {
    console.error("❌ Admin connectivity test failed:", error);
    res.status(500).json({
      success: false,
      error: "Admin connectivity test failed",
      details: error.message
    });
  }
};

// Create default admin users
export const createDefaultAdminUsers: RequestHandler = async (req, res) => {
  try {
    console.log("📦 Creating default admin users...");
    
    await createDefaultAdmin();
    
    res.json({
      success: true,
      message: "Default admin users created successfully"
    });

  } catch (error) {
    console.error("❌ Failed to create default admin users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create default admin users",
      details: error.message
    });
  }
};

// Get admin user info (for testing)
export const getAdminUsers: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    const adminUsers = await db.collection("users").find({
      $or: [
        { userType: "admin" },
        { role: "super_admin" },
        { role: "admin" }
      ]
    }).project({
      _id: 1,
      name: 1,
      email: 1,
      userType: 1,
      role: 1,
      isActive: 1,
      createdAt: 1,
      lastLogin: 1
    }).toArray();

    res.json({
      success: true,
      data: adminUsers,
      count: adminUsers.length
    });

  } catch (error) {
    console.error("❌ Failed to get admin users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get admin users",
      details: error.message
    });
  }
};

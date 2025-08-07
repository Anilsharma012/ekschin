import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

interface StaffMember {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: "super_admin" | "content_manager" | "sales_manager" | "support_executive" | "admin";
  permissions: string[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

const rolePermissions = {
  super_admin: [
    "dashboard.view", "content.manage", "content.create", "content.view",
    "ads.manage", "ads.view", "ads.approve", "categories.manage",
    "packages.manage", "payments.manage", "payments.view", "payments.approve",
    "users.manage", "users.view", "sellers.manage", "sellers.verify", "sellers.view",
    "locations.manage", "reports.manage", "reports.view", "promotions.manage",
    "notifications.send", "staff.manage", "roles.manage", "blog.manage", "blog.view",
    "support.view", "system.manage", "system.view", "system.test", "system.update", "system.debug",
    "analytics.view"
  ],
  content_manager: [
    "dashboard.view", "content.manage", "content.create", "content.view",
    "blog.manage", "blog.view", "ads.view", "support.view"
  ],
  sales_manager: [
    "dashboard.view", "users.view", "sellers.manage", "sellers.verify", "sellers.view",
    "payments.view", "packages.manage", "ads.view", "analytics.view"
  ],
  support_executive: [
    "dashboard.view", "users.view", "support.view", "reports.view", "content.view"
  ],
  admin: [
    "dashboard.view", "content.view", "users.view", "ads.view", "analytics.view"
  ]
};

// Get all staff members
export const getAllStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { role, status } = req.query;

    const filter: any = {};
    if (role && role !== "all") filter.role = role;
    if (status && status !== "all") filter.status = status;

    const staff = await db
      .collection("users")
      .find(
        { 
          ...filter,
          $or: [
            { userType: "admin" },
            { role: { $exists: true } }
          ]
        },
        { projection: { password: 0 } }
      )
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<StaffMember[]> = {
      success: true,
      data: staff as StaffMember[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch staff",
    });
  }
};

// Create new staff member with auto-generated credentials
export const createStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      name,
      email,
      phone,
      role = "admin",
      status = "active",
      autoGeneratePassword = true,
    } = req.body;
    const createdBy = (req as any).userId;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Check if email already exists
    const existingUser = await db
      .collection("users")
      .findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Generate password if not provided
    let password = req.body.password;
    if (autoGeneratePassword || !password) {
      // Generate a secure random password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&';
      password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get permissions for role
    const permissions = rolePermissions[role] || rolePermissions.admin;

    // Create username from email (first part before @)
    const username = email.split('@')[0].toLowerCase();

    const newStaff: Omit<StaffMember, "_id"> = {
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      permissions,
      status,
      userType: "staff", // All staff members are userType: "staff"
      username, // Add username for login
      isFirstLogin: true, // Flag to force password change on first login
      loginCredentials: {
        username,
        tempPassword: password, // Store temporarily for email notification
        generatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    const result = await db.collection("users").insertOne(newStaff);

    // Log the credential creation for admin notification
    await db.collection("staff_notifications").insertOne({
      staffId: result.insertedId,
      type: "credentials_created",
      data: {
        name,
        email,
        username,
        role,
        password, // This will be shown to admin and sent via email
      },
      createdAt: new Date(),
      notifiedAt: null,
    });

    // Remove temporary password from response for security
    delete newStaff.loginCredentials.tempPassword;

    const response: ApiResponse<{
      _id: string;
      loginCredentials: {
        username: string;
        password: string;
        email: string;
        role: string;
      }
    }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        loginCredentials: {
          username,
          password, // Send password in response for admin to share
          email,
          role,
        }
      },
      message: `Staff member created successfully! Login credentials: Username: ${username}, Password: ${password}`,
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create staff member",
    });
  }
};

// Update staff member
export const updateStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    // Remove sensitive fields from update
    delete updateData._id;
    delete updateData.password; // Password updates should be separate
    delete updateData.createdAt;
    delete updateData.createdBy;

    // Update permissions if role changed
    if (updateData.role) {
      updateData.permissions = rolePermissions[updateData.role] || rolePermissions.admin;
    }

    updateData.updatedAt = new Date();

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(staffId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff member updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff member",
    });
  }
};

// Delete staff member
export const deleteStaff: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(staffId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff member deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete staff member",
    });
  }
};

// Update staff status
export const updateStaffStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    if (!["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(staffId) },
        { 
          $set: { 
            status,
            updatedAt: new Date(),
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Staff status updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating staff status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update staff status",
    });
  }
};

// Update staff password
export const updateStaffPassword: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { staffId } = req.params;
    const { newPassword } = req.body;

    if (!ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid staff ID",
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(staffId) },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date(),
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Password updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update password",
    });
  }
};

// Get available roles and permissions
export const getRolesAndPermissions: RequestHandler = async (req, res) => {
  try {
    const roles = [
      {
        id: "super_admin",
        name: "Super Admin",
        description: "Full access to all features and settings",
        permissions: rolePermissions.super_admin,
      },
      {
        id: "content_manager",
        name: "Content Manager",
        description: "Manage pages, blogs, and content",
        permissions: rolePermissions.content_manager,
      },
      {
        id: "sales_manager",
        name: "Sales Manager",
        description: "Manage leads, properties, and sales",
        permissions: rolePermissions.sales_manager,
      },
      {
        id: "support_executive",
        name: "Support Executive",
        description: "Handle user queries and support",
        permissions: rolePermissions.support_executive,
      },
      {
        id: "admin",
        name: "Admin",
        description: "General admin access",
        permissions: rolePermissions.admin,
      },
    ];

    const response: ApiResponse<any[]> = {
      success: true,
      data: roles,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch roles",
    });
  }
};

// Check user permissions middleware
export const checkPermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    const userPermissions = req.userPermissions || [];
    const userRole = req.userRole;

    // Super admin has all permissions
    if (userRole === "super_admin" || userPermissions.includes("*")) {
      return next();
    }

    // Check if user has the specific permission
    if (userPermissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Insufficient permissions",
    });
  };
};

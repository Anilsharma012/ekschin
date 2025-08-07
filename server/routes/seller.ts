import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

// Get seller's properties
export const getSellerProperties: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    const properties = await db
      .collection("properties")
      .find({ userId: new ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: properties,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller properties:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch properties",
    });
  }
};

// Get seller notifications
export const getSellerNotifications: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    // Get notifications for this seller from unified collection
    const notifications = await db
      .collection("notifications")
      .find({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller" },
          { sellerId: new ObjectId(sellerId) } // Support legacy format
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Create some sample notifications if none exist
    if (notifications.length === 0) {
      const sampleNotifications = [
        {
          sellerId: new ObjectId(sellerId),
          title: "Welcome to Seller Dashboard",
          message: "Your seller account has been successfully activated. You can now start posting properties!",
          type: "account",
          isRead: false,
          createdAt: new Date(),
        },
        {
          sellerId: new ObjectId(sellerId),
          title: "Property Approval Guidelines",
          message: "Please ensure your property listings follow our guidelines for faster approval.",
          type: "general",
          isRead: false,
          createdAt: new Date(),
        },
      ];

      await db.collection("notifications").insertMany(sampleNotifications);
      
      const response: ApiResponse<any[]> = {
        success: true,
        data: sampleNotifications,
      };
      return res.json(response);
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: notifications,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller notifications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

// Mark notification as read
export const markNotificationAsRead: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { notificationId } = req.params;
    const sellerId = (req as any).userId;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    await db.collection("notifications").updateOne(
      { 
        _id: new ObjectId(notificationId), 
        sellerId: new ObjectId(sellerId) 
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
};

// Delete notification
export const deleteSellerNotification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { notificationId } = req.params;
    const sellerId = (req as any).userId;

    if (!ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification ID",
      });
    }

    await db.collection("notifications").deleteOne({
      _id: new ObjectId(notificationId),
      sellerId: new ObjectId(sellerId),
    });

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
};

// Get seller messages from buyers
export const getSellerMessages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    // Get messages where seller is the recipient
    const messages = await db
      .collection("property_inquiries")
      .find({ sellerId: new ObjectId(sellerId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Enhance messages with buyer and property details
    const enhancedMessages = await Promise.all(
      messages.map(async (message) => {
        // Get buyer details
        const buyer = await db.collection("users").findOne(
          { _id: message.buyerId },
          { projection: { name: 1, email: 1, phone: 1 } }
        );

        // Get property details
        const property = await db.collection("properties").findOne(
          { _id: message.propertyId },
          { projection: { title: 1, price: 1 } }
        );

        return {
          ...message,
          buyerName: buyer?.name || "Unknown Buyer",
          buyerEmail: buyer?.email || "",
          buyerPhone: buyer?.phone || "",
          propertyTitle: property?.title || "Unknown Property",
          propertyPrice: property?.price || 0,
          timestamp: message.createdAt,
          isRead: message.isRead || false,
        };
      })
    );

    const response: ApiResponse<any[]> = {
      success: true,
      data: enhancedMessages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages",
    });
  }
};

// Get available packages for sellers
export const getSellerPackages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Get packages from unified database or create sample ones
    let packages = await db.collection("packages").find({
      $or: [
        { targetUserType: "seller" },
        { category: "advertisement" } // Legacy support
      ]
    }).toArray();

    if (packages.length === 0) {
      // Create sample packages
      const samplePackages = [
        {
          name: "Basic Plan",
          price: 999,
          features: [
            "Post up to 5 properties",
            "Basic listing visibility",
            "Email support",
            "Valid for 30 days"
          ],
          duration: 30,
          type: "basic",
          isActive: true,
          createdAt: new Date(),
        },
        {
          name: "Premium Plan",
          price: 2499,
          features: [
            "Post up to 15 properties",
            "Featured listing placement",
            "Priority in search results",
            "Phone & email support",
            "Property promotion tools",
            "Valid for 60 days"
          ],
          duration: 60,
          type: "premium",
          isActive: true,
          createdAt: new Date(),
        },
        {
          name: "Elite Plan",
          price: 4999,
          features: [
            "Unlimited property postings",
            "Top featured placement",
            "Premium badge on profile",
            "Dedicated account manager",
            "Advanced analytics",
            "Priority customer support",
            "Valid for 90 days"
          ],
          duration: 90,
          type: "elite",
          isActive: true,
          createdAt: new Date(),
        },
      ];

      await db.collection("packages").insertMany(samplePackages);
      packages = samplePackages;
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: packages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller packages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch packages",
    });
  }
};

// Get seller payment history
export const getSellerPayments: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;

    const payments = await db
      .collection("payments")
      .find({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller" },
          { sellerId: new ObjectId(sellerId) } // Support legacy format
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: payments,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller payments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments",
    });
  }
};

// Update seller profile
export const updateSellerProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;
    const { name, email, phone, emailNotifications, pushNotifications } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required",
      });
    }

    // Check if email already exists for another user
    const existingUser = await db.collection("users").findOne({
      email,
      _id: { $ne: new ObjectId(sellerId) },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // Update user profile
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          name,
          email,
          phone,
          emailNotifications: emailNotifications ?? true,
          pushNotifications: pushNotifications ?? true,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

// Change seller password
export const changeSellerPassword: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const sellerId = (req as any).userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Get current user
    const user = await db.collection("users").findOne({
      _id: new ObjectId(sellerId),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing seller password:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// Purchase package
export const purchasePackage: RequestHandler = async (req, res) => {
  try {
    // Ensure database is connected
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      console.log("💳 Database not ready for package purchase, attempting to connect...");
      const { connectToDatabase } = await import("../db/mongodb");
      await connectToDatabase();
      db = getDatabase();
    }

    const sellerId = (req as any).userId;
    const { packageId, paymentMethod, paymentDetails } = req.body;

    console.log("💳 Package purchase request:", { sellerId, packageId, paymentMethod });

    if (!ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid package ID",
      });
    }

    // Get package details from ad_packages collection
    const packageDetails = await db.collection("ad_packages").findOne({
      _id: new ObjectId(packageId),
      active: true // Only allow purchasing active packages
    });

    if (!packageDetails) {
      return res.status(404).json({
        success: false,
        error: "Package not found or unavailable",
      });
    }

    console.log("💳 Found package:", packageDetails.name, "Price:", packageDetails.price);

    // Check if user already has this package active
    const existingUserPackage = await db.collection("user_packages").findOne({
      userId: new ObjectId(sellerId),
      packageId: new ObjectId(packageId),
      status: 'active'
    });

    if (existingUserPackage) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription for this package",
      });
    }

    // Create user package record
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + packageDetails.duration);

    const userPackage = {
      userId: new ObjectId(sellerId),
      packageId: new ObjectId(packageId),
      package: {
        _id: packageDetails._id,
        name: packageDetails.name,
        description: packageDetails.description,
        price: packageDetails.price,
        duration: packageDetails.duration,
        type: packageDetails.type,
        features: packageDetails.features
      },
      status: 'active',
      purchaseDate: new Date(),
      expiryDate: expiryDate,
      paymentMethod: paymentMethod || "online",
      totalAmount: packageDetails.price,
      usageStats: {
        propertiesPosted: 0,
        featuredListings: 0,
        premiumBoosts: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userPackageResult = await db.collection("user_packages").insertOne(userPackage);
    console.log("💳 Created user package:", userPackageResult.insertedId);

    // Create payment record
    const payment = {
      userId: new ObjectId(sellerId),
      sellerId: new ObjectId(sellerId), // For backward compatibility
      packageId: new ObjectId(packageId),
      userPackageId: userPackageResult.insertedId,
      packageName: packageDetails.name,
      amount: packageDetails.price,
      paymentMethod: paymentMethod || "online",
      paymentDetails: paymentDetails || {},
      status: "completed", // In real implementation, this would be pending until payment gateway confirms
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      date: new Date(),
      createdAt: new Date(),
    };

    const paymentResult = await db.collection("payments").insertOne(payment);
    console.log("💳 Created payment record:", paymentResult.insertedId);

    // Update seller's current package status
    await db.collection("users").updateOne(
      { _id: new ObjectId(sellerId) },
      {
        $set: {
          currentPackage: packageDetails.name,
          packageType: packageDetails.type,
          packageExpiresAt: new Date(Date.now() + packageDetails.duration * 24 * 60 * 60 * 1000),
          isPremium: packageDetails.type !== "basic",
          updatedAt: new Date(),
        },
      }
    );

    // Create notification for successful purchase
    await db.collection("notifications").insertOne({
      sellerId: new ObjectId(sellerId),
      title: "Package Purchase Successful",
      message: `You have successfully purchased the ${packageDetails.name}. Your account has been upgraded!`,
      type: "account",
      isRead: false,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: "Package purchased successfully",
      data: {
        transactionId: payment.transactionId,
        package: packageDetails.name,
        amount: packageDetails.price,
      },
    });
  } catch (error) {
    console.error("Error purchasing package:", error);
    res.status(500).json({
      success: false,
      error: "Failed to purchase package",
    });
  }
};

// Get seller dashboard stats
export const getSellerStats: RequestHandler = async (req, res) => {
  try {
    // Ensure database is connected
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      console.log("📊 Database not ready for seller stats, attempting to connect...");
      const { connectToDatabase } = await import("../db/mongodb");
      await connectToDatabase();
      db = getDatabase();
    }

    const sellerId = (req as any).userId;
    console.log("📊 Fetching seller stats for:", sellerId);

    // Get properties stats
    const properties = await db
      .collection("properties")
      .find({ userId: new ObjectId(sellerId) })
      .toArray();

    console.log("📊 Found properties:", properties.length);

    // Get notifications stats
    const unreadNotifications = await db
      .collection("notifications")
      .countDocuments({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller", isRead: false },
          { sellerId: new ObjectId(sellerId), isRead: false } // Support legacy format
        ]
      });

    // Get messages stats from chat conversations
    const unreadMessages = await db
      .collection("chat_conversations")
      .countDocuments({
        participants: sellerId,
        unreadCount: { $gt: 0 }
      });

    // Get seller's package purchases
    const userPackages = await db
      .collection("user_packages")
      .find({ userId: new ObjectId(sellerId) })
      .toArray();

    // Calculate revenue from package purchases
    const revenue = userPackages.reduce((sum, pkg) => sum + (pkg.totalAmount || 0), 0);

    // Calculate stats
    const stats = {
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.approvalStatus === 'approved').length,
      pendingApproval: properties.filter(p => p.approvalStatus === 'pending').length,
      approved: properties.filter(p => p.approvalStatus === 'approved').length,
      rejected: properties.filter(p => p.approvalStatus === 'rejected').length,
      totalViews: properties.reduce((sum, prop) => sum + (prop.views || 0), 0),
      totalInquiries: properties.reduce((sum, prop) => sum + (prop.inquiries || 0), 0),
      unreadNotifications,
      unreadMessages,
      premiumListings: properties.filter(p => p.isPremium || p.featured).length,
      revenue,
      profileViews: Math.floor(Math.random() * 500) + 100, // Mock data - could be tracked separately
    };

    console.log("📊 Seller stats calculated:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
    });
  }
};

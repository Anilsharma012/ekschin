import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { packageSyncService } from "../services/packageSyncService";

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

    // Get notifications for this seller from user_notifications collection
    const userNotifications = await db
      .collection("user_notifications")
      .find({ userId: new ObjectId(sellerId) })
      .sort({ sentAt: -1 })
      .toArray();

    // Also get legacy notifications
    const legacyNotifications = await db
      .collection("notifications")
      .find({
        $or: [
          { userId: new ObjectId(sellerId), userType: "seller" },
          { sellerId: new ObjectId(sellerId) }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Combine and format notifications
    const allNotifications = [
      ...userNotifications.map(notif => ({
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        isRead: !!notif.readAt,
        readAt: notif.readAt,
        createdAt: notif.sentAt,
        sentBy: 'admin', // Admin notifications
        status: notif.status || 'delivered'
      })),
      ...legacyNotifications.map(notif => ({
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        isRead: notif.isRead || false,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        sentBy: 'system',
        status: 'delivered'
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Create welcome notification if no notifications exist
    if (allNotifications.length === 0) {
      const welcomeNotification = {
        userId: new ObjectId(sellerId),
        title: "Welcome to Seller Dashboard! 🎉",
        message: "आपका seller account successfully activate हो गया है। अब आप properties post कर सकते हैं!",
        type: "welcome",
        sentAt: new Date(),
        readAt: null,
        status: "delivered",
        recipientInfo: {
          userType: "seller"
        }
      };

      await db.collection("user_notifications").insertOne(welcomeNotification);

      allNotifications.push({
        _id: welcomeNotification._id,
        title: welcomeNotification.title,
        message: welcomeNotification.message,
        type: welcomeNotification.type,
        isRead: false,
        readAt: null,
        createdAt: welcomeNotification.sentAt,
        sentBy: 'system',
        status: 'delivered'
      });
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: allNotifications,
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

    // Try to update in user_notifications first (admin notifications)
    const userNotifResult = await db.collection("user_notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        userId: new ObjectId(sellerId)
      },
      { $set: { readAt: new Date() } }
    );

    // If not found in user_notifications, try legacy notifications
    if (userNotifResult.matchedCount === 0) {
      await db.collection("notifications").updateOne(
        {
          _id: new ObjectId(notificationId),
          $or: [
            { sellerId: new ObjectId(sellerId) },
            { userId: new ObjectId(sellerId) }
          ]
        },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }

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

    // Get the created user package with ID for broadcast
    const createdUserPackage = await db.collection("user_packages").findOne({ _id: userPackageResult.insertedId });

    // Broadcast user package creation to the user for real-time updates
    if (createdUserPackage) {
      packageSyncService.broadcastUserPackageCreated(createdUserPackage);
    }

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

// Get seller profile with plan details
export const getSellerProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    // Get user profile
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Get active user package for plan details
    const activePackage = await db.collection("user_packages").findOne({
      userId: userId,
      status: "active",
      expiryDate: { $gt: new Date() }
    });

    let planDetails = null;

    if (activePackage) {
      const packageDetails = await db.collection("packages").findOne({
        _id: new ObjectId(activePackage.packageId)
      });

      if (packageDetails) {
        const remainingDays = Math.max(0, Math.ceil(
          (new Date(activePackage.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ));

        planDetails = {
          planType: packageDetails.type || "Premium",
          startDate: activePackage.purchaseDate,
          expiryDate: activePackage.expiryDate,
          remainingDays,
          features: packageDetails.features || [],
          usage: {
            propertiesPosted: activePackage.usageStats?.propertiesPosted || 0,
            maxProperties: packageDetails.limits?.maxProperties || 10,
            featuredListings: activePackage.usageStats?.featuredListings || 0,
            maxFeaturedListings: packageDetails.limits?.maxFeaturedListings || 5,
            premiumBoosts: activePackage.usageStats?.premiumBoosts || 0,
            maxPremiumBoosts: packageDetails.limits?.maxPremiumBoosts || 3
          }
        };
      }
    } else {
      // Free plan
      planDetails = {
        planType: "Free",
        startDate: user.createdAt,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        remainingDays: 365,
        features: [
          "Post up to 2 properties",
          "Basic listing visibility",
          "Email support"
        ],
        usage: {
          propertiesPosted: 0,
          maxProperties: 2,
          featuredListings: 0,
          maxFeaturedListings: 0,
          premiumBoosts: 0,
          maxPremiumBoosts: 0
        }
      };
    }

    // Enhanced profile with default values
    const profile = {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      alternativePhone: user.profile?.alternativePhone || "",
      whatsappNumber: user.profile?.whatsappNumber || "",
      address: user.profile?.address || "",
      city: user.profile?.city || "",
      state: user.profile?.state || "",
      pincode: user.profile?.pincode || "",
      shopName: user.profile?.shopName || "",
      shopAddress: user.profile?.shopAddress || "",
      gstNumber: user.profile?.gstNumber || "",
      description: user.profile?.description || "",
      profilePicture: user.profile?.profilePicture || "",
      coverPhoto: user.profile?.coverPhoto || "",
      businessCategory: user.profile?.businessCategory || "",
      website: user.profile?.website || "",
      socialLinks: user.profile?.socialLinks || {},
      preferences: {
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? false,
        pushNotifications: user.preferences?.pushNotifications ?? true,
        profileVisibility: user.preferences?.profileVisibility ?? true,
        contactInfoVisible: user.preferences?.contactInfoVisible ?? true,
        businessHours: user.preferences?.businessHours || {
          monday: { open: "09:00", close: "18:00", closed: false },
          tuesday: { open: "09:00", close: "18:00", closed: false },
          wednesday: { open: "09:00", close: "18:00", closed: false },
          thursday: { open: "09:00", close: "18:00", closed: false },
          friday: { open: "09:00", close: "18:00", closed: false },
          saturday: { open: "09:00", close: "18:00", closed: false },
          sunday: { open: "10:00", close: "17:00", closed: true }
        }
      },
      verification: {
        emailVerified: user.emailVerified || false,
        phoneVerified: user.phoneVerified || false,
        documentVerified: user.profile?.documentVerified || false,
        profileCompleted: user.profile?.profileCompleted || false
      }
    };

    const response: ApiResponse<{
      profile: any;
      plan: any;
    }> = {
      success: true,
      data: {
        profile,
        plan: planDetails
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch seller profile"
    });
  }
};

// Update seller profile
export const updateSellerProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const updateData = req.body;

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.phone) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and phone are required"
      });
    }

    // Prepare update object
    const userUpdate: any = {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone,
      updatedAt: new Date()
    };

    // Profile data
    const profileUpdate = {
      alternativePhone: updateData.alternativePhone,
      whatsappNumber: updateData.whatsappNumber,
      address: updateData.address,
      city: updateData.city,
      state: updateData.state,
      pincode: updateData.pincode,
      shopName: updateData.shopName,
      shopAddress: updateData.shopAddress,
      gstNumber: updateData.gstNumber,
      description: updateData.description,
      businessCategory: updateData.businessCategory,
      website: updateData.website,
      socialLinks: updateData.socialLinks
    };

    // Preferences
    const preferencesUpdate = updateData.preferences;

    // Update user document
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          ...userUpdate,
          profile: profileUpdate,
          preferences: preferencesUpdate
        }
      }
    );

    const response: ApiResponse<{ updated: boolean }> = {
      success: true,
      data: { updated: true },
      message: "Profile updated successfully"
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update seller profile"
    });
  }
};

// Upload profile picture
export const uploadProfilePicture: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    // In a real implementation, you would:
    // 1. Handle file upload to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Resize and optimize the image
    // 3. Store the URL in the database

    // For now, we'll simulate a successful upload
    const profilePictureUrl = `/uploads/profiles/${userId}-${Date.now()}.jpg`;

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          "profile.profilePicture": profilePictureUrl,
          updatedAt: new Date()
        }
      }
    );

    const response: ApiResponse<{ profilePicture: string }> = {
      success: true,
      data: { profilePicture: profilePictureUrl },
      message: "Profile picture uploaded successfully"
    };

    res.json(response);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload profile picture"
    });
  }
};

import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { BannerAd, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

// Get active banners for specific position
export const getBannersByPosition: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { position } = req.params;

    const currentDate = new Date();

    const banners = await db
      .collection("banners")
      .find({
        position,
        active: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      })
      .sort({ priority: -1, createdAt: -1 })
      .toArray();

    const response: ApiResponse<BannerAd[]> = {
      success: true,
      data: banners as BannerAd[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch banners",
    });
  }
};

// Get all banners (admin only)
export const getAllBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", position, active } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (position) filter.position = position;
    if (active !== undefined) filter.active = active === "true";

    const banners = await db
      .collection("banners")
      .find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("banners").countDocuments(filter);

    const response: ApiResponse<{
      banners: BannerAd[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        banners: banners as BannerAd[],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch banners",
    });
  }
};

// Create new banner (admin only)
export const createBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const bannerData: Omit<BannerAd, "_id"> = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("banners").insertOne(bannerData);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create banner",
    });
  }
};

// Update banner (admin only)
export const updateBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { bannerId } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    delete updateData._id;

    const result = await db
      .collection("banners")
      .updateOne({ _id: new ObjectId(bannerId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Banner not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Banner updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update banner",
    });
  }
};

// Delete banner (admin only)
export const deleteBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { bannerId } = req.params;

    const result = await db
      .collection("banners")
      .deleteOne({ _id: new ObjectId(bannerId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Banner not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Banner deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete banner",
    });
  }
};

// Upload banner image
export const uploadBannerImage: RequestHandler = async (req, res) => {
  try {
    // In a real implementation, you would handle file upload here
    // For now, we'll return a placeholder URL
    const imageUrl = `/uploads/banners/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;

    const response: ApiResponse<{ imageUrl: string }> = {
      success: true,
      data: { imageUrl },
    };

    res.json(response);
  } catch (error) {
    console.error("Error uploading banner image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload banner image",
    });
  }
};

// Initialize default banners
export const initializeBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if banners already exist
    const existingCount = await db.collection("banners").countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "Banners already initialized",
      });
    }

    const defaultBanners: Omit<BannerAd, "_id">[] = [
      {
        title: "Welcome to Aashish Property",
        description: "Find your dream property in Rohtak",
        image:
          "https://via.placeholder.com/1200x300?text=Welcome+to+Aashish+Property",
        position: "homepage_top",
        active: true,
        priority: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Premium Properties in Rohtak",
        description: "Explore premium residential and commercial properties",
        image: "https://via.placeholder.com/600x200?text=Premium+Properties",
        position: "homepage_middle",
        active: true,
        priority: 9,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Post Your Property",
        description: "List your property for free",
        image: "https://via.placeholder.com/400x300?text=Post+Property",
        position: "property_sidebar",
        active: true,
        priority: 8,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("banners").insertMany(defaultBanners);

    res.json({
      success: true,
      message: "Banners initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing banners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize banners",
    });
  }
};

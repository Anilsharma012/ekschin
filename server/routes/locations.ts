import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { RohtakLocation, LocationSearchFilters, ROHTAK_LOCATION_DATA } from "@shared/location-types";
import { ObjectId } from "mongodb";

// Get all locations with filtering and search
export const getAllLocations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { 
      type, 
      search, 
      isActive, 
      isPopular, 
      parentId,
      page = "1", 
      limit = "50" 
    } = req.query as LocationSearchFilters & { [key: string]: string };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isPopular !== undefined) {
      filter.isPopular = isPopular === 'true';
    }
    
    if (parentId) {
      filter.parentId = parentId;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { aliases: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const locations = await db
      .collection("locations")
      .find(filter)
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("locations").countDocuments(filter);

    const response: ApiResponse<{
      locations: RohtakLocation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        locations: locations as RohtakLocation[],
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
    console.error("Error fetching locations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch locations",
    });
  }
};

// Get locations grouped by type for property posting
export const getLocationsByType: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const pipeline = [
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$type",
          locations: {
            $push: {
              _id: "$_id",
              name: "$name",
              isPopular: "$isPopular",
              pincode: "$pincode",
              order: "$order"
            }
          }
        }
      },
      {
        $project: {
          type: "$_id",
          locations: {
            $sortArray: {
              input: "$locations",
              sortBy: { order: 1, name: 1 }
            }
          }
        }
      },
      { $sort: { type: 1 } }
    ];

    const result = await db.collection("locations").aggregate(pipeline).toArray();

    const response: ApiResponse<any> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching locations by type:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch locations by type",
    });
  }
};

// Get popular locations for quick selection
export const getPopularLocations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const locations = await db
      .collection("locations")
      .find({ isActive: true, isPopular: true })
      .sort({ order: 1, name: 1 })
      .limit(20)
      .toArray();

    const response: ApiResponse<RohtakLocation[]> = {
      success: true,
      data: locations as RohtakLocation[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching popular locations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch popular locations",
    });
  }
};

// Search locations with autocomplete
export const searchLocations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { q, limit = "10" } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    const limitNum = parseInt(limit as string);

    const locations = await db
      .collection("locations")
      .find({
        isActive: true,
        $or: [
          { name: { $regex: q, $options: "i" } },
          { aliases: { $in: [new RegExp(q, "i")] } }
        ]
      })
      .sort({ isPopular: -1, order: 1, name: 1 })
      .limit(limitNum)
      .toArray();

    const response: ApiResponse<RohtakLocation[]> = {
      success: true,
      data: locations as RohtakLocation[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error searching locations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search locations",
    });
  }
};

// Admin: Create new location
export const createLocation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    
    const {
      name,
      type,
      parentId,
      coordinates,
      description,
      pincode,
      isActive = true,
      isPopular = false,
      order = 0,
      aliases = []
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: "Name and type are required",
      });
    }

    // Check if location already exists
    const existingLocation = await db.collection("locations").findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      type
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        error: "Location with this name and type already exists",
      });
    }

    const newLocation: Omit<RohtakLocation, "_id"> = {
      name: name.trim(),
      type,
      parentId,
      coordinates,
      description,
      pincode,
      isActive,
      isPopular,
      order,
      aliases: aliases.map((alias: string) => alias.trim()),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    const result = await db.collection("locations").insertOne(newLocation);

    const response: ApiResponse<{ locationId: string }> = {
      success: true,
      data: { locationId: result.insertedId.toString() },
      message: "Location created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create location",
    });
  }
};

// Admin: Update location
export const updateLocation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { locationId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid location ID",
      });
    }

    // Remove immutable fields
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    updateData.updatedAt = new Date();

    const result = await db.collection("locations").updateOne(
      { _id: new ObjectId(locationId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }

    const response: ApiResponse<{ updated: boolean }> = {
      success: true,
      data: { updated: true },
      message: "Location updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update location",
    });
  }
};

// Admin: Delete location
export const deleteLocation: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { locationId } = req.params;

    if (!ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid location ID",
      });
    }

    // Check if location is being used in any properties
    const propertyCount = await db.collection("properties").countDocuments({
      $or: [
        { "location.sector": locationId },
        { "location.mohalla": locationId },
        { "location.landmark": locationId },
        { "location.area": locationId }
      ]
    });

    if (propertyCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete location. It is being used in ${propertyCount} properties.`,
      });
    }

    const result = await db.collection("locations").deleteOne({
      _id: new ObjectId(locationId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Location not found",
      });
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      message: "Location deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete location",
    });
  }
};

// Admin: Bulk import locations
export const bulkImportLocations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Locations array is required",
      });
    }

    const validLocations = locations.map((loc, index) => {
      if (!loc.name || !loc.type) {
        throw new Error(`Location at index ${index} is missing name or type`);
      }
      
      return {
        ...loc,
        name: loc.name.trim(),
        isActive: loc.isActive !== undefined ? loc.isActive : true,
        isPopular: loc.isPopular !== undefined ? loc.isPopular : false,
        order: loc.order !== undefined ? loc.order : index,
        aliases: Array.isArray(loc.aliases) ? loc.aliases.map((alias: string) => alias.trim()) : [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      };
    });

    const result = await db.collection("locations").insertMany(validLocations);

    const response: ApiResponse<{ imported: number }> = {
      success: true,
      data: { imported: result.insertedCount },
      message: `Successfully imported ${result.insertedCount} locations`,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error bulk importing locations:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to import locations",
    });
  }
};

// Initialize default Rohtak locations
export const initializeRohtakLocations: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;

    // Check if locations already exist
    const existingCount = await db.collection("locations").countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        error: "Locations already exist. Use bulk import to add more.",
      });
    }

    const allLocations: Omit<RohtakLocation, "_id">[] = [];
    let order = 0;

    // Add sectors
    ROHTAK_LOCATION_DATA.sectors.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "sector",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    // Add mohallas
    ROHTAK_LOCATION_DATA.mohallas.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "mohalla",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    // Add roads
    ROHTAK_LOCATION_DATA.roads.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "road",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    // Add landmarks
    ROHTAK_LOCATION_DATA.landmarks.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "landmark",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    // Add societies
    ROHTAK_LOCATION_DATA.societies.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "society",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    // Add areas
    ROHTAK_LOCATION_DATA.areas.forEach((item) => {
      allLocations.push({
        name: item.name,
        type: "area",
        pincode: item.pincode,
        isActive: true,
        isPopular: item.isPopular,
        order: order++,
        aliases: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
      });
    });

    const result = await db.collection("locations").insertMany(allLocations);

    const response: ApiResponse<{ 
      initialized: number;
      breakdown: {
        sectors: number;
        mohallas: number;
        roads: number;
        landmarks: number;
        societies: number;
        areas: number;
      }
    }> = {
      success: true,
      data: { 
        initialized: result.insertedCount,
        breakdown: {
          sectors: ROHTAK_LOCATION_DATA.sectors.length,
          mohallas: ROHTAK_LOCATION_DATA.mohallas.length,
          roads: ROHTAK_LOCATION_DATA.roads.length,
          landmarks: ROHTAK_LOCATION_DATA.landmarks.length,
          societies: ROHTAK_LOCATION_DATA.societies.length,
          areas: ROHTAK_LOCATION_DATA.areas.length,
        }
      },
      message: `Successfully initialized ${result.insertedCount} Rohtak locations`,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error initializing Rohtak locations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize Rohtak locations",
    });
  }
};

// Get location statistics for admin dashboard
export const getLocationStats: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const pipeline = [
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          popular: { $sum: { $cond: ["$isPopular", 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const typeStats = await db.collection("locations").aggregate(pipeline).toArray();
    const totalLocations = await db.collection("locations").countDocuments();
    const activeLocations = await db.collection("locations").countDocuments({ isActive: true });
    const popularLocations = await db.collection("locations").countDocuments({ isPopular: true });

    const response: ApiResponse<{
      total: number;
      active: number;
      popular: number;
      byType: Array<{
        type: string;
        total: number;
        active: number;
        popular: number;
      }>;
    }> = {
      success: true,
      data: {
        total: totalLocations,
        active: activeLocations,
        popular: popularLocations,
        byType: typeStats.map(stat => ({
          type: stat._id,
          total: stat.total,
          active: stat.active,
          popular: stat.popular
        }))
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching location stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch location statistics",
    });
  }
};

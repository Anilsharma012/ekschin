import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";

// Get subcategories by category
export const getSubcategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;
    
    // Get categories collection
    const categoriesCollection = db.collection("categories");
    
    if (category) {
      // Get specific category with its subcategories
      const categoryDoc = await categoriesCollection.findOne({ 
        slug: category,
        active: true 
      });
      
      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          error: "Category not found"
        });
      }
      
      res.json({
        success: true,
        data: categoryDoc.subcategories || []
      });
    } else {
      // Get all categories with their subcategories
      const categories = await categoriesCollection.find({ 
        active: true 
      }).sort({ order: 1 }).toArray();
      
      // Flatten all subcategories
      const allSubcategories = categories.reduce((acc, cat) => {
        if (cat.subcategories) {
          acc.push(...cat.subcategories.map((sub: any) => ({
            ...sub,
            categorySlug: cat.slug,
            categoryName: cat.name
          })));
        }
        return acc;
      }, []);
      
      res.json({
        success: true,
        data: allSubcategories
      });
    }
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories"
    });
  }
};

// Get subcategories with property counts - only shows subcategories with approved properties
export const getSubcategoriesWithCounts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    // Set no-cache headers to ensure live data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Get categories collection
    const categoriesCollection = db.collection("categories");
    const propertiesCollection = db.collection("properties");

    if (category) {
      // Get specific category with its subcategories
      const categoryDoc = await categoriesCollection.findOne({
        slug: category,
        active: true
      });

      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          error: "Category not found"
        });
      }

      // Get live subcategory data by aggregating actual approved properties
      const subcategoriesWithCounts = await propertiesCollection.aggregate([
        {
          $match: {
            status: "active",
            approvalStatus: "approved",
            propertyType: category
          }
        },
        {
          $group: {
            _id: "$subCategory",
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: "" } // Only include subcategories that exist
          }
        }
      ]).toArray();

      // Map to include subcategory details from the category definition
      const result = subcategoriesWithCounts
        .map((item: any) => {
          const subcategorySlug = item._id;
          const subcategoryDef = categoryDoc.subcategories?.find((sub: any) => sub.slug === subcategorySlug);

          if (subcategoryDef) {
            return {
              ...subcategoryDef,
              count: item.count
            };
          }
          return null;
        })
        .filter(Boolean) // Remove null entries
        .sort((a: any, b: any) => a.name.localeCompare(b.name)); // Sort alphabetically

      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Category parameter is required"
      });
    }
  } catch (error) {
    console.error("Error fetching subcategories with counts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch subcategories with counts"
    });
  }
};

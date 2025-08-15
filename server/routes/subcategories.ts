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

// Get subcategories with property counts
export const getSubcategoriesWithCounts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;
    
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
      
      // Get property counts for each subcategory
      const subcategoriesWithCounts = await Promise.all(
        (categoryDoc.subcategories || []).map(async (sub: any) => {
          const count = await propertiesCollection.countDocuments({
            status: "active",
            approvalStatus: "approved",
            propertyType: category,
            subCategory: sub.slug
          });
          
          return {
            ...sub,
            count
          };
        })
      );
      
      res.json({
        success: true,
        data: subcategoriesWithCounts
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

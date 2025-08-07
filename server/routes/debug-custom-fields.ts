import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";

// Debug endpoint to test custom fields functionality
export const testCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log("🧪 Testing custom fields API...");
    
    // Test database connection
    await db.admin().ping();
    console.log("✅ Database connection OK");
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const hasCustomFieldsCollection = collections.some(col => col.name === 'customFields');
    console.log(`📋 Custom fields collection exists: ${hasCustomFieldsCollection}`);
    
    // Count existing custom fields
    const count = await db.collection("customFields").countDocuments();
    console.log(`📊 Existing custom fields count: ${count}`);
    
    // Get sample fields
    const sampleFields = await db.collection("customFields").find().limit(3).toArray();
    console.log(`📄 Sample fields:`, sampleFields.map(f => ({ name: f.name, type: f.type, active: f.active })));
    
    res.json({
      success: true,
      debug: {
        database: "connected",
        collection_exists: hasCustomFieldsCollection,
        fields_count: count,
        sample_fields: sampleFields.map(f => ({ 
          id: f._id, 
          name: f.name, 
          type: f.type, 
          category: f.category,
          active: f.active 
        })),
        timestamp: new Date()
      },
      message: "Custom fields API test completed"
    });
  } catch (error) {
    console.error("❌ Custom fields test failed:", error);
    res.status(500).json({
      success: false,
      error: "Custom fields test failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    });
  }
};

// Quick fix endpoint to reinitialize custom fields
export const fixCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    console.log("🔧 Fixing custom fields...");
    
    // Clear existing fields
    await db.collection("customFields").deleteMany({});
    console.log("🗑️ Cleared existing custom fields");
    
    // Initialize default fields
    const defaultFields = [
      {
        name: 'property_age',
        label: 'Property Age',
        type: 'select',
        category: 'property',
        required: false,
        active: true,
        order: 1,
        options: ['New Construction', '1-5 years', '5-10 years', '10-20 years', '20+ years'],
        placeholder: 'Select property age',
        helpText: 'Age of the property since construction',
        validation: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'furnishing',
        label: 'Furnishing Status',
        type: 'select',
        category: 'property',
        required: false,
        active: true,
        order: 2,
        options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
        placeholder: 'Select furnishing status',
        helpText: 'Current furnishing condition of the property',
        validation: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'parking',
        label: 'Parking',
        type: 'select',
        category: 'property',
        required: false,
        active: true,
        order: 3,
        options: ['1 Car', '2 Cars', '3+ Cars', 'No Parking'],
        placeholder: 'Select parking availability',
        helpText: 'Number of parking spaces available',
        validation: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    const result = await db.collection("customFields").insertMany(defaultFields);
    console.log(`✅ Inserted ${result.insertedCount} default custom fields`);
    
    res.json({
      success: true,
      message: "Custom fields fixed and reinitialized",
      data: {
        cleared: "all existing fields",
        inserted: result.insertedCount,
        fields: defaultFields.map(f => ({ name: f.name, type: f.type, category: f.category }))
      }
    });
  } catch (error) {
    console.error("❌ Fix custom fields failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix custom fields",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

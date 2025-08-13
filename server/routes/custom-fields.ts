import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";

interface CustomField {
  _id?: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'email' | 'url' | 'phone';
  category: string;
  required: boolean;
  active: boolean;
  order: number;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For select type
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Get all custom fields
export const getAllCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category, active } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.active = active === 'true';

    const fields = await db
      .collection("customFields")
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    console.log(`📋 Fetched ${fields.length} custom fields`);

    res.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch custom fields",
    });
  }
};

// Get custom field by ID
export const getCustomFieldById: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { fieldId } = req.params;

    const field = await db
      .collection("customFields")
      .findOne({ _id: new ObjectId(fieldId) });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found",
      });
    }

    res.json({
      success: true,
      data: field,
    });
  } catch (error) {
    console.error("Error fetching custom field:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch custom field",
    });
  }
};

// Create new custom field
export const createCustomField: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    
    // Validate required fields
    const { name, label, type, category } = req.body;
    if (!name || !label || !type || !category) {
      return res.status(400).json({
        success: false,
        error: "Name, label, type, and category are required",
      });
    }

    // Check if field name already exists in category
    const existingField = await db
      .collection("customFields")
      .findOne({ name: name.toLowerCase(), category });

    if (existingField) {
      return res.status(400).json({
        success: false,
        error: "A field with this name already exists in this category",
      });
    }

    // Get the next order number
    const lastField = await db
      .collection("customFields")
      .findOne({ category }, { sort: { order: -1 } });

    const nextOrder = lastField ? lastField.order + 1 : 1;

    const fieldData: Omit<CustomField, '_id'> = {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      label: label.trim(),
      type,
      category,
      required: req.body.required || false,
      active: req.body.active !== false, // Default to true
      order: req.body.order || nextOrder,
      placeholder: req.body.placeholder || '',
      helpText: req.body.helpText || '',
      options: req.body.options || [],
      validation: req.body.validation || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("customFields").insertOne(fieldData);
    const createdField = await db
      .collection("customFields")
      .findOne({ _id: result.insertedId });

    console.log(`📋 Created custom field: ${fieldData.name} for ${fieldData.category}`);

    res.status(201).json({
      success: true,
      data: createdField,
    });
  } catch (error) {
    console.error("Error creating custom field:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create custom field",
    });
  }
};

// Update custom field
export const updateCustomField: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { fieldId } = req.params;

    // Check if field exists
    const existingField = await db
      .collection("customFields")
      .findOne({ _id: new ObjectId(fieldId) });

    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found",
      });
    }

    // If name is being changed, check for duplicates
    if (req.body.name && req.body.name !== existingField.name) {
      const duplicateField = await db
        .collection("customFields")
        .findOne({ 
          name: req.body.name.toLowerCase(),
          category: req.body.category || existingField.category,
          _id: { $ne: new ObjectId(fieldId) }
        });

      if (duplicateField) {
        return res.status(400).json({
          success: false,
          error: "A field with this name already exists in this category",
        });
      }
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // Clean up the update data
    delete updateData._id;
    if (updateData.name) {
      updateData.name = updateData.name.toLowerCase().replace(/\s+/g, '_');
    }

    const result = await db
      .collection("customFields")
      .updateOne({ _id: new ObjectId(fieldId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found",
      });
    }

    const updatedField = await db
      .collection("customFields")
      .findOne({ _id: new ObjectId(fieldId) });

    console.log(`📋 Updated custom field: ${fieldId}`);

    res.json({
      success: true,
      data: updatedField,
    });
  } catch (error) {
    console.error("Error updating custom field:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update custom field",
    });
  }
};

// Delete custom field
export const deleteCustomField: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { fieldId } = req.params;

    // Check if field is being used in any properties
    const fieldUsage = await db
      .collection("properties")
      .countDocuments({ [`customFields.${fieldId}`]: { $exists: true } });

    if (fieldUsage > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete field. It is being used in ${fieldUsage} properties.`,
      });
    }

    const result = await db
      .collection("customFields")
      .deleteOne({ _id: new ObjectId(fieldId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found",
      });
    }

    console.log(`📋 Deleted custom field: ${fieldId}`);

    res.json({
      success: true,
      message: "Custom field deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete custom field",
    });
  }
};

// Update custom field status (active/inactive)
export const updateCustomFieldStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { fieldId } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: "Active status must be a boolean value",
      });
    }

    const result = await db
      .collection("customFields")
      .updateOne(
        { _id: new ObjectId(fieldId) },
        { 
          $set: { 
            active,
            updatedAt: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found",
      });
    }

    const updatedField = await db
      .collection("customFields")
      .findOne({ _id: new ObjectId(fieldId) });

    console.log(`📋 Updated custom field status: ${fieldId} -> ${active ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      data: updatedField,
    });
  } catch (error) {
    console.error("Error updating custom field status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update custom field status",
    });
  }
};

// Reorder custom fields
export const reorderCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { fieldOrders } = req.body; // Array of { fieldId, order }

    if (!Array.isArray(fieldOrders)) {
      return res.status(400).json({
        success: false,
        error: "Field orders must be an array",
      });
    }

    // Update each field's order
    const bulkOps = fieldOrders.map((item: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.fieldId) },
        update: { 
          $set: { 
            order: item.order,
            updatedAt: new Date()
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      await db.collection("customFields").bulkWrite(bulkOps);
    }

    console.log(`📋 Reordered ${fieldOrders.length} custom fields`);

    res.json({
      success: true,
      message: "Custom fields reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering custom fields:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reorder custom fields",
    });
  }
};

// Initialize default custom fields
export const initializeCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if custom fields already exist
    const existingFields = await db.collection("customFields").countDocuments();
    if (existingFields > 0) {
      return res.json({
        success: true,
        message: "Custom fields already initialized",
        data: { count: existingFields }
      });
    }

    const defaultFields: Omit<CustomField, '_id'>[] = [
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
      },
      {
        name: 'balcony',
        label: 'Balcony',
        type: 'number',
        category: 'property',
        required: false,
        active: true,
        order: 4,
        placeholder: 'Number of balconies',
        helpText: 'Total number of balconies',
        validation: { min: 0, max: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'facing',
        label: 'Facing Direction',
        type: 'select',
        category: 'property',
        required: false,
        active: true,
        order: 5,
        options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
        placeholder: 'Select facing direction',
        helpText: 'Direction the property faces',
        validation: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const result = await db.collection("customFields").insertMany(defaultFields);

    console.log(`📋 Initialized ${result.insertedCount} default custom fields`);

    res.json({
      success: true,
      message: "Default custom fields initialized successfully",
      data: { count: result.insertedCount }
    });
  } catch (error) {
    console.error("Error initializing custom fields:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize custom fields",
    });
  }
};

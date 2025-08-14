import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://Aashishpropeorty:SATYAKA123@property.zn2cowc.mongodb.net/';
const DB_NAME = 'aashish_property';

// New category structure as requested
const newCategoriesStructure = [
  {
    name: "Buy",
    slug: "buy",
    type: "parent",
    parentCategory: null,
    icon: "🏠",
    description: "Properties for buying",
    isActive: true,
    order: 1,
    subcategories: [
      { name: "Registration", slug: "registration", description: "Property registration services" },
      { name: "Commercial", slug: "commercial", description: "Commercial properties for purchase" },
      { name: "Plot", slug: "plot", description: "Land plots for sale" },
      { name: "PG/Hostel", slug: "pg-hostel", description: "PG and hostel properties for purchase" },
      { name: "Apartment", slug: "apartment", description: "Apartments for sale" },
      { name: "Other", slug: "other", description: "Other properties for purchase" }
    ]
  },
  {
    name: "Sale",
    slug: "sale", 
    type: "parent",
    parentCategory: null,
    icon: "💰",
    description: "Properties for sale",
    isActive: true,
    order: 2,
    subcategories: [
      { name: "Registration", slug: "registration", description: "Property registration services" },
      { name: "Commercial", slug: "commercial", description: "Commercial properties for sale" },
      { name: "Plot", slug: "plot", description: "Land plots for sale" },
      { name: "PG/Hostel", slug: "pg-hostel", description: "PG and hostel properties for sale" },
      { name: "Apartment", slug: "apartment", description: "Apartments for sale" },
      { name: "Other", slug: "other", description: "Other properties for sale" }
    ]
  },
  {
    name: "Rent",
    slug: "rent",
    type: "parent", 
    parentCategory: null,
    icon: "🔑",
    description: "Properties for rent",
    isActive: true,
    order: 3,
    subcategories: [
      { name: "Registration", slug: "registration", description: "Property registration services" },
      { name: "Commercial", slug: "commercial", description: "Commercial properties for rent" },
      { name: "Plot", slug: "plot", description: "Land plots for rent" },
      { name: "PG/Hostel", slug: "pg-hostel", description: "PG and hostel properties for rent" },
      { name: "Apartment", slug: "apartment", description: "Apartments for rent" },
      { name: "Other", slug: "other", description: "Other properties for rent" }
    ]
  },
  {
    name: "Lease",
    slug: "lease",
    type: "parent",
    parentCategory: null, 
    icon: "📄",
    description: "Properties for lease",
    isActive: true,
    order: 4,
    subcategories: [
      { name: "Registration", slug: "registration", description: "Property registration services" },
      { name: "Commercial", slug: "commercial", description: "Commercial properties for lease" },
      { name: "Plot", slug: "plot", description: "Land plots for lease" },
      { name: "PG/Hostel", slug: "pg-hostel", description: "PG and hostel properties for lease" },
      { name: "Apartment", slug: "apartment", description: "Apartments for lease" },
      { name: "Other", slug: "other", description: "Other properties for lease" }
    ]
  },
  {
    name: "PG",
    slug: "pg",
    type: "parent",
    parentCategory: null,
    icon: "🏨", 
    description: "PG and accommodation services",
    isActive: true,
    order: 5,
    subcategories: [
      { name: "Boys PG", slug: "boys-pg", description: "PG accommodation for men" },
      { name: "Girls PG", slug: "girls-pg", description: "PG accommodation for women" },
      { name: "Hostel", slug: "hostel", description: "Hostel accommodation" },
      { name: "Shared Room", slug: "shared-room", description: "Shared room accommodation" },
      { name: "Other", slug: "other", description: "Other accommodation options" }
    ]
  },
  {
    name: "Other Services",
    slug: "other-services",
    type: "parent",
    parentCategory: null,
    icon: "🛠️",
    description: "Additional property related services", 
    isActive: true,
    order: 6,
    subcategories: [
      { name: "Property Management", slug: "property-management", description: "Property management services" },
      { name: "Legal/Agreement", slug: "legal-agreement", description: "Legal and agreement services" },
      { name: "Home Services", slug: "home-services", description: "Home maintenance and services" },
      { name: "Packers & Movers", slug: "packers-movers", description: "Packing and moving services" },
      { name: "Other", slug: "other", description: "Other miscellaneous services" }
    ]
  }
];

async function resetAndCreateCategories() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB for category reset');
    
    const db = client.db(DB_NAME);
    const categoriesCollection = db.collection('categories');
    
    // Step 1: Delete all existing categories
    console.log('🗑️ Step 1: Deleting all existing categories...');
    const deleteResult = await categoriesCollection.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing categories`);
    
    // Step 2: Create new parent categories with subcategories
    console.log('🏗️ Step 2: Creating new category structure...');
    
    for (const categoryData of newCategoriesStructure) {
      // Prepare subcategories with proper structure
      const subcategories = categoryData.subcategories.map((sub, index) => ({
        id: `${categoryData.slug}-${sub.slug}`,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        count: 0, // Initialize with 0 count
        order: index + 1,
        isActive: true
      }));
      
      // Create the parent category
      const newCategory = {
        name: categoryData.name,
        slug: categoryData.slug,
        type: categoryData.type,
        parentCategory: categoryData.parentCategory,
        icon: categoryData.icon,
        description: categoryData.description,
        subcategories: subcategories,
        isActive: categoryData.isActive,
        active: categoryData.isActive, // Also set 'active' for backwards compatibility
        order: categoryData.order,
        count: 0, // Initialize with 0 count
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await categoriesCollection.insertOne(newCategory);
      console.log(`✅ Created parent category: ${categoryData.name} (${subcategories.length} subcategories)`);
    }
    
    // Step 3: Verify the structure
    console.log('🔍 Step 3: Verifying new category structure...');
    const allCategories = await categoriesCollection.find({}).sort({ order: 1 }).toArray();
    
    console.log('📊 New Category Structure:');
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
      console.log(`   - Type: ${cat.type || 'parent'}`);
      console.log(`   - Order: ${cat.order}`);
      console.log(`   - Active: ${cat.isActive}`);
      console.log(`   - Subcategories: ${cat.subcategories.length}`);
      cat.subcategories.forEach((sub, subIndex) => {
        console.log(`     ${subIndex + 1}. ${sub.name} (${sub.slug})`);
      });
      console.log('');
    });
    
    console.log('🎉 Category reset and restructuring completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`- Total parent categories: ${allCategories.length}`);
    console.log(`- Total subcategories: ${allCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0)}`);
    console.log('- All categories are active and properly ordered');
    console.log('- Structure follows the new hierarchy: Buy, Sale, Rent, Lease, PG, Other Services');
    
  } catch (error) {
    console.error('❌ Error during category reset:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
resetAndCreateCategories().catch(console.error);

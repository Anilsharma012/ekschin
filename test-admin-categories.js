// Test Admin Category Management API
const BASE_URL = "http://localhost:3000/api";

// Admin credentials from seeded database
const ADMIN_CREDENTIALS = {
  email: "admin@aashishproperty.com",
  password: "admin123"
};

async function testAdminCategoryManagement() {
  console.log("🧪 Testing Admin Category Management API");
  console.log("=" * 50);

  try {
    // Step 1: Login as admin
    console.log("1. 🔐 Logging in as admin...");
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    const token = loginData.data.token;
    console.log("✅ Admin login successful");

    // Step 2: Fetch admin categories
    console.log("\n2. 📋 Fetching admin categories...");
    const categoriesResponse = await fetch(`${BASE_URL}/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!categoriesResponse.ok) {
      throw new Error(`Categories fetch failed: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json();
    if (!categoriesData.success) {
      throw new Error(`Categories fetch failed: ${categoriesData.error}`);
    }

    console.log("✅ Admin categories fetched successfully");
    console.log(`📊 Found ${categoriesData.data.length} categories:`);
    categoriesData.data.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat.slug}) - ${cat.subcategories.length} subcategories`);
    });

    // Step 3: Create a new test category
    console.log("\n3. ➕ Creating a new test category...");
    const newCategory = {
      name: "Test Category",
      slug: "test-category",
      icon: "🏗️",
      description: "This is a test category created by the API test",
      subcategories: [
        { name: "Test Sub 1", slug: "test-sub-1" },
        { name: "Test Sub 2", slug: "test-sub-2" }
      ],
      order: 10
    };

    const createResponse = await fetch(`${BASE_URL}/admin/categories`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newCategory)
    });

    if (!createResponse.ok) {
      throw new Error(`Category creation failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    if (!createData.success) {
      throw new Error(`Category creation failed: ${createData.error}`);
    }

    console.log("✅ Test category created successfully");
    console.log(`📝 Category ID: ${createData.data._id}`);

    // Step 4: Verify the category was created
    console.log("\n4. 🔍 Verifying category was created...");
    const verifyResponse = await fetch(`${BASE_URL}/admin/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const verifyData = await verifyResponse.json();
    const testCategory = verifyData.data.find(cat => cat.slug === "test-category");
    
    if (testCategory) {
      console.log("✅ Test category found in database");
      console.log(`📝 Name: ${testCategory.name}`);
      console.log(`📝 Description: ${testCategory.description}`);
      console.log(`📝 Subcategories: ${testCategory.subcategories.length}`);
    } else {
      throw new Error("Test category not found after creation");
    }

    // Step 5: Clean up - delete test category
    console.log("\n5. 🧹 Cleaning up - deleting test category...");
    const deleteResponse = await fetch(`${BASE_URL}/admin/categories/${createData.data._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (deleteResponse.ok) {
      console.log("✅ Test category deleted successfully");
    } else {
      console.log("⚠️ Failed to delete test category (this is OK for testing)");
    }

    console.log("\n🎉 ALL TESTS PASSED!");
    console.log("\n📊 Test Results Summary:");
    console.log("✅ Admin authentication: WORKING");
    console.log("✅ Fetch categories API: WORKING");
    console.log("✅ Create category API: WORKING");
    console.log("✅ Database integration: WORKING");
    console.log("✅ MongoDB connection: WORKING");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(`Error: ${error.message}`);
    console.error("\nThis indicates an issue with the admin category management system.");
    
    // Provide helpful debugging information
    console.log("\n🔧 Debugging Info:");
    console.log("- Make sure the dev server is running on port 3000");
    console.log("- Make sure MongoDB is connected with the correct credentials");
    console.log("- Make sure the database was seeded with admin user and categories");
    console.log("- Check server logs for more details");
  }
}

// Run the test
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testAdminCategoryManagement();
} else {
  // Browser environment - expose function globally
  window.testAdminCategoryManagement = testAdminCategoryManagement;
  console.log("Test function available as: window.testAdminCategoryManagement()");
}

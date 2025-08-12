#!/usr/bin/env ts-node
import { connectToDatabase } from "../db/mongodb";
import { ROHTAK_LOCATION_DATA } from "@shared/location-types";

async function initializeRohtakLocations() {
  try {
    console.log("🚀 Starting Rohtak location initialization...");
    
    // Connect to database
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    // Check if locations already exist
    const existingCount = await db.collection("locations").countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing locations. Skipping initialization.`);
      process.exit(0);
    }

    const allLocations: any[] = [];
    let order = 0;

    // Add sectors
    console.log("📍 Adding sectors...");
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
        createdBy: null,
      });
    });

    // Add mohallas
    console.log("🏘️  Adding mohallas...");
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
        createdBy: null,
      });
    });

    // Add roads
    console.log("🛣️  Adding roads...");
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
        createdBy: null,
      });
    });

    // Add landmarks
    console.log("📍 Adding landmarks...");
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
        createdBy: null,
      });
    });

    // Add societies
    console.log("🏗️  Adding societies...");
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
        createdBy: null,
      });
    });

    // Add areas
    console.log("🏞️  Adding areas...");
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
        createdBy: null,
      });
    });

    // Insert all locations
    console.log(`💾 Inserting ${allLocations.length} locations...`);
    const result = await db.collection("locations").insertMany(allLocations);

    console.log("✅ Location initialization completed successfully!");
    console.log(`📊 Statistics:`);
    console.log(`   Total Locations: ${result.insertedCount}`);
    console.log(`   Sectors: ${ROHTAK_LOCATION_DATA.sectors.length}`);
    console.log(`   Mohallas: ${ROHTAK_LOCATION_DATA.mohallas.length}`);
    console.log(`   Roads: ${ROHTAK_LOCATION_DATA.roads.length}`);
    console.log(`   Landmarks: ${ROHTAK_LOCATION_DATA.landmarks.length}`);
    console.log(`   Societies: ${ROHTAK_LOCATION_DATA.societies.length}`);
    console.log(`   Areas: ${ROHTAK_LOCATION_DATA.areas.length}`);

    // Create indexes for better performance
    console.log("🔗 Creating database indexes...");
    await db.collection("locations").createIndex({ name: 1 });
    await db.collection("locations").createIndex({ type: 1 });
    await db.collection("locations").createIndex({ isActive: 1 });
    await db.collection("locations").createIndex({ isPopular: 1 });
    await db.collection("locations").createIndex({ name: "text", aliases: "text" });
    
    console.log("✅ Indexes created successfully!");
    console.log("🎉 Rohtak Location Coverage System ready!");

  } catch (error) {
    console.error("❌ Error initializing locations:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeRohtakLocations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Failed to initialize locations:", error);
      process.exit(1);
    });
}

export { initializeRohtakLocations };

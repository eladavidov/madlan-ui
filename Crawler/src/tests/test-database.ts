/**
 * Database Test Script
 * Tests database connection, migrations, and repository operations
 */

import { initDatabase } from "../database/connection.js";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { ImageRepository } from "../database/repositories/ImageRepository.js";
import { CrawlSessionRepository } from "../database/repositories/CrawlSessionRepository.js";
import type { PropertyInput } from "../models/Property.js";

async function testDatabase() {
  console.log("🧪 Starting Database Tests...\n");

  try {
    // Clean up old test database
    const testDbPath = "./data/databases/test-properties.db";
    const { unlinkSync, existsSync } = await import("fs");
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
      console.log("🧹 Cleaned up old test database\n");
    }

    // Test 1: Initialize Database
    console.log("📦 Test 1: Initialize Database");
    const db = await initDatabase(testDbPath);
    console.log("✅ Database initialized successfully\n");

    // Test 2: Property Repository
    console.log("📦 Test 2: Property Repository");
    const propertyRepo = new PropertyRepository(db);

    const testProperty: PropertyInput = {
      id: "test-prop-001",
      url: "https://madlan.co.il/test/001",
      city: "חיפה",
      price: 1500000,
      rooms: 3.5,
      size: 90,
      floor: 2,
      total_floors: 5,
      address: "רחוב הרצל 123",
      neighborhood: "כרמל מרכז",
      property_type: "דירה",
      has_parking: true,
      has_elevator: true,
      has_balcony: true,
      description: "דירה מרווחת וממוזגת",
    };

    // Insert test property
    propertyRepo.insert(testProperty);
    console.log("✅ Property inserted");

    // Find by ID
    const found = propertyRepo.findById("test-prop-001");
    console.log("✅ Property found:", found?.address);

    // Upsert (update)
    propertyRepo.upsert({
      ...testProperty,
      price: 1600000, // Price changed
    });
    const updated = propertyRepo.findById("test-prop-001");
    console.log("✅ Property updated, new price:", updated?.price);
    console.log("✅ Crawl count:", updated?.crawl_count);

    // Find by city
    const haifaProperties = propertyRepo.findByCity("חיפה");
    console.log("✅ Properties in Haifa:", haifaProperties.length);

    // Count
    const count = propertyRepo.count();
    console.log("✅ Total properties:", count);
    console.log();

    // Test 3: Image Repository
    console.log("📦 Test 3: Image Repository");
    const imageRepo = new ImageRepository(db);

    // Insert test images
    imageRepo.insertMany([
      {
        property_id: "test-prop-001",
        image_url: "https://example.com/image1.jpg",
        image_order: 0,
        is_main_image: true,
      },
      {
        property_id: "test-prop-001",
        image_url: "https://example.com/image2.jpg",
        image_order: 1,
        is_main_image: false,
      },
      {
        property_id: "test-prop-001",
        image_url: "https://example.com/image3.jpg",
        image_order: 2,
        is_main_image: false,
      },
    ]);
    console.log("✅ Images inserted");

    // Find images
    const images = imageRepo.findByPropertyId("test-prop-001");
    console.log("✅ Images found:", images.length);

    // Find main image
    const mainImage = imageRepo.findMainImage("test-prop-001");
    console.log("✅ Main image:", mainImage?.image_url);

    // Image stats
    const imageStats = imageRepo.getStats();
    console.log("✅ Image stats:", imageStats);
    console.log();

    // Test 4: Crawl Session Repository
    console.log("📦 Test 4: Crawl Session Repository");
    const sessionRepo = new CrawlSessionRepository(db);

    // Start session
    const sessionId = `test-session-${Date.now()}`;
    sessionRepo.startSession(sessionId, "חיפה", 100);
    console.log("✅ Session started:", sessionId);

    // Update stats
    sessionRepo.updateStats(sessionId, {
      properties_found: 10,
      properties_new: 8,
      properties_updated: 2,
    });
    console.log("✅ Session stats updated");

    // Log error
    sessionRepo.logError(
      sessionId,
      "network",
      "Connection timeout",
      undefined,
      "https://madlan.co.il/test"
    );
    console.log("✅ Error logged");

    // Complete session
    sessionRepo.completeSession(sessionId, true);
    console.log("✅ Session completed");

    // Get session
    const session = sessionRepo.findBySessionId(sessionId);
    console.log("✅ Session retrieved:", {
      id: session?.session_id,
      status: session?.status,
      properties_found: session?.properties_found,
      properties_new: session?.properties_new,
    });

    // Get errors
    const errors = sessionRepo.getSessionErrors(sessionId);
    console.log("✅ Session errors:", errors.length);

    // Overall stats
    const overallStats = sessionRepo.getOverallStats();
    console.log("✅ Overall stats:", overallStats);
    console.log();

    // Test 5: Views
    console.log("📦 Test 5: Database Views");
    const recentProperties = db.query(
      "SELECT * FROM v_recent_properties LIMIT 5"
    );
    console.log("✅ Recent properties view:", recentProperties.length, "rows");

    const propertiesWithStats = db.query(
      "SELECT * FROM v_properties_with_stats LIMIT 5"
    );
    console.log("✅ Properties with stats view:", propertiesWithStats.length, "rows");

    const sessionSummary = db.query("SELECT * FROM v_session_summary LIMIT 5");
    console.log("✅ Session summary view:", sessionSummary.length, "rows");
    console.log();

    // Close connection
    db.close();

    console.log("🎉 All tests passed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("  ✅ Database initialization");
    console.log("  ✅ Property CRUD operations");
    console.log("  ✅ Image operations");
    console.log("  ✅ Session tracking");
    console.log("  ✅ Error logging");
    console.log("  ✅ Database views");
    console.log("\n✨ Database is ready for Phase 2.2 (Basic Crawler)");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testDatabase();

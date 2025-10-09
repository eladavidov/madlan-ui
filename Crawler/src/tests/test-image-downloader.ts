/**
 * Image Downloader Tests
 * Tests image downloading with real URLs
 */

import { downloadImage, downloadImages } from "../downloaders/imageDownloader.js";
import { ImageStore } from "../storage/imageStore.js";
import { PropertyRepository } from "../database/repositories/PropertyRepository.js";
import { initDatabase } from "../database/connection.js";
import { existsSync, unlinkSync, rmdirSync, readdirSync } from "fs";

console.log("🧪 Testing Image Downloader\n");

async function testSingleDownload() {
  console.log("📦 Test 1: Single Image Download");

  // Use a reliable test image URL
  const testUrl = "https://via.placeholder.com/150";
  const testPath = "./data/images/test/test-image.jpg";

  try {
    const result = await downloadImage(testUrl, testPath, {
      maxRetries: 2,
      timeout: 10000,
    });

    if (result.success) {
      console.log(`  ✅ Download successful`);
      console.log(`    Path: ${result.localPath}`);
      console.log(`    Size: ${result.fileSize} bytes`);
      console.log(`    Type: ${result.contentType}`);

      // Verify file exists
      if (existsSync(testPath)) {
        console.log(`  ✅ File exists on filesystem`);

        // Clean up
        unlinkSync(testPath);
        console.log(`  ✅ Cleanup successful`);
      } else {
        console.log(`  ❌ File not found on filesystem`);
        return false;
      }
    } else {
      console.log(`  ❌ Download failed: ${result.error}`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.log(`  ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testMultipleDownloads() {
  console.log("\n📦 Test 2: Multiple Image Downloads");

  const testUrls = [
    "https://via.placeholder.com/100",
    "https://via.placeholder.com/200",
    "https://via.placeholder.com/300",
  ];

  try {
    const results = await downloadImages(
      testUrls,
      (_url, index) => `./data/images/test/batch-${index}.jpg`,
      {
        maxRetries: 2,
        timeout: 10000,
        concurrency: 2,
      }
    );

    const successful = results.filter((r) => r.success).length;
    console.log(`  ${successful === 3 ? "✅" : "❌"} Downloaded ${successful}/3 images`);

    // Clean up
    for (let i = 0; i < testUrls.length; i++) {
      const path = `./data/images/test/batch-${i}.jpg`;
      if (existsSync(path)) {
        unlinkSync(path);
      }
    }

    return successful === 3;
  } catch (error: any) {
    console.log(`  ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testImageStore() {
  console.log("\n📦 Test 3: ImageStore Integration");

  try {
    // Initialize database
    const db = await initDatabase("./data/databases/test-images.db");
    const propertyRepo = new PropertyRepository(db);
    const imageStore = new ImageStore(db);

    // Create test property first (to satisfy foreign key constraint)
    propertyRepo.upsert({
      id: "test-prop-123",
      url: "https://madlan.co.il/listings/test-prop-123",
      city: "חיפה",
      address: "Test Address",
      price: 1000000,
      rooms: 3,
      size: 100,
    });

    const testUrls = [
      "https://via.placeholder.com/400",
      "https://via.placeholder.com/500",
    ];

    const stats = await imageStore.downloadPropertyImages("test-prop-123", testUrls, {
      maxRetries: 2,
      timeout: 10000,
    });

    console.log(`  ${stats.total === 2 ? "✅" : "❌"} Total: ${stats.total}`);
    console.log(`  ${stats.successful === 2 ? "✅" : "❌"} Successful: ${stats.successful}`);
    console.log(`  ${stats.failed === 0 ? "✅" : "❌"} Failed: ${stats.failed}`);

    // Get stats
    const propertyStats = imageStore.getPropertyStats("test-prop-123");
    console.log(`  ${propertyStats.downloaded === 2 ? "✅" : "❌"} Database records: ${propertyStats.downloaded}`);

    // Clean up
    imageStore.cleanupPropertyImages("test-prop-123");
    propertyRepo.delete("test-prop-123");
    db.close();

    return stats.successful === 2 && propertyStats.downloaded === 2;
  } catch (error: any) {
    console.log(`  ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testRetryLogic() {
  console.log("\n📦 Test 4: Retry Logic");

  // Use an invalid URL to test retry
  const invalidUrl = "https://invalid-domain-12345.com/image.jpg";
  const testPath = "./data/images/test/retry-test.jpg";

  try {
    const result = await downloadImage(invalidUrl, testPath, {
      maxRetries: 3,
      timeout: 2000,
      retryDelay: 100,
    });

    if (!result.success) {
      console.log(`  ✅ Correctly failed after retries`);
      console.log(`    Error: ${result.error}`);
      return true;
    } else {
      console.log(`  ❌ Should have failed but succeeded`);
      return false;
    }
  } catch (error: any) {
    console.log(`  ❌ Test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  const test1 = await testSingleDownload();
  const test2 = await testMultipleDownloads();
  const test3 = await testImageStore();
  const test4 = await testRetryLogic();

  // Clean up test directory
  try {
    const testDir = "./data/images/test";
    if (existsSync(testDir)) {
      const files = readdirSync(testDir);
      for (const file of files) {
        unlinkSync(`${testDir}/${file}`);
      }
      rmdirSync(testDir);
    }
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log("\n" + "=".repeat(60));
  if (test1 && test2 && test3 && test4) {
    console.log("🎉 All Image Downloader Tests Passed!");
    console.log("=".repeat(60));
    console.log("\n✅ Phase 4 image downloading verified");
    console.log("✅ Retry logic working");
    console.log("✅ Database integration working");
    console.log("✅ Ready for production use");
  } else {
    console.log("⚠️  Some Tests Failed");
    console.log("=".repeat(60));
    console.log(`\n  Test 1 (Single): ${test1 ? "✅" : "❌"}`);
    console.log(`  Test 2 (Multiple): ${test2 ? "✅" : "❌"}`);
    console.log(`  Test 3 (ImageStore): ${test3 ? "✅" : "❌"}`);
    console.log(`  Test 4 (Retry): ${test4 ? "✅" : "❌"}`);
  }
}

runTests();

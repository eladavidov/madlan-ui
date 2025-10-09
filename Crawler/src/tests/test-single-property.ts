/**
 * Test Script: Single Property Page Scraping
 * Tests Approach A+B: Delays + Session Continuity
 *
 * Goal: Scrape ONE property page to verify anti-blocking bypass
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractPropertyData, extractImageUrls } from "./src/extractors/propertyExtractor.js";

// Enable stealth
chromium.use(StealthPlugin());

// TEST CONFIGURATION
const TEST_CONFIG = {
  // Use FULL URL with tracking parameters (looks like real user navigation)
  propertyUrl: "https://www.madlan.co.il/listings/LhkaBVY015d?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=4",

  // Aggressive delays (human-like behavior)
  initialDelay: 5000,        // Wait 5s after page load
  beforeExtractionDelay: 3000, // Wait 3s before extracting data

  // Simulate human reading time
  humanReadingTime: 8000,    // 8 seconds

  headless: false,           // Visible browser for debugging
};

async function testSingleProperty() {
  console.log("=" .repeat(70));
  console.log("🧪 TEST: Single Property Page Scraping (Approach A+B)");
  console.log("=" .repeat(70));
  console.log(`\n📍 Target: ${TEST_CONFIG.propertyUrl}`);
  console.log(`⏱️  Delays: ${TEST_CONFIG.initialDelay}ms initial, ${TEST_CONFIG.beforeExtractionDelay}ms before extraction`);
  console.log(`🤖 Stealth: Enabled`);
  console.log(`👁️  Headless: ${TEST_CONFIG.headless}\n`);

  // Launch browser with stealth
  console.log("🚀 Step 1: Launching browser with stealth plugin...");
  const browser = await chromium.launch({
    headless: TEST_CONFIG.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
    // CRITICAL: Enable JavaScript
    javaScriptEnabled: true,
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    // Set realistic browser properties
    locale: "he-IL",
    timezoneId: "Asia/Jerusalem",
  });

  const page = await context.newPage();

  try {
    // Navigate to property page
    console.log("\n🌐 Step 2: Navigating to property page...");
    const response = await page.goto(TEST_CONFIG.propertyUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status();
    console.log(`📡 HTTP Status: ${status}`);

    if (status === 403) {
      console.log("\n❌ BLOCKED: Received 403 Forbidden");
      console.log("📸 Taking screenshot...");
      await page.screenshot({ path: "./debug-screenshots/test-403-blocked.png", fullPage: true });
      throw new Error("403 Forbidden - Property page blocked");
    }

    if (status !== 200) {
      console.log(`\n⚠️  Unexpected status: ${status}`);
      await page.screenshot({ path: "./debug-screenshots/test-unexpected-status.png", fullPage: true });
    }

    // Wait for content to load
    console.log("\n⏳ Step 3: Waiting for page content to render...");
    await page.waitForFunction(
      () => {
        const hasImages = document.querySelector('img') !== null;
        const hasPrice = document.body.textContent?.includes('₪') || false;
        const bodyLength = document.body.textContent?.length || 0;
        return bodyLength > 5000 || (hasImages && hasPrice);
      },
      { timeout: 15000 }
    );
    console.log("✅ Content rendered");

    // Initial delay (human-like)
    console.log(`\n⏱️  Step 4: Simulating human behavior (${TEST_CONFIG.initialDelay / 1000}s delay)...`);
    await page.waitForTimeout(TEST_CONFIG.initialDelay);

    // Simulate human scrolling
    console.log("🖱️  Scrolling page (simulating reading)...");
    await page.evaluate(() => {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      window.scrollBy({ top: 500, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // Human reading time
    console.log(`📖 Simulating reading time (${TEST_CONFIG.humanReadingTime / 1000}s)...`);
    await page.waitForTimeout(TEST_CONFIG.humanReadingTime);

    // Check for blocking
    console.log("\n🔍 Step 5: Checking for blocking signals...");
    const pageContent = await page.content();
    const hasCaptcha = pageContent.includes("Press & Hold") ||
                       pageContent.includes("סליחה על ההפרעה");

    if (hasCaptcha) {
      console.log("🛑 CAPTCHA detected!");
      await page.screenshot({ path: "./debug-screenshots/test-captcha.png", fullPage: false });
      throw new Error("CAPTCHA challenge detected");
    }
    console.log("✅ No blocking signals detected");

    // Delay before extraction
    console.log(`\n⏱️  Waiting ${TEST_CONFIG.beforeExtractionDelay / 1000}s before extraction...`);
    await page.waitForTimeout(TEST_CONFIG.beforeExtractionDelay);

    // Extract property data
    console.log("\n📊 Step 6: Extracting property data...");
    const propertyData = await extractPropertyData(page, TEST_CONFIG.propertyUrl);

    if (!propertyData) {
      console.log("❌ EXTRACTION FAILED");
      await page.screenshot({ path: "./debug-screenshots/test-extraction-failed.png", fullPage: true });
      throw new Error("extractPropertyData returned null");
    }

    console.log("✅ EXTRACTION SUCCESSFUL!\n");
    console.log("=" .repeat(70));
    console.log("📋 EXTRACTED DATA:");
    console.log("=" .repeat(70));
    console.log(`ID: ${propertyData.id}`);
    console.log(`Price: ₪${propertyData.price?.toLocaleString() || "N/A"}`);
    console.log(`Address: ${propertyData.address || "N/A"}`);
    console.log(`Neighborhood: ${propertyData.neighborhood || "N/A"}`);
    console.log(`City: ${propertyData.city}`);
    console.log(`Rooms: ${propertyData.rooms || "N/A"}`);
    console.log(`Size: ${propertyData.size || "N/A"} m²`);
    console.log(`Floor: ${propertyData.floor || "N/A"}${propertyData.total_floors ? `/${propertyData.total_floors}` : ""}`);
    console.log(`Property Type: ${propertyData.property_type || "N/A"}`);
    console.log(`\nAmenities:`);
    console.log(`  Parking: ${propertyData.has_parking ? "✓" : "✗"}`);
    console.log(`  Elevator: ${propertyData.has_elevator ? "✓" : "✗"}`);
    console.log(`  Balcony: ${propertyData.has_balcony ? "✓" : "✗"}`);
    console.log(`  Air Conditioning: ${propertyData.has_air_conditioning ? "✓" : "✗"}`);

    if (propertyData.description) {
      console.log(`\nDescription (first 100 chars): ${propertyData.description.substring(0, 100)}...`);
    }

    console.log(`\nContact:`);
    console.log(`  Name: ${propertyData.contact_name || "N/A"}`);
    console.log(`  Phone: ${propertyData.contact_phone || "N/A"}`);
    console.log("=" .repeat(70));

    // Extract images
    console.log("\n📸 Step 7: Extracting image URLs...");
    const imageUrls = await extractImageUrls(page);
    console.log(`✅ Found ${imageUrls.length} images`);
    if (imageUrls.length > 0) {
      console.log("First 3 image URLs:");
      imageUrls.slice(0, 3).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

    // Take success screenshot
    console.log("\n📸 Taking success screenshot...");
    await page.screenshot({ path: "./debug-screenshots/test-success.png", fullPage: true });

    console.log("\n" + "=" .repeat(70));
    console.log("✅ TEST PASSED! Property page scraping works!");
    console.log("=" .repeat(70));
    console.log("\n🎯 Next Steps:");
    console.log("1. Test with multiple properties (5-10)");
    console.log("2. Implement session continuity (search→property navigation)");
    console.log("3. Integrate into main crawler");
    console.log("=" .repeat(70));

    return {
      success: true,
      property: propertyData,
      imageCount: imageUrls.length,
    };

  } catch (error: any) {
    console.error("\n" + "=" .repeat(70));
    console.error("❌ TEST FAILED");
    console.error("=" .repeat(70));
    console.error(`Error: ${error.message}`);
    console.error(`\nStack trace:`);
    console.error(error.stack);
    console.error("=" .repeat(70));

    // Take error screenshot if possible
    try {
      await page.screenshot({ path: "./debug-screenshots/test-error.png", fullPage: true });
      console.error("📸 Error screenshot saved: ./debug-screenshots/test-error.png");
    } catch (e) {
      // Ignore screenshot errors
    }

    return {
      success: false,
      error: error.message,
    };
  } finally {
    console.log("\n🔒 Closing browser...");
    await browser.close();
  }
}

// Run test
testSingleProperty()
  .then((result) => {
    if (result.success) {
      console.log("\n✅ Test completed successfully!");
      process.exit(0);
    } else {
      console.log(`\n❌ Test failed: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });

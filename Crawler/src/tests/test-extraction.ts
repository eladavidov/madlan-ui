/**
 * Simple Playwright Test Script
 * Tests property data extraction without Crawlee overhead
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { extractPropertyData, extractImageUrls } from "./src/extractors/propertyExtractor.js";

// Enable stealth
chromium.use(StealthPlugin());

async function testExtraction() {
  console.log("🧪 Starting extraction test...\n");

  const testUrl = "https://www.madlan.co.il/listings/HGEnss0Xfyg";
  console.log(`📍 Target URL: ${testUrl}\n`);

  // Launch browser
  console.log("🚀 Launching browser with stealth...");
  const browser = await chromium.launch({
    headless: false, // Visible so you can see what's happening
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
    // CRITICAL: Explicitly enable JavaScript
    javaScriptEnabled: true,
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });

  const page = await context.newPage();

  try {
    // Navigate to property page
    console.log("🌐 Navigating to property page...");
    await page.goto(testUrl, { waitUntil: "domcontentloaded" });

    // Take screenshot immediately to see what we got
    console.log("📸 Taking initial screenshot...");
    await page.screenshot({ path: "./debug-screenshots/test-initial.png", fullPage: true });

    // Check what content we have
    const bodyTextLength = await page.evaluate(() => document.body.textContent?.length || 0);
    const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 200));
    console.log(`📄 Page text length: ${bodyTextLength} chars`);
    console.log(`📄 First 200 chars: ${bodyText}`);

    // Wait for content
    console.log("⏳ Waiting for React content to render...");
    try {
      await page.waitForFunction(
        () => {
          const body = document.body.textContent || "";
          return body.length > 500 && !body.includes("You need to enable JavaScript");
        },
        { timeout: 10000 }
      );
      console.log("✅ Content rendered\n");
    } catch (e) {
      console.log("⚠️  Timeout waiting for content, taking screenshot...");
      await page.screenshot({ path: "./debug-screenshots/test-timeout.png", fullPage: true });
      const html = await page.content();
      console.log("\n📄 Page HTML (first 1000 chars):");
      console.log(html.substring(0, 1000));
      throw e;
    }

    // Small pause to ensure everything is loaded
    await page.waitForTimeout(2000);

    // Check for blocking
    const pageContent = await page.content();
    const hasBlocking = pageContent.includes("Press & Hold") ||
                       pageContent.includes("access denied") ||
                       pageContent.includes("סליחה על ההפרעה");

    if (hasBlocking) {
      console.log("🛑 BLOCKING DETECTED - Taking screenshot...");
      await page.screenshot({ path: "./debug-screenshots/test-blocked.png", fullPage: true });
      throw new Error("Page is blocked (CAPTCHA or rate limit)");
    }

    console.log("✅ No blocking detected\n");

    // Extract property data
    console.log("📊 Extracting property data...");
    const propertyData = await extractPropertyData(page, testUrl);

    if (!propertyData) {
      console.log("❌ EXTRACTION FAILED - Taking screenshot...");
      await page.screenshot({ path: "./debug-screenshots/test-failed.png", fullPage: true });

      // Debug: Print page text
      const bodyText = await page.evaluate(() => document.body.textContent?.substring(0, 500));
      console.log("\n📄 First 500 chars of page text:");
      console.log(bodyText);

      throw new Error("extractPropertyData returned null");
    }

    console.log("✅ EXTRACTION SUCCESSFUL!\n");
    console.log("=" .repeat(60));
    console.log("📋 EXTRACTED DATA:");
    console.log("=" .repeat(60));
    console.log(`ID: ${propertyData.id}`);
    console.log(`Price: ₪${propertyData.price || "N/A"}`);
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
    console.log(`\nDescription: ${propertyData.description?.substring(0, 100) || "N/A"}...`);
    console.log(`\nContact:`);
    console.log(`  Name: ${propertyData.contact_name || "N/A"}`);
    console.log(`  Phone: ${propertyData.contact_phone || "N/A"}`);
    console.log(`  Agency: ${propertyData.contact_agency || "N/A"}`);
    console.log("=" .repeat(60));

    // Extract images
    console.log("\n📸 Extracting image URLs...");
    const imageUrls = await extractImageUrls(page);
    console.log(`✅ Found ${imageUrls.length} images`);
    if (imageUrls.length > 0) {
      console.log("First 3 image URLs:");
      imageUrls.slice(0, 3).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

    // Take success screenshot
    console.log("\n📸 Taking screenshot...");
    await page.screenshot({ path: "./debug-screenshots/test-success.png", fullPage: true });
    console.log("✅ Screenshot saved: ./debug-screenshots/test-success.png");

    console.log("\n✅ TEST PASSED! Extraction is working correctly.");

  } catch (error: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run test
testExtraction().catch(console.error);

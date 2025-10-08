/**
 * Extractor Tests with Mock HTML
 * Tests extraction logic without hitting live site
 */

import { chromium } from "playwright";
import { extractPropertyData, extractImageUrls } from "../extractors/propertyExtractor.js";
import type { PropertyInput } from "../models/Property.js";

console.log("🧪 Testing Extractors with Mock HTML\n");

async function testPropertyExtractor() {
  console.log("📦 Test 1: Property Extractor with Mock HTML");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Create mock property page HTML
  const mockHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><title>Test Property</title></head>
    <body>
      <div class="property-price">1,500,000 ₪</div>
      <div class="rooms-value">3.5 חדרים</div>
      <div class="property-size">90 מ"ר</div>
      <div class="floor-value">קומה 2</div>
      <div class="total-floors">מתוך 5 קומות</div>
      <div class="property-address">רחוב הרצל 50, חיפה</div>
      <div class="neighborhood-value">כרמל מרכז</div>
      <div class="city-value">חיפה</div>
      <div class="property-type">דירה</div>
      <div class="property-description">דירה מרווחת וממוזגת עם נוף לים</div>

      <!-- Amenities -->
      <div class="amenity-parking">חניה</div>
      <div class="amenity-elevator">מעלית</div>
      <div class="amenity-balcony">מרפסת</div>

      <!-- Images -->
      <div class="property-gallery">
        <img src="https://example.com/img1.jpg" />
        <img src="https://example.com/img2.jpg" />
        <img src="https://example.com/img3.jpg" />
      </div>

      <!-- Contact -->
      <div class="contact-name">יוסי כהן</div>
      <div class="contact-phone">050-1234567</div>
      <div class="agent-agency">RE/MAX</div>
    </body>
    </html>
  `;

  await page.setContent(mockHTML);

  // Test extraction
  const testUrl = "https://www.madlan.co.il/listings/test-12345";
  const property = await extractPropertyData(page, testUrl);

  if (!property) {
    console.error("  ❌ Failed to extract property");
    await browser.close();
    return false;
  }

  // Verify extraction
  const results = {
    id: property.id === "test-12345" ? "✅" : "❌",
    url: property.url === testUrl ? "✅" : "❌",
    city: property.city === "חיפה" ? "✅" : `❌ (got: ${property.city})`,
    address: property.address?.includes("הרצל") ? "✅" : `❌ (got: ${property.address})`,
    neighborhood: property.neighborhood?.includes("כרמל") ? "✅" : `❌ (got: ${property.neighborhood})`,
    propertyType: property.property_type ? "✅" : "❌",
    description: property.description?.includes("מרווחת") ? "✅" : "❌",
    hasParking: property.has_parking ? "✅" : "❌",
    hasElevator: property.has_elevator ? "✅" : "❌",
    hasBalcony: property.has_balcony ? "✅" : "❌",
  };

  console.log("  Property Extraction Results:");
  Object.entries(results).forEach(([field, status]) => {
    console.log(`    ${status} ${field}`);
  });

  // Test image extraction
  const images = await extractImageUrls(page);
  console.log(`  ${images.length === 3 ? "✅" : "❌"} Image extraction (expected 3, got ${images.length})`);

  await browser.close();

  const allPassed = Object.values(results).every((r) => r === "✅") && images.length === 3;
  console.log(allPassed ? "\n  ✅ All extraction tests passed!" : "\n  ⚠️  Some tests failed");
  return allPassed;
}

async function testSearchExtractor() {
  console.log("\n📦 Test 2: Search Extractor with Mock HTML");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Create mock search results page
  const mockHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head><title>Search Results</title></head>
    <body>
      <div class="results-count">נמצאו 142 תוצאות</div>

      <div class="property-card">
        <a href="/listings/12345">
          <div class="property-price">1,500,000 ₪</div>
          <div class="room-count">3.5 חדרים</div>
        </a>
      </div>

      <div class="property-card">
        <a href="/listings/67890">
          <div class="property-price">2,000,000 ₪</div>
          <div class="room-count">4 חדרים</div>
        </a>
      </div>

      <div class="property-card">
        <a href="/bulletin/11111">
          <div class="property-price">1,800,000 ₪</div>
          <div class="room-count">3 חדרים</div>
        </a>
      </div>

      <button class="pagination-next">הבא</button>
    </body>
    </html>
  `;

  await page.setContent(mockHTML);
  await page.goto("https://www.madlan.co.il/for-sale/חיפה");

  // Import search extractor
  const { extractPropertyUrls, hasNextPage, getResultsCount } = await import("../extractors/searchExtractor.js");

  // Test URL extraction
  const urls = await extractPropertyUrls(page);
  console.log(`  ${urls.length === 3 ? "✅" : "❌"} URL extraction (expected 3, got ${urls.length})`);

  if (urls.length > 0) {
    console.log(`  ${urls[0].includes("listings") ? "✅" : "❌"} First URL is property page`);
  }

  // Test pagination detection
  const hasNext = await hasNextPage(page);
  console.log(`  ${hasNext ? "✅" : "❌"} Pagination detection`);

  // Test results count
  const count = await getResultsCount(page);
  console.log(`  ${count === 142 ? "✅" : "❌"} Results count (expected 142, got ${count})`);

  await browser.close();

  const allPassed = urls.length === 3 && hasNext && count === 142;
  console.log(allPassed ? "\n  ✅ All search tests passed!" : "\n  ⚠️  Some tests failed");
  return allPassed;
}

async function runTests() {
  try {
    const test1 = await testPropertyExtractor();
    const test2 = await testSearchExtractor();

    console.log("\n" + "=".repeat(60));
    if (test1 && test2) {
      console.log("🎉 All Extractor Tests Passed!");
      console.log("=".repeat(60));
      console.log("\n✅ Phase 3 extraction logic verified with mock HTML");
      console.log("✅ Selectors working correctly");
      console.log("✅ Ready for live testing once CAPTCHA is bypassed");
    } else {
      console.log("⚠️  Some Tests Failed");
      console.log("=".repeat(60));
      console.log("\n⚠️  Extraction logic needs adjustment");
      console.log("⚠️  Selectors may need updating");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

runTests();

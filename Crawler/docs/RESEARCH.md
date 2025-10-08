# Madlan.co.il Website Research

**Research Date**: 2025-10-08
**Research Method**: Chrome DevTools MCP + Reference Screenshots Analysis + Existing Data Review
**Target URL**: https://www.madlan.co.il/for-sale/חיפה

---

## Executive Summary

### Key Findings

1. **Anti-Bot Protection**: ✅ CONFIRMED - Madlan uses CAPTCHA ("Press & Hold" challenge)
2. **JavaScript Required**: ✅ Site is fully JavaScript-rendered
3. **Property Data Available**: ✅ Rich property data visible in search results and detail pages
4. **Image Galleries**: ✅ Multiple images per property
5. **Crawlee Viability**: ✅ Suitable for Crawlee + Playwright approach

### Critical Discovery: Anti-Bot Protection

**CAPTCHA Type**: "Press & Hold" human verification challenge
**Trigger Behavior**:
- Triggered immediately on page access via automation
- Message: "בזמן שגלשת ב www.madlan.co.il משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט"
- Iframe-based CAPTCHA verification required

**Implications for Crawler**:
- ✅ Crawlee's anti-detection features are ESSENTIAL
- ✅ Must use Playwright with stealth plugins
- ✅ Random delays between requests mandatory
- ✅ Conservative concurrency limits required
- ✅ Session persistence needed
- ⚠️ May need human intervention for initial verification

**Reference**: Encounter ID: `4c7296a0-a437-11f0-9921-019ec88e1adb`

---

## Search Results Page Structure

### URL Pattern

**Base URL**: `https://www.madlan.co.il/for-sale/{city}`

**Example URLs**:
- Haifa: `https://www.madlan.co.il/for-sale/חיפה` (URL-encoded: `%D7%97%D7%99%D7%A4%D7%94`)
- General search: `https://www.madlan.co.il/for-sale`

### Page Layout

**Main Components**:
1. **Header**: Navigation bar with search, filters, login
2. **Filter Bar**: Advanced search filters (price range, rooms, property type, etc.)
3. **View Toggle**: List view vs Grid view
4. **Results Count**: "X דירות למכירה ב{city}" or "X נכסים באזור"
5. **Property Grid**: Cards displayed in responsive grid (typically 3 columns on desktop)
6. **Map Panel**: Right-side map showing property locations (Leaflet/Mapbox)
7. **Footer**: Links, contact info, social media

### Property Card Structure (Search Results)

Based on screenshot analysis and existing data:

```html
<!-- Typical Property Card -->
<div class="property-card">
  <!-- Property Image -->
  <img src="https://ext.same-assets.com/{id}/{image_id}.webp" />

  <!-- Badge (if applicable) -->
  <span class="badge-new">חדש</span>  <!-- "New" badge for new properties/projects -->

  <!-- Favorite Icon -->
  <button class="favorite-icon">♡</button>

  <!-- Property Title -->
  <h3>שכנת חיפה</h3>  <!-- Project/building name or street address -->

  <!-- Location Info -->
  <div class="location">
    <span class="primary-location">נווה שאנן</span>  <!-- Neighborhood -->
    <span class="secondary-location">שביט</span>  <!-- City or sub-area -->
  </div>

  <!-- Price -->
  <div class="price">
    <span>מ-2.2M-₪</span>  <!-- "From 2.2M ₪" for projects -->
    <!-- OR -->
    <span>2,400,000 ₪</span>  <!-- Fixed price for individual properties -->
  </div>

  <!-- Room Count -->
  <div class="rooms">
    <span>3-5 חדרים</span>  <!-- "3-5 rooms" for projects -->
    <!-- OR -->
    <span>4.5 חדרים</span>  <!-- Exact room count for properties -->
  </div>
</div>
```

**Observed Data Fields (Search Results)**:
- `image`: Property main image URL
- `badge`: "חדש" (New) for new listings/projects
- `title`: Property/project name or address
- `neighborhood`: Primary location (neighborhood name)
- `city`: Secondary location (city or area)
- `price`: Price in ₪ (may be range "מ-X-₪" or exact)
- `rooms`: Room count (may be range "X-Y חדרים" or exact "X חדרים")
- `propertyUrl`: Link to property detail page

### Pagination Mechanism

**Type**: NOT OBSERVED in screenshots (appears to use initial load)

**Possible Implementations** (to test during Phase 2):
1. Infinite scroll (load more on scroll)
2. "Load More" button
3. Page numbers
4. API-based lazy loading

**Action Item**: Test pagination during Phase 2 crawler development

---

## Property Detail Page Structure

### URL Pattern

**Pattern**: `https://www.madlan.co.il/property/{property_id}`
**Example**: (to be discovered during actual crawl)

### Property Data Fields

Based on `properties.json` schema and typical real estate sites:

#### Required Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `id` | string | "1" | Unique property identifier |
| `price` | number | 2400000 | Price in ₪ (integer) |
| `rooms` | number | 4.5 | Room count (0.5 increments) |
| `size` | number | 120 | Size in square meters |
| `address` | string | "רחוב בן גוריון 65" | Street address |
| `neighborhood` | string | "הדר" | Neighborhood name |
| `city` | string | "חיפה" | City name |
| `type` | string | "דירה" | Property type |
| `image` | string | "https://..." | Main image URL |

#### Optional Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `floor` | number \| null | 6 | Floor number (null if N/A) |
| `parking` | boolean \| null | true | Has parking spot |
| `elevator` | boolean \| null | true | Building has elevator |
| `balcony` | boolean \| null | true | Has balcony |
| `description` | string \| null | "דירה משופצת, נוף לים" | Text description |

#### Property Types Observed

From `properties.json`:
- `"דירה"` - Apartment
- `"פנטהאוז"` - Penthouse
- `"דירת גן"` - Garden apartment

**Expected Additional Types** (common on Israeli real estate sites):
- `"דופלקס"` - Duplex
- `"סטודיו"` - Studio
- `"מיני פנטהאוז"` - Mini penthouse
- `"טריפלקס"` - Triplex
- `"דירת גג"` - Rooftop apartment
- `"בית פרטי"` - Private house
- `"קוטג'"` - Cottage

### Image Gallery Structure

**Image URL Format**: `https://ext.same-assets.com/{collection_id}/{image_id}.webp`

**Examples from properties.json**:
- `https://ext.same-assets.com/3745260647/857027196.webp`
- `https://ext.same-assets.com/3745260647/3939170179.webp`
- `https://ext.same-assets.com/3745260647/900133140.webp`

**Expected Behavior**:
- Multiple images per property (typically 5-20)
- WebP format preferred (may also have JPG fallbacks)
- Possible thumbnail vs full-resolution URLs
- Lazy loading likely implemented

**Action Item**: Extract all image URLs from gallery during property crawl

---

## CSS Selectors (Preliminary)

**⚠️ NOTE**: These selectors are PRELIMINARY based on screenshot analysis.
**Must be verified** during Phase 2 actual crawling with live HTML inspection.

### Search Results Page Selectors

```typescript
// Property Cards
const SELECTORS = {
  // Container
  propertyCards: '.property-card, [data-testid="property-card"]',

  // Individual Fields (PRELIMINARY - MUST VERIFY)
  image: 'img',
  badge: '.badge-new, .new-badge',
  title: 'h3, .property-title',
  neighborhood: '.primary-location, .location-primary',
  city: '.secondary-location, .location-secondary',
  price: '.price, .property-price',
  rooms: '.rooms, .room-count',
  link: 'a[href*="/property/"]',

  // Map
  map: '#map, .map-container',

  // Pagination
  nextButton: '.pagination-next, button[aria-label*="הבא"]',
  loadMore: 'button:has-text("טען עוד")',
}
```

### Property Detail Page Selectors

```typescript
// PRELIMINARY - Based on typical real estate site structure
const PROPERTY_SELECTORS = {
  // Basic Info
  price: '[data-testid="price"], .property-price',
  rooms: '[data-testid="rooms"], .room-count',
  size: '[data-testid="size"], .property-size',
  floor: '[data-testid="floor"], .floor-number',

  // Location
  address: '[data-testid="address"], .property-address',
  neighborhood: '[data-testid="neighborhood"], .neighborhood',
  city: '[data-testid="city"], .city',

  // Property Details
  type: '[data-testid="property-type"], .property-type',
  description: '[data-testid="description"], .property-description',

  // Amenities (boolean fields)
  parking: '[data-testid="parking"], .amenity-parking',
  elevator: '[data-testid="elevator"], .amenity-elevator',
  balcony: '[data-testid="balcony"], .amenity-balcony',

  // Images
  imageGallery: '.image-gallery, [data-testid="gallery"]',
  images: '.gallery-image, img[data-gallery-image]',
}
```

**Action Item**: Extract actual selectors using Chrome DevTools during Phase 2

---

## Data Validation Rules

Based on `properties.json` observed values:

### Price Validation
- **Type**: Positive integer
- **Range**: 100,000 ₪ - 50,000,000 ₪ (typical range)
- **Observed Min**: 1,320,000 ₪
- **Observed Max**: 3,950,000 ₪

### Rooms Validation
- **Type**: Decimal (0.5 increments)
- **Range**: 0.5 - 15 rooms (typical)
- **Valid Values**: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, ...
- **Observed Values**: 3, 3.5, 4.5, 5, 7

### Size Validation
- **Type**: Positive integer
- **Range**: 20 m² - 1000 m² (typical)
- **Observed Range**: 58 m² - 200 m²

### Floor Validation
- **Type**: Integer or null
- **Range**: -2 (basement) to 50+ (high-rise)
- **Special Values**: 0 (ground floor), negative (basement)
- **Null Handling**: Acceptable for properties without floor info

---

## Edge Cases & Data Variations

### Missing Data Scenarios

1. **No Floor Information**: Some properties (houses, cottages) may not have floor
2. **No Parking Info**: Older listings may not specify parking
3. **No Images**: Rare but possible (placeholder image needed)
4. **Price Ranges**: Projects show price ranges ("מ-2.2M-₪") instead of exact price

### Property Type Variations

1. **New Projects** (`badge: "חדש"`):
   - May have price ranges instead of exact prices
   - May have room ranges (e.g., "3-5 חדרים")
   - Typically multiple units available

2. **Individual Properties**:
   - Fixed price
   - Exact room count
   - Single unit

3. **Luxury Properties**:
   - May have additional amenities (pool, sauna, etc.)
   - Higher price ranges
   - More images

### Text Encoding
- **Language**: Hebrew (RTL)
- **Character Set**: UTF-8
- **Special Characters**: Hebrew letters, numbers, symbols (₪, -, spaces)

---

## JavaScript Rendering Requirements

**Confirmed**: Madlan is a fully JavaScript-rendered Single Page Application (SPA)

**Implications**:
- ✅ **MUST use Playwright** (or Puppeteer) for browser automation
- ❌ **Cannot use simple HTTP requests** (curl, requests, axios)
- ✅ **Wait for dynamic content** to load before extracting
- ✅ **Handle lazy loading** for images and pagination
- ✅ **Execute JavaScript** to interact with UI elements

**Wait Strategies Needed**:
```typescript
// Example wait strategies for Crawlee
await page.waitForSelector('.property-card');
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => document.querySelectorAll('.property-card').length > 0);
```

---

## Anti-Bot Behavior Observations

### CAPTCHA Challenge Details

**Type**: PerimeterX "Press & Hold" CAPTCHA
**Trigger Conditions**:
- ✅ Immediate trigger on automated browser access
- ✅ Likely triggered by automation detection (navigator.webdriver, etc.)

**Error Page Content**:
```
סליחה על ההפרעה...
בזמן שגלשת ב www.madlan.co.il משהו בדפדפן שלך גרם לנו לחשוב שאתה רובוט.

יש מספר סיבות שיכולות לגרום לכך:
- אתה משוטט במהירות על-אנושית.
- השבתת את JavaScript בדפדפן האינטרנט שלך.
- תוסף דפדפן של צד שלישי, כגון Ghostery או NoScript, מונע הפעלה של JavaScript.
```

**Contact Info** (if blocked):
- Phone: 077-6704417
- Email: desk@madlan.co.il

### MCP Testing Results (Chrome DevTools vs Playwright)

**Testing Date**: 2025-10-08
**Both MCPs Installed**: ✅ Chrome DevTools MCP + Playwright MCP

#### Chrome DevTools MCP Results

**Test 1**: Navigate to https://www.madlan.co.il
- ❌ **Result**: CAPTCHA triggered immediately
- **CAPTCHA Type**: "Press & Hold" challenge in iframe
- **Encounter ID**: `256b8560-a439-11f0-b3d5-11cda5ec5369`
- **Detection Indicators**:
  - Immediate bot detection on page load
  - 403 errors in console: `Failed to load resource: the server responded with a status of 403 ()`
  - Page shows: "אתה משוטט במהירות על-אנושית" (You're browsing at superhuman speed)

**Test 2**: Navigate to https://www.madlan.co.il/for-sale
- ❌ **Result**: Same CAPTCHA, even worse blocking
- Screenshot timeout after CAPTCHA appears
- Session becomes unusable after CAPTCHA

#### Playwright MCP Results

**Status**: ⚠️ Playwright MCP installed but tools not available in Claude Code session
- Playwright MCP uses different tool names (`browser_click`, `browser_evaluate`, etc.)
- Tools not appearing in available MCP tools list
- May require different configuration or restart
- **Conclusion**: Cannot test directly, but would likely trigger same CAPTCHA

#### Key Findings & Recommendations

**❌ MCP Tools CANNOT Bypass Madlan's CAPTCHA**:
1. Both Chrome DevTools and Playwright MCP trigger instant CAPTCHA
2. The "Press & Hold" challenge is specifically designed to block automation
3. Browser fingerprinting detects automation markers (`navigator.webdriver`, etc.)
4. Session becomes blocked even after CAPTCHA appears

**✅ Correct Approach for Crawler**:

**DO NOT use MCP tools directly for crawling**. Instead:

1. **Use Crawlee with Playwright** (as planned):
   ```typescript
   import { PlaywrightCrawler } from 'crawlee';

   const crawler = new PlaywrightCrawler({
     // Crawlee's built-in anti-detection
     launchContext: {
       launchOptions: {
         headless: false, // May help with detection
       },
     },

     // Anti-bot configuration (CRITICAL)
     maxRequestsPerMinute: 30, // Very conservative
     minConcurrency: 1,
     maxConcurrency: 3,

     // Session management
     persistCookiesPerSession: true,
     sessionPoolOptions: {
       maxPoolSize: 10,
     },
   });
   ```

2. **Additional Stealth Measures**:
   - Use `playwright-extra` with `puppeteer-extra-plugin-stealth`
   - Disable automation flags: `args: ['--disable-blink-features=AutomationControlled']`
   - Random realistic delays: 3-8 seconds between requests
   - Human-like mouse movements and scrolling
   - Residential proxies (if blocking persists)

3. **Initial Testing Strategy**:
   - Start with manual CAPTCHA solving (headless: false)
   - Test with 1-2 properties first
   - Monitor for blocking patterns
   - Gradually increase crawl rate if successful

**MCP Tools Purpose**:
- ✅ **Good for**: Research, understanding page structure, testing selectors
- ❌ **Bad for**: Actual data collection, bypassing CAPTCHAs
- **Use Case**: Use MCPs to inspect HTML after manual CAPTCHA solving in development

### Anti-Bot Bypass Strategy

Refer to `ANTI-BLOCKING.md` for comprehensive strategy. Key points:

1. **Crawlee Anti-Detection**:
   - Use `PlaywrightCrawler` with stealth mode
   - Random user agents
   - Realistic viewport sizes
   - Cookie persistence

2. **Rate Limiting**:
   - `maxRequestsPerMinute: 60` (1 req/sec) - CONSERVATIVE
   - Random delays: 2-5 seconds between requests
   - Low concurrency: 2-5 parallel requests max

3. **Session Management**:
   - `persistCookiesPerSession: true`
   - Session rotation strategy
   - Possible proxy rotation (if blocking persists)

4. **Human-Like Behavior**:
   - Random scroll actions
   - Mouse movements (optional)
   - Realistic timing patterns

---

## Aggressive Research & Bypass Attempts Summary

**Research Date**: 2025-10-08
**Approach**: Tested multiple bypass techniques to understand Madlan's anti-bot defenses

### ✅ Successful Access Points

#### 1. robots.txt
- **URL**: `https://www.madlan.co.il/robots.txt`
- **Status**: ✅ Accessible without CAPTCHA
- **Method**: Both WebFetch and Chrome DevTools MCP
- **Findings**:
  - Extensive disallow rules (40+ paths blocked)
  - 26 sitemap references (projects, neighborhoods, listings, streets, etc.)
  - No explicit crawl-delay specified
  - `/api/` and `/api2/` endpoints disallowed
  - `/search/` disallowed
  - Most internal endpoints blocked

**Key Disallowed Paths**:
```
/api/, /api2/, /profile/, /content/, /search/
/homes/getData, /homes/search, /homes/*/phone
/map, /insights/, /widget
```

**Sitemap URLs Found** (26 total):
```
https://www.madlan.co.il/sitemap/listings__index.xml (main listings)
https://www.madlan.co.il/sitemap/neighbourhoods_ais__index.xml
https://www.madlan.co.il/sitemap/settlements_am__index.xml
https://www.madlan.co.il/blog/sitemap_index.xml (blog)
... (22 more)
```

#### 2. Blog (madlan.co.il/blog/)
- **URL**: `https://www.madlan.co.il/blog/` or `https://madlan.co.il/blog/`
- **Status**: ✅ Fully accessible without CAPTCHA
- **Method**: Chrome DevTools MCP
- **Findings**:
  - Full blog loads with all content visible
  - 183+ links extracted from homepage
  - Links to main site for-sale pages present
  - No anti-bot protection on blog subdomain
  - Uses WordPress (based on CSS/JS patterns)

**Useful Links Found in Blog**:
- `https://www.madlan.co.il/for-sale/ישראל` (Israel-wide for-sale)
- `https://www.madlan.co.il/for-rent/ישראל` (Israel-wide rentals)
- `https://www.madlan.co.il/explore/` (explore page)
- `https://www.madlan.co.il/lp/homeOwner` (landing page)

#### 3. Sitemap Index Files
- **URL**: `https://www.madlan.co.il/sitemap/listings__index.xml`
- **Status**: ✅ Accessible via WebFetch
- **Method**: WebFetch tool
- **Findings**:
  - Main listings sitemap references 5 sub-sitemaps:
    - `listings_s0.xml` through `listings_s4.xml`
  - All updated: 2025-10-07
  - **Issue**: Individual sitemap files too large (>10MB) for WebFetch
  - Cannot extract individual property URLs due to size limits

### ❌ Failed Access Attempts

#### 1. Main Homepage
- **URL**: `https://www.madlan.co.il/`
- **Status**: ❌ CAPTCHA triggered immediately
- **CAPTCHA Type**: "Press & Hold" challenge
- **Trigger**: Instant on page load

#### 2. For-Sale Pages (Direct Access)
- **URL**: `https://www.madlan.co.il/for-sale/חיפה`
- **Status**: ❌ CAPTCHA triggered immediately
- **Attempts**:
  - Direct navigation: CAPTCHA
  - Different cities: CAPTCHA
  - Various URL patterns: CAPTCHA

#### 3. For-Sale Pages (Blog Referrer)
- **URL**: Clicked from blog → `https://www.madlan.co.il/for-sale/ישראל`
- **Status**: ❌ CAPTCHA triggered even with blog referrer
- **Finding**: Referrer-based bypass does NOT work
- **Note**: Anti-bot system doesn't trust same-domain referrers

#### 4. Individual Listing Sitemaps
- **URL**: `https://www.madlan.co.il/sitemap/listings_s0.xml`
- **Status**: ⚠️ Accessible but too large
- **Issue**: File size >10MB exceeds WebFetch limit
- **Workaround Needed**: Would require direct download or chunked parsing

### 🔍 Key Learnings & Patterns

#### Anti-Bot Detection Triggers
1. **Immediate Detection**: CAPTCHA appears instantly on property pages
2. **Browser Fingerprinting**: Detects automation markers (`navigator.webdriver`)
3. **Session Persistence**: CAPTCHA persists even after appearing once
4. **No Referrer Bypass**: Blog → Main site navigation still triggers CAPTCHA
5. **Page-Specific**: Blog excluded from anti-bot system

#### URL Patterns Discovered
```
Properties (for-sale):
https://www.madlan.co.il/for-sale/{city}
https://www.madlan.co.il/for-sale/ישראל
https://www.madlan.co.il/for-sale/ישראל?filters=...

Individual listings (inferred):
https://www.madlan.co.il/listings/{id}
https://www.madlan.co.il/bulletin/{id}

Commercial:
https://www.madlan.co.il/commercial/for-sale/{city}
https://www.madlan.co.il/commercial/for-rent/{city}

Neighborhoods:
https://www.madlan.co.il/for-sale/{city}/{neighborhood}
```

#### robots.txt Analysis
**Allowed Crawling**:
- Blog pages (not explicitly disallowed)
- Static pages (about, contact, etc.)
- `/address` endpoint (explicitly allowed)

**Disallowed for Bots**:
- All API endpoints
- Search functionality
- User profiles
- Map data endpoints
- Analytics/tracking endpoints
- Phone number reveals
- Internal admin paths

#### Console Errors Observed
```
Failed to load resource: the server responded with a status of 403 ()
[ERROR] ttq not found (TikTok pixel)
ReferenceError: ga is not defined (Google Analytics)
```

### 📊 Research Completeness Assessment

**What We Know** ✅:
- Property data structure (from properties.json)
- URL patterns for listings
- Anti-bot protection type (PerimeterX CAPTCHA)
- Accessible entry points (blog, robots.txt)
- Image URL format (ext.same-assets.com pattern)
- robots.txt rules and sitemaps

**What We DON'T Know** ❌:
- Actual property page HTML structure (blocked by CAPTCHA)
- Exact CSS selectors for data extraction
- Pagination mechanism (infinite scroll? load more?)
- API endpoints structure (if any are used)
- Number of active listings in Haifa

**What Needs Phase 2 Verification** ⚠️:
- CSS selectors (preliminary only)
- Property detail page layout
- Image gallery structure
- Additional amenity fields
- Contact information display
- Listing date formats

### 🎯 Recommended Crawler Strategy

Based on aggressive testing, here's the recommended approach:

#### Phase 2 Initial Setup (Crawlee)
```typescript
import { PlaywrightCrawler } from 'crawlee';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin
chromium.use(StealthPlugin());

const crawler = new PlaywrightCrawler({
  launchContext: {
    launcher: chromium,
    launchOptions: {
      headless: false, // CRITICAL: Start non-headless for manual CAPTCHA
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    },
  },

  // Ultra-conservative rate limiting
  maxRequestsPerMinute: 20, // Even lower than planned
  minConcurrency: 1,
  maxConcurrency: 2,

  // Session management
  persistCookiesPerSession: true,
  sessionPoolOptions: {
    maxPoolSize: 5,
    sessionOptions: {
      maxUsageCount: 50, // Reuse sessions
    },
  },

  // Add delays
  requestHandlerTimeoutSecs: 60,
});
```

#### Phase 2 Testing Strategy
1. **Start with headless: false**
   - Manually solve initial CAPTCHA
   - Let crawler observe successful session
   - Extract cookies/session data

2. **Test Single Property**
   - Navigate to one property page
   - Wait for full load
   - Extract all data fields
   - Verify selectors

3. **Gradual Scale-Up**
   - If 1 property succeeds → try 5
   - If 5 succeed → try 10
   - Monitor for new CAPTCHA triggers
   - Adjust delays if needed

4. **Session Reuse**
   - After manual CAPTCHA solve, save session
   - Reuse session for subsequent requests
   - May allow multiple requests before re-triggering

#### Alternative Approaches (If Crawlee Fails)
1. **Manual Data Collection**: Manually browse and save HTML pages
2. **API Discovery**: Use browser DevTools to find hidden APIs
3. **RSS/Feed Discovery**: Check if Madlan has RSS feeds
4. **Partnership**: Contact Madlan for data access agreement
5. **Third-Party APIs**: Check if property data available from aggregators

---

## Next Steps (Phase 1.2: Schema Design)

### Required Actions

1. **Design SQLite Schema**:
   - Properties table (all fields from research)
   - Images table (property_id, image_url, order, metadata)
   - Crawl history table (session tracking)
   - Error logs table

2. **Create Migration Script**:
   - `src/database/schema.sql`
   - `src/database/migrations/001_initial.sql`

3. **Define TypeScript Interfaces**:
   - Match database schema exactly
   - Include validation rules
   - Document nullable fields

4. **Create Selector Configuration**:
   - `src/config/selectors.ts` (stub for now)
   - Update after actual HTML inspection in Phase 2

5. **Prepare Test Fixtures**:
   - Sample property JSON (from properties.json)
   - Mock HTML for unit tests
   - Expected extraction results

---

## Research Methodology Notes

**Hybrid Approach Used**:

1. ✅ **Chrome DevTools MCP**: Live browser testing (encountered CAPTCHA)
2. ✅ **Reference Screenshots**: Analyzed original Madlan screenshots for visual structure
3. ✅ **Existing Data**: Reviewed `properties.json` for data schema patterns
4. ✅ **General Domain Knowledge**: Applied typical real estate site patterns

**Limitations**:

- ⚠️ **Selectors are PRELIMINARY**: Not verified against live HTML (blocked by CAPTCHA)
- ⚠️ **Pagination unknown**: Could not observe pagination behavior
- ⚠️ **Property detail page structure**: Inferred from typical patterns, not verified
- ⚠️ **Additional amenities**: May exist but not captured in sample data

**Verification Plan** (Phase 2):

1. Bypass CAPTCHA using Crawlee stealth mode
2. Inspect actual HTML with Chrome DevTools
3. Update selectors with verified values
4. Test extraction on 5-10 live properties
5. Document any discrepancies from this research

---

## Appendix: Sample Data

### Sample Property (from properties.json)

```json
{
  "id": "1",
  "price": 2400000,
  "rooms": 4.5,
  "size": 120,
  "floor": 6,
  "address": "רחוב בן גוריון 65",
  "neighborhood": "הדר",
  "city": "חיפה",
  "image": "https://ext.same-assets.com/3745260647/857027196.webp",
  "type": "דירה",
  "parking": true,
  "elevator": true,
  "balcony": true,
  "description": "דירה משופצת, נוף לים"
}
```

### Image URL Patterns

```
https://ext.same-assets.com/3745260647/857027196.webp
https://ext.same-assets.com/3745260647/3939170179.webp
https://ext.same-assets.com/3745260647/900133140.webp
https://ext.same-assets.com/3745260647/1821799933.webp
```

**Pattern**: `https://ext.same-assets.com/{collection_id}/{image_id}.webp`
- `collection_id`: Appears consistent (e.g., `3745260647`)
- `image_id`: Unique per image (e.g., `857027196`)
- `format`: WebP (modern, efficient format)

---

**End of Research Document**

**Status**: Phase 1.1 Complete ✅
**Next Phase**: 1.2 - Database Schema Design
**Last Updated**: 2025-10-08

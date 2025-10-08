# Madlan Property Crawler - PRD (Product Requirements Document)

## Executive Summary
Build a web crawler to scrape apartment listings from Madlan.co.il, focusing on Haifa properties. The crawler will navigate paginated search results, extract property details from individual listings, and store structured data for analysis.

## Project Overview

### Objectives
- Scrape all apartment listings in Haifa from Madlan.co.il
- Extract comprehensive property data from individual listing pages
- Handle pagination and navigate through multiple result pages
- Store data in a structured, queryable format
- Handle anti-scraping measures (encountered 403 errors during research)

### Target URLs
- **Search Results (Starting Point)**: https://www.madlan.co.il/for-sale/%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?tracking_search_source=new_search&marketplace=residential
- **Sample Property Page**: https://www.madlan.co.il/listings/EKxBKTro1H7?dealType=sale&term=%D7%97%D7%99%D7%A4%D7%94-%D7%99%D7%A9%D7%A8%D7%90%D7%9C&tracking_search_source=new_search&tracking_event_source=list_regular_card&tracking_list_index=0

### Key Challenges Identified
1. **Anti-Scraping Protection**: WebFetch returned 403 errors, indicating bot detection
2. **Hebrew RTL Content**: All content is in Hebrew with RTL layout
3. **Dynamic Content**: Likely uses JavaScript for loading property data
4. **Pagination**: Need to navigate through multiple pages of results
5. **Rate Limiting**: Must implement delays to avoid detection/blocking

## Technical Requirements

### Data to Extract from Property Pages
Based on existing data structure in the project:
- Property ID (unique identifier)
- Price (₪)
- Number of rooms
- Property size (m²)
- Floor number
- Full address
- Neighborhood
- City
- Property type (apartment, penthouse, etc.)
- Amenities (parking, elevator, balcony, etc.)
- **Images/photos** (URLs extracted from listing)
- Description
- Contact information (if available)
- Listing date/last updated

### Image Download Requirements
**Critical**: All property images must be downloaded and stored locally:
- Extract all image URLs from each property listing
- Download images to local storage with organized naming convention
- Store both original URLs and local file paths in the data
- Image naming format: `{propertyId}_{imageIndex}.{ext}`
- Organize in directory structure: `Crawler/data/images/{propertyId}/`
- Handle image download failures gracefully (retry logic)
- Support common formats: JPG, PNG, WebP
- Store image metadata (dimensions, size, download timestamp)

### Functional Requirements
1. **Navigation**
   - Start from Haifa search results page
   - Navigate through all pagination pages
   - Click on individual property listings
   - Handle dynamic content loading

2. **Data Extraction**
   - Extract all property details from listing pages
   - Handle missing/optional fields gracefully
   - Validate extracted data

3. **Data Storage** (Multi-Format)
   - **SQLite**: Primary relational database for structured queries
   - **DuckDB**: Analytical database for data analysis and reporting
   - **JSON**: Export format for compatibility with existing `properties.json`
   - Include metadata (crawl timestamp, source URL, last updated)
   - Support incremental updates (upsert operations)
   - Store image metadata with file paths
   - Track crawl history and statistics

4. **Error Handling**
   - Retry failed requests with exponential backoff
   - Log errors and continue crawling
   - Save progress to resume interrupted crawls

5. **Rate Limiting & Anti-Blocking**
   - Random delays between requests (2-5 seconds)
   - Browser fingerprint randomization
   - Session management with cookies
   - Concurrency control (2-10 parallel requests)
   - Respect robots.txt (if applicable)
   - Monitor for blocking signals and adapt
   - See `ANTI-BLOCKING.md` for comprehensive strategy

### Database Storage Architecture

#### Why Multiple Database Formats?

**SQLite** (Primary operational database):
- ✅ Relational structure for normalized data
- ✅ ACID compliance for data integrity
- ✅ Fast queries with indexes
- ✅ Perfect for incremental updates (upsert)
- ✅ Single file, zero configuration
- ✅ Ideal for operational queries (find property by ID, filter by criteria)

**DuckDB** (Analytical database):
- ✅ Optimized for analytical queries (aggregations, analytics)
- ✅ Columnar storage (faster for reporting)
- ✅ Excellent for data science workflows
- ✅ Can query SQLite directly or maintain separate copy
- ✅ Better for complex aggregations and statistics
- ✅ Parquet export capability

**JSON Export**:
- ✅ Compatibility with existing `properties.json` format
- ✅ Easy integration with main Next.js app
- ✅ Human-readable for debugging
- ✅ Portable data format

#### Database Schema

**Properties Table** (SQLite & DuckDB):
```sql
CREATE TABLE properties (
  id TEXT PRIMARY KEY,              -- Property unique ID
  url TEXT UNIQUE NOT NULL,         -- Source URL
  price INTEGER,                    -- Price in ₪
  rooms REAL,                       -- Number of rooms
  size REAL,                        -- Size in m²
  floor INTEGER,                    -- Floor number
  address TEXT,                     -- Full address
  neighborhood TEXT,                -- Neighborhood name
  city TEXT NOT NULL,               -- City (Haifa)
  property_type TEXT,               -- apartment, penthouse, etc.
  description TEXT,                 -- Property description
  listing_date TEXT,                -- Original listing date

  -- Amenities (boolean flags)
  has_parking BOOLEAN DEFAULT 0,
  has_elevator BOOLEAN DEFAULT 0,
  has_balcony BOOLEAN DEFAULT 0,
  has_air_conditioning BOOLEAN DEFAULT 0,
  has_security_door BOOLEAN DEFAULT 0,
  has_bars BOOLEAN DEFAULT 0,
  has_storage BOOLEAN DEFAULT 0,
  has_shelter BOOLEAN DEFAULT 0,
  is_accessible BOOLEAN DEFAULT 0,
  is_renovated BOOLEAN DEFAULT 0,

  -- Contact info
  contact_name TEXT,
  contact_phone TEXT,

  -- Metadata
  first_crawled_at TEXT NOT NULL,   -- First time we saw this property
  last_crawled_at TEXT NOT NULL,    -- Last time we updated
  last_updated_at TEXT,             -- Last update on source site
  crawl_count INTEGER DEFAULT 1,    -- How many times crawled

  -- Indexes for fast queries
  CREATE INDEX idx_city ON properties(city);
  CREATE INDEX idx_price ON properties(price);
  CREATE INDEX idx_rooms ON properties(rooms);
  CREATE INDEX idx_last_crawled ON properties(last_crawled_at);
);
```

**Property Images Table** (SQLite & DuckDB):
```sql
CREATE TABLE property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id TEXT NOT NULL,        -- Foreign key to properties
  image_index INTEGER NOT NULL,     -- Image order (0, 1, 2...)
  original_url TEXT NOT NULL,       -- Original image URL
  local_path TEXT NOT NULL,         -- Local file path
  file_size INTEGER,                -- File size in bytes
  width INTEGER,                    -- Image width
  height INTEGER,                   -- Image height
  format TEXT,                      -- jpg, png, webp
  downloaded_at TEXT NOT NULL,      -- Download timestamp
  download_success BOOLEAN DEFAULT 1,

  FOREIGN KEY (property_id) REFERENCES properties(id),
  CREATE INDEX idx_property_images ON property_images(property_id);
);
```

**Crawl History Table** (SQLite & DuckDB):
```sql
CREATE TABLE crawl_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crawl_start_time TEXT NOT NULL,
  crawl_end_time TEXT,
  status TEXT NOT NULL,             -- running, completed, failed
  properties_found INTEGER DEFAULT 0,
  properties_new INTEGER DEFAULT 0,
  properties_updated INTEGER DEFAULT 0,
  images_downloaded INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,

  -- Configuration used
  concurrency INTEGER,
  rate_limit INTEGER,

  CREATE INDEX idx_crawl_time ON crawl_history(crawl_start_time);
);
```

**Errors Log Table** (SQLite):
```sql
CREATE TABLE crawl_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  crawl_id INTEGER,                 -- Foreign key to crawl_history
  timestamp TEXT NOT NULL,
  url TEXT,
  error_type TEXT,                  -- network, parse, validation, etc.
  error_message TEXT,
  stack_trace TEXT,

  FOREIGN KEY (crawl_id) REFERENCES crawl_history(id),
  CREATE INDEX idx_error_time ON crawl_errors(timestamp);
);
```

#### Storage Operations

**Upsert Strategy** (Incremental Updates):
```typescript
// SQLite upsert (INSERT OR REPLACE)
INSERT INTO properties (id, url, price, ..., last_crawled_at)
VALUES (?, ?, ?, ..., ?)
ON CONFLICT(id) DO UPDATE SET
  price = excluded.price,
  last_crawled_at = excluded.last_crawled_at,
  crawl_count = crawl_count + 1;
```

**DuckDB Sync**:
- Option 1: Maintain separate DuckDB database (sync from SQLite periodically)
- Option 2: DuckDB can query SQLite directly using `ATTACH` (recommended for simplicity)

```sql
-- DuckDB can read from SQLite directly
ATTACH 'properties.db' AS sqlite_db (TYPE SQLITE);
SELECT * FROM sqlite_db.properties WHERE price > 1000000;
```

#### Data Flow

```
1. Crawlee Extraction
   ↓
2. Validation & Transform
   ↓
3. SQLite Storage (upsert)
   ↓
4. Image Download & Store
   ↓
5. Update image metadata in SQLite
   ↓
6. DuckDB Access (query SQLite directly or sync)
   ↓
7. JSON Export (for Next.js app integration)
```

### Testing Strategy (Continuous Testing)

**IMPORTANT**: Testing is integrated throughout development, NOT just at the end.

#### Test-Driven Development Approach

Each development phase includes:
- ✅ Unit tests written BEFORE implementation
- ✅ Integration tests during development
- ✅ Manual testing after each feature
- ✅ Regression testing on existing features

#### Testing Layers

**1. Unit Tests** (Per Module)
- Data extractors (parse HTML correctly?)
- Validators (detect invalid data?)
- Database operations (upsert works?)
- Image downloader (handles failures?)

**2. Integration Tests** (Component Interaction)
- Crawler → Extractor → Database flow
- Image download → Storage → Metadata update
- Error handling → Retry logic → Logging

**3. End-to-End Tests** (Full Workflow)
- Crawl small dataset (5-10 properties)
- Verify all data fields populated
- Check images downloaded correctly
- Validate database integrity

**4. Manual Testing** (Real-World Validation)
- Test against live Madlan.co.il
- Verify anti-blocking works
- Check data quality manually
- Test crash recovery

## Anti-Blocking Strategy

**📄 See detailed documentation**: [`ANTI-BLOCKING.md`](./ANTI-BLOCKING.md)

### Summary: How We Avoid Blocking

Crawlee provides **excellent built-in anti-blocking features** that work automatically:

#### ✅ Enabled by Default (No Configuration Needed)
1. **Browser Fingerprinting**: Randomizes browser characteristics to appear human-like
2. **User Agent Rotation**: Automatically rotates user agents
3. **TLS Fingerprint Replication**: Makes HTTPS connections appear authentic
4. **Browser-Like Headers**: Generates realistic HTTP headers

#### 🔧 We Will Configure
1. **Concurrency Control**: Limit to 2-10 parallel requests
2. **Rate Limiting**: Cap at 60-120 requests per minute
3. **Random Delays**: Add 2-5 second random delays between requests (critical!)
4. **Session Management**: Maintain cookies across requests

#### ⚠️ Advanced Techniques (If Needed)
1. **Stealth Plugin**: Enhanced anti-detection (if default fingerprinting insufficient)
2. **Headful Mode**: Run visible browser for maximum authenticity
3. **Proxy Rotation**: Only if IP-based blocking detected

### Key Insight

**Crawlee handles most anti-detection automatically**, but we MUST add:
- ✅ **Random delays** (1-5 seconds) between requests
- ✅ **Conservative concurrency** (2-10 concurrent requests)
- ✅ **Rate limits** (60-120 requests/minute)

### Recommended Starting Configuration

```typescript
const crawler = new PlaywrightCrawler({
  // Concurrency & Rate Limiting
  minConcurrency: 2,
  maxConcurrency: 5,
  maxRequestsPerMinute: 60,  // ~1 request per second

  // Session Management
  persistCookiesPerSession: true,

  // Request Handler with Random Delays
  async requestHandler({ page, request }) {
    // Random delay: 2-5 seconds
    await sleep(2000 + Math.random() * 3000);

    // Extract data...
  },
});
```

**See `ANTI-BLOCKING.md` for:**
- Detailed configuration examples
- Progressive strategy (start conservative, increase if not blocked)
- Monitoring and adaptive throttling
- Human-like behaviors (mouse movements, scrolling)
- Proxy configuration (if needed)

## Technology Architecture

### Two-Phase Approach

**IMPORTANT DISTINCTION**: MCP tools are for **research and development**, NOT for the production crawler.

#### Phase 1: Research & Understanding (MCP Tools)
Use **Chrome DevTools MCP** (already installed) for:
- ✅ Interactive website exploration with AI assistance
- ✅ Understanding page structure and DOM elements
- ✅ Identifying CSS selectors and data extraction patterns
- ✅ Testing anti-scraping bypass techniques
- ✅ Debugging and analyzing network requests
- ✅ Taking screenshots for documentation

**Why Chrome DevTools MCP for Research:**
- Already installed and integrated with Claude Code
- Real-time AI-assisted debugging
- Perfect for understanding website structure
- Interactive exploration with immediate feedback

#### Phase 2: Production Crawler (Standalone Application)
Use **Crawlee** (production-ready framework) for:
- ✅ Autonomous long-running crawler operation
- ✅ Built-in queue management and retry logic
- ✅ Automatic proxy rotation and session management
- ✅ Anti-detection features (fingerprinting, user agents)
- ✅ Persistent state and crash recovery
- ✅ Memory and resource optimization

**Why NOT use MCP for production:**
- MCP tools require Claude Code connection (not autonomous)
- Not designed for long-running unattended operations
- Lack production features (queuing, state persistence)
- Higher resource overhead for batch operations

## Production Crawler Technology: Crawlee ⭐⭐⭐

### What is Crawlee?
Crawlee is a production-grade web scraping framework built on top of Playwright/Puppeteer, specifically designed for stable, long-running crawl operations. It's developed by Apify (15k+ GitHub stars).

### Why Crawlee is the Best Choice

**1. Built for Production Scraping:**
- Wraps Playwright but adds essential production features
- "Playwright is amazing for controlling browsers, but it's painful for scraping. You have to manage browsers, tabs, queues, retries, errors, memory..." - Crawlee solves all this

**2. Anti-Detection Built-in:**
- Automatic user agent rotation
- Browser fingerprint randomization
- Session management
- Makes headless browsers behave like real ones

**3. Production Features:**
- ✅ **Request Queue**: Persistent queue with automatic deduplication
- ✅ **Auto-scaling**: Parallel crawling with configurable concurrency
- ✅ **Retry Logic**: Exponential backoff for failed requests
- ✅ **Proxy Support**: Automatic rotation with health checks
- ✅ **State Persistence**: Resume from crashes or interruptions
- ✅ **Memory Management**: Automatic cleanup and optimization
- ✅ **Storage**: Built-in dataset and key-value stores

**4. Developer Experience:**
- TypeScript support (type-safe development)
- Unified interface for HTTP and browser crawling
- Excellent documentation and examples
- Active community and maintenance

**5. Handles Madlan's Challenges:**
- Real browser execution (bypasses 403 errors)
- JavaScript rendering support
- Automatic wait for dynamic content
- Configurable delays and rate limiting
- Session cookies and local storage

### Crawlee vs Direct Playwright

| Feature | Crawlee | Direct Playwright |
|---------|---------|-------------------|
| Request Queue | ✅ Built-in | ❌ Manual implementation |
| Retry Logic | ✅ Automatic | ❌ Manual implementation |
| Proxy Rotation | ✅ Built-in | ❌ Manual implementation |
| Anti-detection | ✅ Automatic | ❌ Manual configuration |
| State Persistence | ✅ Built-in | ❌ Manual implementation |
| Memory Management | ✅ Automatic | ❌ Manual management |
| Production Ready | ✅ Yes | ⚠️ Requires extensive custom code |
| Learning Curve | 📈 Moderate | 📉 Lower initially, complex for production |

### Alternative Technologies (Not Recommended)

**Direct Playwright:**
- ❌ Too low-level, requires building infrastructure
- ❌ No built-in queue, retry, or state management
- ✅ Good for simple scripts, bad for production

**Puppeteer:**
- ❌ Chrome-only (Playwright supports multiple browsers)
- ❌ Same issues as direct Playwright

**Cheerio + Axios:**
- ❌ Won't work - Madlan has anti-scraping (403 errors)
- ❌ Can't handle JavaScript-rendered content
- ✅ Only viable if Madlan didn't have protections

## Implementation Plan

### Phase 1: Research & Schema Design (Days 1-2)
**Tools: Chrome DevTools MCP (AI-assisted)**

**Day 1: Website Research & Data Discovery**

1. ✅ Create `Crawler/` directory structure
2. ✅ PRD documentation complete
3. 🔄 **Use Chrome DevTools MCP to research Madlan.co.il:**

   **Search Results Page:**
   - Navigate to search results page
   - Identify HTML structure and CSS selectors
   - Test pagination mechanism (buttons, infinite scroll, load more?)
   - Extract property card data (what's available on listing page?)
   - Test anti-bot behavior and response

   **Individual Property Page:**
   - Navigate to 5-10 different property pages
   - **Document EVERY available data field:**
     - Basic info: price, rooms, size, floor, address, neighborhood, city
     - Property type: apartment, penthouse, garden apartment, duplex, etc.
     - Amenities: What checkboxes/badges are shown? (parking, elevator, balcony, AC, etc.)
     - Description: Full text description
     - Contact info: Is it available? Name, phone, agency?
     - Dates: Listing date, last updated?
     - Other: Any additional fields we haven't thought of?
   - Analyze image gallery implementation
     - How many images per property (min/max)?
     - Image URLs format
     - Full resolution vs thumbnails
     - Image lazy loading

   **Data Variations:**
   - Test properties with missing fields (no parking info, no floor, etc.)
   - Test different property types
   - Test properties with many images vs few images
   - Note edge cases and data inconsistencies

4. 🔄 **Create RESEARCH.md document:**
   - Complete list of available data fields
   - Field types (string, number, boolean, array)
   - CSS selectors for each field
   - Pagination logic (load more vs page numbers)
   - Image URL patterns
   - JavaScript rendering requirements
   - Potential blocking mechanisms
   - Sample HTML snippets

**Day 2: Schema Design & Validation**

1. 🔄 **Design database schema based on Day 1 findings:**
   - Map discovered fields to database columns
   - Define appropriate data types
   - Create indexes for common queries
   - Design relationships (properties → images)
   - Plan for nullable vs required fields
   - Consider future expansion (other cities)

2. 🔄 **Write schema SQL files:**
   - `schema.sql` - Complete SQLite schema
   - `001_initial.sql` - Initial migration script
   - Document any Madlan fields we're NOT capturing (and why)

3. 🔄 **Create SCHEMA.md documentation:**
   - Field mapping (Madlan field → DB column)
   - Data transformations needed
   - Validation rules
   - Default values
   - Example queries

**Testing (Day 2):**
- ✅ Manual verification of all selectors against 5+ property pages
- ✅ Test selectors work for properties with missing data
- ✅ Verify schema covers all discovered fields
- ✅ Document edge cases and data variations
- ✅ Create sample property JSON with real data from Madlan

**Deliverables:**
- ✅ `RESEARCH.md` - Complete research findings
- ✅ `SCHEMA.md` - Database schema documentation
- ✅ `src/database/schema.sql` - SQLite schema (based on real data)
- ✅ `src/database/migrations/001_initial.sql` - Migration script
- ✅ `src/config/selectors.ts` - CSS selectors (to be implemented in Phase 2)

### Phase 2: Database & Infrastructure Implementation (Days 3-4)
**Tools: Crawlee + TypeScript + SQLite + DuckDB**

**Development Tasks:**

**Day 3: Project Setup**
1. **Project Initialization**
   - Initialize Node.js project in `Crawler/`
   - Install dependencies:
     - `crawlee` - Web scraping framework
     - `playwright` - Browser automation
     - `better-sqlite3` - SQLite database
     - `duckdb` - Analytical database
     - `typescript`, `@types/node` - TypeScript support
     - `winston` or `pino` - Logging
     - `jest`, `@types/jest` - Testing
   - Configure TypeScript with strict mode
   - Set up project structure (folders)
   - Create `.env.example` with configuration options

2. **Database Implementation**
   - Run schema SQL (created in Phase 1)
   - Implement database connection manager
   - Write repository pattern classes:
     - `PropertyRepository.ts` - CRUD for properties
     - `ImageRepository.ts` - Image metadata operations
     - `CrawlHistoryRepository.ts` - Crawl tracking
   - Test database operations (insert, upsert, query)

**Day 4: Basic Crawler Prototype**
3. **Crawler Setup**
   - Implement simple Crawlee PlaywrightCrawler
   - Configure anti-blocking settings:
     - Concurrency: 2-5
     - Rate limit: 60 requests/min
     - Random delays: 2-5 seconds
   - Test navigation to Haifa search page
   - Verify anti-bot bypass (no 403 errors)

4. **Basic Data Extraction**
   - Implement basic property extractor (using selectors from Phase 1)
   - Extract 1-2 properties and save to database
   - Verify data matches schema

**Testing (Day 4):**
- ✅ **Unit Tests**: Database operations (insert, upsert, query)
- ✅ **Unit Tests**: Repository pattern methods
- ✅ **Integration Test**: Crawler → Extractor → Database flow
- ✅ **Manual Test**: Navigate to live site, extract 1-2 properties
- ✅ **Database Test**: Query SQLite, verify data stored correctly
- ✅ **DuckDB Test**: Attach SQLite database, run simple query
- ✅ **Anti-blocking Test**: Verify no 403 errors, delays working

### Phase 3: Core Crawlers Development (Days 5-8)

**Development Tasks:**
1. **Search Results Crawler** (`searchCrawler.ts`)
   - Navigate to Haifa search page
   - Extract property links from current page
   - Implement pagination handling
   - Queue property URLs for detail crawling
   - Handle infinite scroll if needed

2. **Property Details Extractor** (`propertyCrawler.ts`)
   - Navigate to individual property pages
   - Extract all property data fields (using selectors from Phase 1)
   - Handle missing/optional fields gracefully
   - Validate extracted data
   - Extract all image URLs

**Testing (Throughout Days 5-8):**
- ✅ **Unit Tests**: Write tests for each extractor function
- ✅ **Integration Test** (Day 6): Crawl 5 properties end-to-end
- ✅ **Manual Test** (Day 7): Verify data accuracy against live site
- ✅ **Data Quality Test**: Check for missing/invalid fields
- ✅ **Regression Test**: Ensure search crawler still works after property crawler changes

### Phase 4: Image Downloading & Storage (Days 9-10)

**Development Tasks:**
1. **Image Downloader** (`imageDownloader.ts`)
   - Download all property images
   - Organize by property ID in filesystem
   - Handle download failures with retry
   - Validate image files (check file size, format)
   - Store metadata in database

2. **Image Storage Integration**
   - Update database with image metadata
   - Track download success/failure
   - Implement cleanup for failed downloads

**Testing (Day 10):**
- ✅ **Unit Tests**: Image download logic (mock HTTP requests)
- ✅ **Integration Test**: Full crawl with image downloads (5 properties)
- ✅ **Manual Verification**: Open downloaded images, check quality
- ✅ **Database Test**: Verify image metadata stored correctly
- ✅ **Error Handling Test**: Simulate network failures, verify retry

### Phase 5: Production Features (Days 11-13)

**Development Tasks:**
1. **Robustness**
   - Configure Crawlee retry logic
   - Implement comprehensive error logging
   - Add progress tracking (console + database)
   - Session management with cookies
   - Request queue persistence

2. **Rate Limiting & Anti-Blocking**
   - Implement random delays (2-5 seconds)
   - Configure concurrency (2-5 parallel)
   - Set rate limits (60-120 requests/min)
   - Monitor for blocking signals
   - Adaptive throttling on errors

3. **Monitoring & Logging**
   - Structured logging (Winston or Pino)
   - Real-time progress reporting
   - Error tracking in database
   - Crawl statistics (properties found, images downloaded)

**Testing (Day 13):**
- ✅ **Stress Test**: Crawl 20-30 properties continuously
- ✅ **Crash Recovery Test**: Kill crawler mid-run, verify resume works
- ✅ **Blocking Test**: Monitor for 403/CAPTCHA responses
- ✅ **Rate Limit Test**: Verify delays and concurrency respected
- ✅ **Logging Test**: Check logs for completeness

### Phase 6: Export & Analytics (Days 14-15)

**Development Tasks:**
1. **JSON Export**
   - Export SQLite data to JSON format
   - Match existing `properties.json` schema
   - Include image file paths

2. **DuckDB Analytics Setup**
   - Create analytical queries
   - Test SQLite → DuckDB integration
   - Create sample reports (avg price, properties per neighborhood)

3. **CLI Interface**
   - Command-line interface for running crawler
   - Options: full crawl, incremental update, export only
   - Configuration file support

**Testing (Day 15):**
- ✅ **Export Test**: Verify JSON matches expected schema
- ✅ **DuckDB Test**: Run analytical queries, verify results
- ✅ **Integration Test**: JSON export works with main Next.js app
- ✅ **CLI Test**: Test all command-line options

### Phase 7: Full Integration Testing (Days 16-17)

**Testing Focus (No New Development)**

**Day 16: End-to-End Testing**
- ✅ **Full Crawl**: Crawl 50-100 Haifa properties
- ✅ **Data Quality Audit**: Manual review of 20 random properties
- ✅ **Image Verification**: Check 50 random images downloaded correctly
- ✅ **Database Integrity**: Run SQL checks (foreign keys, null values)
- ✅ **Performance Metrics**: Measure crawl rate, memory usage
- ✅ **Anti-Blocking**: Verify no IP blocks or CAPTCHAs

**Day 17: Edge Cases & Stress Testing**
- ✅ **Edge Cases**: Properties with missing data, no images, unusual formats
- ✅ **Crash Recovery**: Kill crawler at various stages, verify resume
- ✅ **Duplicate Handling**: Re-crawl same properties, verify upsert works
- ✅ **Network Issues**: Simulate timeouts, DNS failures
- ✅ **Long-Running Test**: 2-hour continuous crawl

### Phase 8: Documentation & Deployment (Days 18-19)

**Development Tasks:**
1. **Documentation**
   - README with setup instructions
   - Usage guide with examples
   - Configuration documentation
   - Troubleshooting guide
   - API documentation for database schema

2. **Deployment Setup**
   - Scheduled execution (optional cron setup)
   - Environment configuration
   - Backup strategy for databases
   - Monitoring dashboards (optional)

**Final Testing (Day 19):**
- ✅ **Documentation Test**: Follow setup guide on fresh machine
- ✅ **End-User Test**: Have someone else run the crawler
- ✅ **Acceptance Test**: Verify all success metrics met

## Project Structure
```
Crawler/
├── PRD.md                           # This document (requirements & planning)
├── ANTI-BLOCKING.md                 # Anti-blocking strategy documentation
├── RESEARCH.md                      # Website structure documentation (from Phase 1)
├── README.md                        # Setup and usage instructions
├── package.json                     # Dependencies (Crawlee, TypeScript, SQLite, DuckDB)
├── tsconfig.json                    # TypeScript configuration
├── crawlee.config.ts                # Crawlee configuration
├── jest.config.js                   # Jest testing configuration
├── .env.example                     # Environment variables template
├── .env                             # Local environment variables (gitignored)
│
├── src/
│   ├── main.ts                      # Main entry point & CLI
│   │
│   ├── crawlers/
│   │   ├── searchCrawler.ts         # Search results page crawler
│   │   ├── propertyCrawler.ts       # Individual property page crawler
│   │   └── router.ts                # Crawlee request routing logic
│   │
│   ├── extractors/
│   │   ├── propertyExtractor.ts     # Extract property data from DOM
│   │   ├── imageExtractor.ts        # Extract image URLs
│   │   └── paginationExtractor.ts   # Extract pagination links
│   │
│   ├── downloaders/
│   │   └── imageDownloader.ts       # Download & store images
│   │
│   ├── database/
│   │   ├── schema.sql                # SQLite database schema
│   │   ├── migrations/               # Database migration scripts
│   │   │   └── 001_initial.sql
│   │   ├── connection.ts             # Database connection manager
│   │   ├── repositories/             # Data access layer (Repository pattern)
│   │   │   ├── PropertyRepository.ts       # Properties CRUD operations
│   │   │   ├── ImageRepository.ts          # Image metadata operations
│   │   │   ├── CrawlHistoryRepository.ts   # Crawl history tracking
│   │   │   └── ErrorRepository.ts          # Error logging
│   │   ├── sqlite.ts                 # SQLite-specific operations
│   │   └── duckdb.ts                 # DuckDB integration & analytics
│   │
│   ├── export/
│   │   ├── jsonExporter.ts          # Export to JSON format
│   │   └── parquetExporter.ts       # Export to Parquet (via DuckDB)
│   │
│   ├── models/
│   │   ├── Property.ts              # Property data interface/type
│   │   ├── PropertyImage.ts         # Image metadata interface
│   │   ├── CrawlHistory.ts          # Crawl session interface
│   │   └── CrawlConfig.ts           # Configuration interface
│   │
│   ├── utils/
│   │   ├── logger.ts                # Winston/Pino logging
│   │   ├── validators.ts            # Data validation functions
│   │   ├── helpers.ts               # Utility functions
│   │   └── sleep.ts                 # Random delay utilities
│   │
│   └── config/
│       ├── selectors.ts             # CSS selectors (from Phase 1 research)
│       ├── constants.ts             # URLs, timeouts, limits
│       └── database.ts              # Database configuration
│
├── data/
│   ├── databases/
│   │   ├── properties.db            # SQLite database (primary storage)
│   │   └── analytics.duckdb         # DuckDB database (optional, for analytics)
│   │
│   ├── exports/
│   │   ├── haifa-properties.json    # JSON export for Next.js app
│   │   └── properties.parquet       # Parquet export (optional)
│   │
│   ├── images/
│   │   └── {propertyId}/            # Property images organized by ID
│   │       ├── 0.jpg                # First image
│   │       ├── 1.jpg                # Second image
│   │       └── 2.webp               # Third image
│   │
│   └── cache/
│       └── .crawlee/                # Crawlee state & queue (auto-generated)
│           ├── request_queues/
│           └── key_value_stores/
│
├── logs/
│   ├── crawler.log                  # Application logs (info, debug)
│   ├── errors.log                   # Error logs only
│   └── crawl-2025-10-08.log        # Daily log files
│
├── tests/
│   ├── unit/
│   │   ├── extractors/
│   │   │   ├── propertyExtractor.test.ts
│   │   │   ├── imageExtractor.test.ts
│   │   │   └── paginationExtractor.test.ts
│   │   ├── database/
│   │   │   ├── PropertyRepository.test.ts
│   │   │   └── sqlite.test.ts
│   │   ├── validators.test.ts
│   │   └── imageDownloader.test.ts
│   │
│   ├── integration/
│   │   ├── searchCrawler.test.ts    # Test search results crawler
│   │   ├── propertyCrawler.test.ts  # Test property page crawler
│   │   ├── fullCrawl.test.ts        # End-to-end crawl test
│   │   ├── database.test.ts         # Database integration tests
│   │   └── export.test.ts           # JSON export tests
│   │
│   ├── fixtures/
│   │   ├── sample-search-page.html  # Mock HTML for testing
│   │   ├── sample-property-page.html
│   │   └── sample-data.json         # Test data
│   │
│   └── helpers/
│       ├── mockCrawler.ts           # Mock Crawlee for unit tests
│       └── testDatabase.ts          # In-memory SQLite for tests
│
└── scripts/
    ├── init-db.ts                   # Initialize database schema
    ├── backup-db.sh                 # Backup database script
    ├── export-json.ts               # Export data to JSON
    ├── analyze-data.ts              # Run DuckDB analytics queries
    └── reset-crawler.ts             # Reset crawler state
```

## Success Metrics

### Data Quality
1. Successfully extract 100+ Haifa property listings
2. Data completeness: 95%+ of required fields populated
3. All property images downloaded successfully (>90% success rate)
4. Image organization: Proper directory structure maintained
5. Data validation: All properties pass schema validation

### Reliability
1. Error rate: <5% failed requests
2. No IP blocking or CAPTCHA challenges during crawl
3. Successful crash recovery and resume capability
4. Queue persistence: Can resume from interruption

### Performance
1. Crawl completion time: <2 hours for full Haifa dataset
2. Concurrency: Process 5-10 properties in parallel
3. Memory usage: Stable (no memory leaks)
4. Image download rate: >10 images per minute

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IP blocking | High | Implement delays, use residential proxies if needed |
| CAPTCHA challenges | High | Use real browser, mimic human behavior |
| Website structure changes | Medium | Regular monitoring, flexible selectors |
| Legal concerns | High | Review ToS, use ethically, respect robots.txt |
| Data quality issues | Medium | Validation logic, manual spot-checks |

## Technology Summary & Recommendation

### 🎯 Two-Phase Architecture (Recommended)

**Phase 1 - Research (Chrome DevTools MCP):**
- Use AI-assisted browser automation for understanding site structure
- Already installed, no setup needed
- Perfect for interactive exploration and documentation

**Phase 2 - Production (Crawlee):**
- Build autonomous, stable, long-running crawler
- Production-grade features out of the box
- Built on Playwright with anti-detection and queue management

### Why This is the Best Approach

✅ **Honest Answer**: Use **Crawlee** for the production crawler, NOT MCP tools.

**Reasoning:**
1. **MCP is for development, not production**: MCP tools require Claude Code connection and aren't designed for autonomous long-running operations
2. **Crawlee is purpose-built for this**: It wraps Playwright and adds all the production features you'd otherwise have to build manually
3. **Stability**: Crawlee has been battle-tested by thousands of production scrapers (15k+ GitHub stars)
4. **Anti-detection**: Built-in browser fingerprinting and user agent rotation
5. **Developer experience**: Saves weeks of infrastructure work

**Direct Playwright would require building:**
- Request queue system
- Retry logic with exponential backoff
- Proxy rotation
- State persistence
- Memory management
- Anti-detection measures
- Progress tracking

**Crawlee provides all of this out of the box.**

## Next Steps

### Immediate (Get Approval)
1. ✅ Review this PRD
2. ⏳ Approve technology choice (Crawlee recommended)
3. ⏳ Confirm ethical/legal acceptability of scraping Madlan.co.il

### Phase 1 - Start Research (Days 1-2)
1. Use Chrome DevTools MCP to explore Madlan.co.il
2. Document CSS selectors and page structure
3. Create `RESEARCH.md` with findings
4. Test anti-scraping behavior

### Phase 2 - Build Crawler (Days 3-19)
1. Initialize Crawlee project
2. Implement search + property crawlers
3. Add image downloading
4. Testing and optimization
5. Documentation

### Optional Future Enhancements
- Support other cities (Tel Aviv, Jerusalem, etc.)
- Real-time monitoring dashboard
- Scheduled daily/weekly crawls
- Data deduplication and change tracking
- Integration with main Madlan demo app

## Ethical & Legal Considerations
- ⚠️ Review Madlan.co.il Terms of Service
- ⚠️ Check robots.txt file
- ⚠️ Implement respectful crawling (delays, rate limits)
- ⚠️ Data usage: Educational/research purposes only
- ⚠️ Do not overload their servers
- ⚠️ Consider contacting Madlan for API access

---

## Document Information

**Version**: 2.0 (Updated with Crawlee recommendation)
**Created**: 2025-10-08
**Last Updated**: 2025-10-08
**Author**: Claude Code AI Assistant
**Status**: Ready for Review

## Changelog

### Version 2.0 (2025-10-08)
- ✅ Added image downloading requirements with detailed specifications
- ✅ Clarified MCP usage (research only, not production)
- ✅ Changed recommendation from Playwright MCP to Crawlee for production
- ✅ Added comprehensive technology comparison (Crawlee vs Playwright vs alternatives)
- ✅ Updated implementation plan with 8 phases (was 6)
- ✅ Enhanced project structure with image storage and Crawlee integration
- ✅ Expanded success metrics (data quality, reliability, performance)
- ✅ Added technology summary with honest recommendation
- ✅ Created comprehensive anti-blocking strategy document (`ANTI-BLOCKING.md`)
- ✅ Added anti-blocking summary section to PRD with configuration examples
- ✅ Documented Crawlee's default vs custom anti-detection features
- ✅ **Added SQLite and DuckDB database storage architecture**
- ✅ **Created comprehensive database schema** (properties, images, crawl history, errors)
- ✅ **Integrated testing throughout all development phases** (not just at the end)
- ✅ **Added Test-Driven Development (TDD) approach** with continuous testing
- ✅ **Updated project structure** with database/, export/, tests/ directories
- ✅ **Added Phase 7: Full Integration Testing** (2 days dedicated to testing)
- ✅ **Enhanced implementation plan** with testing tasks at each phase

### Version 1.0 (2025-10-08)
- Initial PRD with basic requirements
- Technology research (MCP tools)
- Basic implementation plan

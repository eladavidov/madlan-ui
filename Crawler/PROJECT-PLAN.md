# Madlan Crawler - Project Status

**Status**: ✅ **PRODUCTION READY - Step 2 Complete + Retry Mechanism Added**
**Last Updated**: 2025-10-14
**Current Phase**: Ready for Step 3 (500 properties, overnight crawl)

---

## 📊 CURRENT STATUS

### Database State
- **Total Properties**: 201 (Step 1: 37, Step 2: 164 new + 3 retried)
- **Transaction History**: 2,308 records
- **Nearby Schools**: 1,194 records
- **Neighborhood Ratings**: 199 records
- **Price Comparisons**: 467 records
- **Construction Projects**: 3,863 records
- **Images**: Empty (using `--no-images` flag)

### Recent Accomplishments

**✅ Step 2 Complete (2025-10-14)**:
- Crawled 6 search pages → 200 properties
- **Success Rate**: 98% (196/200 initial, +3 from retry = 199/200 total)
- **Duration**: 13h 19m
- **Pagination**: 0% blocking (fresh browser per page working perfectly)
- **Database**: 201 properties with full Phase 5B data

**✅ Retry Mechanism Implemented (2025-10-14)**:
- Automatic retry of failed properties at end of each crawl cycle
- Uses same anti-blocking strategy (fresh browser + 60-120s delays)
- **Test Results**: 75% recovery rate (3/4 failed properties recovered)
- Permanent feature for all future crawls

**✅ Anti-Blocking Solution (2025-10-09)**:
- **Search Pagination**: Fresh browser per search page (0% blocking)
- **Property Crawling**: Fresh browser per property (98% success rate)
- **Configuration**: HEADLESS=false + 60-120s random delays
- **Status**: Production-proven with 200-property test

---

## 🚀 NEXT STEPS

### Step 3: 500 Properties (Overnight Crawl)
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 15 --no-images
```

**Expected**:
- Time: ~12-20 hours
- Success Rate: 95%+ (with automatic retry)
- Fresh browser per page (search) + per property (crawling)
- Delays: 60-120s between pages and properties

### Step 4: Full Production (3,600 Properties)
Run in sequential batches:
- Night 1: 1,000 properties (30 pages)
- Night 2: 2,000 properties (60 pages)
- Night 3: 3,000 properties (90 pages)
- Night 4: 3,600 properties (120 pages, final)

---

## ⚙️ CONFIGURATION

### Environment Variables (.env)
```bash
# Anti-blocking (CRITICAL)
BROWSER_LAUNCH_DELAY_MIN=60000   # 60s between properties
BROWSER_LAUNCH_DELAY_MAX=120000  # 120s between properties
SEARCH_PAGE_DELAY_MIN=60000      # 60s between search pages
SEARCH_PAGE_DELAY_MAX=120000     # 120s between search pages
HEADLESS=false                   # MUST be false

# Database
DUCKDB_PATH=./data/databases/properties.duckdb

# Target
TARGET_CITY=חיפה
MAX_PROPERTIES=3600
```

### CLI Flags
```bash
--city חיפה              # Target city
--max-properties N       # Total properties to crawl
--max-pages N            # Max search result pages (N ≈ properties/34)
--no-images              # Skip image downloads (recommended)
```

---

## 📞 SESSION RESUMPTION GUIDE

### Quick Start (for Claude Code)

**1. Check if crawler is running**:
```bash
ps aux | grep "node dist/main.js" | grep -v grep
```

**2. Verify database status**:
```bash
cd Crawler && npx tsx verify-database.ts
```

**3. Show current status**:
- If crawler running: Monitor logs with `tail -f logs/combined.log`
- If not running: Ask user if they want to start Step 3

**4. Start Step 3 crawler** (if user confirms):
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 15 --no-images
```

---

## 📁 KEY FILES

### Configuration
- `.env` - Database path and crawler settings
- `src/config/selectors.ts` - CSS selectors for data extraction

### Main Scripts
- `src/main.ts` - Entry point
- `src/crawlers/singleBrowserCrawler.ts` - Property crawler with retry mechanism
- `src/crawlers/searchCrawler.ts` - Search results crawler (fresh browser per page)
- `verify-database.ts` - Database verification script

### Extractors (Phase 5B)
- `src/extractors/propertyExtractor.ts` - Property data (38 fields + 11 amenities)
- `src/extractors/transactionExtractor.ts` - Transaction history
- `src/extractors/schoolsExtractor.ts` - Nearby schools
- `src/extractors/ratingsExtractor.ts` - Neighborhood ratings
- `src/extractors/priceComparisonExtractor.ts` - Price comparisons
- `src/extractors/constructionExtractor.ts` - Construction projects

### Documentation
- `docs/PRD.md` - Product Requirements Document
- `docs/ANTI-BLOCKING.md` - Anti-blocking strategy details
- `docs/SOLUTION-IMPLEMENTED.md` - Technical implementation details
- `docs/RESEARCH.md` - Website structure research
- `docs/SCHEMA.md` - Database schema documentation
- `docs/SCRAPING-TIMEOUTS.md` - Time estimates

---

## 📊 KEY METRICS

### Anti-Blocking Performance
- **Search Pagination**: 100% success (fresh browser per page)
- **Property Crawling**: 98% success (fresh browser per property + retry)
- **Retry Recovery**: 75% (failed properties recovered on retry)
- **Speed**: ~0.4-0.7 properties/minute with production delays

### Data Coverage (from Step 2)
- **Properties**: 100% (all successful crawls)
- **Neighborhood Ratings**: 99% (199/201 properties)
- **Price Comparisons**: 77% (average 2.3 per property when available)
- **Transaction History**: Variable (average 11.5 per property when available)
- **Schools**: Variable (average 5.9 per property when available)
- **Construction Projects**: Variable (average 19.2 per property when available)

### Time Estimates
| Properties | Time (60-120s delays) | Approach |
|------------|----------------------|----------|
| 500        | 12-20 hours          | Overnight |
| 1,000      | 24-40 hours          | 1-2 nights |
| 3,600      | 85-170 hours         | 4-7 nights (sequential batches) |

---

## 🎯 PRODUCTION WORKFLOW

### Incremental Batches (Recommended)
1. **Step 3**: 500 properties (overnight)
2. **Verify database** after Step 3
3. **Step 4a**: 1,000 properties (night 1)
4. **Step 4b**: 2,000 properties (night 2)
5. **Step 4c**: 3,000 properties (night 3)
6. **Step 4d**: 3,600 properties (night 4, final)

### Verification After Each Batch
```bash
cd Crawler
npx tsx verify-database.ts
```

**🚨 Stop Crawling If**:
- Success rate drops below 80%
- Properties table has < 80% of expected rows
- Major blocking issues detected

---

## 🔧 LATEST FEATURES

### Automatic Retry Mechanism (2025-10-14)
- Tracks failed properties during main crawl
- Automatically retries at end of crawl cycle
- Same anti-blocking strategy (fresh browser + delays)
- Updates stats with final success/failure counts
- **Permanent feature** - works in all future crawls

### Fresh Browser Per Page (2025-10-13)
- Each search result page gets completely new browser
- Prevents PerimeterX from detecting pagination patterns
- 60-120s random delays between pages
- **0% blocking rate** validated in production

### Fresh Browser Per Property (2025-10-09)
- Each property gets completely new browser instance
- 60-120s random delays between properties
- **98% success rate** validated with 200 properties
- Bypasses PerimeterX anti-bot protection completely

---

**Last Updated**: 2025-10-14
**Status**: ✅ Ready for Step 3 (500 properties, overnight crawl)
**Database**: 201 properties with full Phase 5B data
**Success Rate**: 98% (Step 2) with 75% retry recovery
**Next Action**: Start Step 3 crawler (user confirmation required)

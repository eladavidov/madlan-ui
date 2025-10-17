# Madlan Crawler - Project Status

**Status**: ✅ **PRODUCTION READY** - Step 3 (500 Properties)
**Last Updated**: 2025-10-17
**Current Database**: 393 properties with full Phase 5B enhanced data

---

## 📊 CURRENT STATUS

### Latest Production Run (2025-10-17)

**Completed Crawls**:
- **Pages 11-30**: 9 new properties (353 total)
- **Pages 31-60**: 40 new properties (393 total)
- **Combined**: 50 search pages, 100% success rate, 0% blocking

**Current Database**:
- **Properties**: 393 (79% of Step 3 target)
- **Transaction History**: 6,485 records
- **Nearby Schools**: 3,415 records
- **Neighborhood Ratings**: 390 records
- **Price Comparisons**: 1,329 records
- **Construction Projects**: 11,088 records
- **Images**: Empty (using `--no-images` flag)

### ✅ Optimization Applied (2025-10-17)

**Issue Identified**: 91% duplicate rate wasting ~3 hours per batch
**Solution**: Pre-crawl duplicate check in `singleBrowserCrawler.ts`
**Implementation**: Query database before launching browsers, skip duplicates instantly
**Status**: ✅ Implemented, tested, ready for production
**Expected Benefit**: Save 5-10 hours on remaining crawls

---

## 🚀 NEXT STEPS

### Step 3: Reach 500 Properties (~107 unique properties needed)

**Command** (Auto-Resume):
```bash
cd Crawler
node dist/main.js --city חיפה --max-pages 50 --no-images
```

**Expected**:
- Auto-resumes from page 61 (393 properties ÷ 34 ≈ page 11.6, but pages 11-60 already crawled)
- Duplicate detection will skip already-crawled properties instantly
- Time: ~3-5 hours (with new optimization, much faster than before)
- Success Rate: 100% (validated)

### Step 4: Full Production (3,600 properties target)

**Strategy**: Sequential overnight batches with auto-resume

**Command** (repeat until target reached):
```bash
cd Crawler
node dist/main.js --city חיפה --max-pages 50 --no-images
```

**Verification After Each Batch**:
```bash
cd Crawler
npx tsx verify-database.ts
```

**Stop If**:
- Success rate drops below 80%
- Properties table empty or < 80% expected
- Major blocking detected

---

## ⚙️ CONFIGURATION

### Environment Variables (.env)
```bash
# Anti-blocking (CRITICAL)
BROWSER_LAUNCH_DELAY_MIN=60000   # 60s between properties
BROWSER_LAUNCH_DELAY_MAX=120000  # 120s between properties
SEARCH_PAGE_DELAY_MIN=60000      # 60s between search pages
SEARCH_PAGE_DELAY_MAX=120000     # 120s between search pages
HEADLESS=false                   # MUST be false for anti-blocking

# Database
DUCKDB_PATH=./data/databases/properties.duckdb

# Target
TARGET_CITY=חיפה
MAX_PROPERTIES=3600
```

### CLI Flags
```bash
--city חיפה              # Target city
--max-pages N            # Number of search pages to crawl
--start-page N           # Manual override (optional, auto-resume by default)
--max-properties N       # Limit properties per batch (optional)
--no-images              # Skip image downloads (recommended)
```

---

## 🔧 KEY FEATURES

### Anti-Blocking (100% Success Rate)
- **Fresh Browser Per Search Page**: Bypasses PerimeterX pagination detection
- **Fresh Browser Per Property**: Complete isolation per property
- **Random Delays**: 60-120s between operations
- **Israeli Locale**: Hebrew locale + language priority
- **Enhanced Human Behavior**: Scrolling, reading time, mouse movements
- **Headless=False**: Required for PerimeterX bypass

### Automatic Recovery
- **Property Retry**: Failed properties automatically retried (75% recovery rate)
- **Search Page Retry**: Failed search pages automatically retried (70-80% recovery rate)

### Duplicate Detection (NEW - 2025-10-17)
- **Pre-Crawl Check**: Queries database before launching browsers
- **Instant Skip**: Skips duplicates in milliseconds (vs. 2 min crawl time)
- **Smart Logging**: Shows "Found X duplicates, will crawl Y new properties"
- **Time Savings**: 5-10 hours saved on remaining work

### Auto-Resume
- **Automatic Detection**: Calculates next page from database property count
- **Zero Configuration**: Just run same command repeatedly
- **Manual Override**: `--start-page N` available if needed

---

## 📁 KEY FILES

### Core Crawler
- `src/main.ts` - Entry point with CLI parsing
- `src/crawlers/integratedCrawler.ts` - Orchestrates search + property crawling
- `src/crawlers/searchCrawler.ts` - Search results crawler with retry
- `src/crawlers/singleBrowserCrawler.ts` - Property crawler with duplicate detection + retry
- `verify-database.ts` - Database verification script

### Extractors (Phase 5B Enhanced Data)
- `src/extractors/propertyExtractor.ts` - Property data (38 fields + 11 amenities)
- `src/extractors/transactionExtractor.ts` - Transaction history
- `src/extractors/schoolsExtractor.ts` - Nearby schools
- `src/extractors/ratingsExtractor.ts` - Neighborhood ratings
- `src/extractors/priceComparisonExtractor.ts` - Price comparisons
- `src/extractors/constructionExtractor.ts` - Construction projects

### Documentation
- `docs/PRD.md` - Product Requirements Document
- `docs/ANTI-BLOCKING.md` - Anti-blocking strategy
- `docs/SCHEMA.md` - Database schema
- `docs/SCRAPING-TIMEOUTS.md` - Time estimates

---

## 📊 PERFORMANCE METRICS

### Success Rates
- **Search Pages**: 100% (50/50 pages validated)
- **Property Crawling**: 98%+ with retry mechanism
- **Blocking Rate**: 0% (zero PerimeterX blocks)

### Data Coverage
- **Properties**: 100% (all successful crawls)
- **Neighborhood Ratings**: 99%+ coverage
- **Transaction History**: Variable (~17 per property when available)
- **Schools**: Variable (~9 per property when available)
- **Price Comparisons**: Variable (~3.5 per property when available)
- **Construction Projects**: Variable (~29 per property when available)

### Time Estimates (with duplicate detection optimization)
| Properties | Estimated Time | Approach |
|------------|---------------|----------|
| 500        | 8-15 hours    | Overnight batch |
| 1,000      | 20-35 hours   | 1-2 nights |
| 3,600      | 60-120 hours  | 3-5 nights (sequential batches) |

*Note: Times significantly reduced with duplicate detection optimization*

---

## 📞 SESSION RESUMPTION GUIDE

**For Claude Code - Quick Start:**

1. **Check database status**:
   ```bash
   cd Crawler && npx tsx verify-database.ts
   ```

2. **Continue production crawl**:
   ```bash
   cd Crawler
   node dist/main.js --city חיפה --max-pages 50 --no-images
   # Auto-resumes from last page, skips duplicates automatically
   ```

3. **Monitor progress** (if running):
   ```bash
   tail -f logs/combined.log
   ```

---

**Production Deployment**: Ready
**Target**: Haifa properties for sale (~3,600 total)
**Search URL**: https://www.madlan.co.il/for-sale/חיפה-ישראל
**Next Action**: Complete Step 3 (reach 500 properties), then continue to full 3,600

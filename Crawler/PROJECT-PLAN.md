# Madlan Crawler - Project Status

**Status**: ✅ **IN PRODUCTION** - Crawling to 3,600 Properties
**Last Updated**: 2025-10-20
**Current Database**: 578 properties with full Phase 5B enhanced data

---

## 📊 CURRENT STATUS

### Active Production Crawl (2025-10-20)

**Running Crawler**:
- **Session ID**: `crawl-1760988620696`
- **Shell ID**: `ad61c8`
- **Pages**: 106-305 (200 search pages)
- **Max Properties**: 5,000
- **Started**: 2025-10-20 22:30:20
- **Expected Duration**: ~35-45 hours (1.5-2 days)

**Current Database** (before current crawl):
- **Properties**: 578 (16.1% of target)
- **Transaction History**: 7,915 records
- **Nearby Schools**: 4,301 records
- **Neighborhood Ratings**: 573 records
- **Price Comparisons**: 1,657 records
- **Construction Projects**: 13,666 records
- **Images**: Empty (using `--no-images` flag)

**Recent Achievements**:
- **Pages 1-55**: 530 properties (Step 3 complete)
- **Pages 56-105**: 48 new properties (Step 4 batch 1)
- **Combined**: 100% success rate, 0% blocking
- **Duplicate Detection**: Working perfectly

---

## 🚀 PRODUCTION STRATEGY

### Current Approach: Single Long-Running Crawl

**Command** (currently running):
```bash
cd Crawler
node dist/main.js --city חיפה --start-page 106 --max-pages 200 --max-properties 5000 --no-images
```

**Why This Works**:
- Resumes from page 106 (already have 1-105)
- Keeps all 578 existing properties (duplicate detection prevents overwrites)
- Will add ~3,000 more properties to reach ~3,600 total
- Runs continuously until complete

**Monitoring**:
```bash
# Check status anytime
cd Crawler && npx tsx src/scripts/check-table-counts.ts

# View live logs
tail -f logs/combined.log
```

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
--start-page N           # Resume from specific page
--max-pages N            # Number of search pages to crawl
--max-properties N       # Limit properties per crawl (use high number for full crawl)
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
- **Property Retry**: Failed properties automatically retried
- **Search Page Retry**: Failed search pages automatically retried

### Duplicate Detection
- **Pre-Crawl Check**: Queries database before launching browsers
- **Instant Skip**: Skips duplicates in milliseconds
- **Data Preservation**: Never overwrites existing properties

---

## 📁 KEY FILES

### Core Crawler
- `src/main.ts` - Entry point with CLI parsing
- `src/crawlers/integratedCrawler.ts` - Orchestrates search + property crawling
- `src/crawlers/searchCrawler.ts` - Search results crawler with retry
- `src/crawlers/singleBrowserCrawler.ts` - Property crawler with duplicate detection + retry

### Extractors (Phase 5B Enhanced Data)
- `src/extractors/propertyExtractor.ts` - Property data (38 fields + 11 amenities)
- `src/extractors/transactionExtractor.ts` - Transaction history
- `src/extractors/schoolsExtractor.ts` - Nearby schools
- `src/extractors/ratingsExtractor.ts` - Neighborhood ratings
- `src/extractors/priceComparisonExtractor.ts` - Price comparisons
- `src/extractors/constructionExtractor.ts` - Construction projects

### Verification
- `src/scripts/check-table-counts.ts` - Quick database status check

---

## 📊 PERFORMANCE METRICS

### Success Rates
- **Search Pages**: 100% (105/105 pages validated)
- **Property Crawling**: 100% with retry mechanism
- **Blocking Rate**: 0% (zero PerimeterX blocks)

### Data Coverage
- **Properties**: 100% (all successful crawls)
- **Neighborhood Ratings**: 99%+ coverage
- **Transaction History**: ~14 per property (when available)
- **Schools**: ~7.5 per property (when available)
- **Price Comparisons**: ~2.9 per property (when available)
- **Construction Projects**: ~24 per property (when available)

### Timeline
| Target | Current | Remaining | ETA |
|--------|---------|-----------|-----|
| 3,600 properties | 578 | 3,022 | ~35-45 hours |

---

## 📞 SESSION RESUMPTION GUIDE

**For Claude Code - Quick Start:**

1. **Check crawler status**:
   ```bash
   # Is crawler running? Check shell ad61c8
   # If stopped, check exit code and logs
   ```

2. **Check database**:
   ```bash
   cd Crawler && npx tsx src/scripts/check-table-counts.ts
   ```

3. **Resume if needed** (if crawler stopped):
   ```bash
   cd Crawler
   # Check current property count to determine start page
   # ~578 properties = page 106 (already running)
   # If >578, adjust start page accordingly
   node dist/main.js --city חיפה --start-page [NEXT_PAGE] --max-pages 200 --max-properties 5000 --no-images
   ```

---

**Production Target**: Haifa properties for sale (~3,600 total)
**Search URL**: https://www.madlan.co.il/for-sale/חיפה-ישראל
**Current Action**: Full production crawl in progress (pages 106-305)

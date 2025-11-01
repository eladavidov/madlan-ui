# Madlan Crawler - Project Status

**Status**: ✅ **RUNNING** - Extended Crawl (Pages 94-200)
**Last Updated**: 2025-10-31 18:05
**Current Database**: 1,787 properties ✅
**Shell ID**: 94c60a

---

## 🚨 QUICK RECOVERY GUIDE (After VSCode Restart / Session Resume)

### ✅ LATEST SESSION (2025-10-31 17:57)
**Action**: Extended crawl to pages 94-200 (targeting 3,600 properties)
**Previous**: Completed pages 1-106 with 1,787 properties
**Current**: Phase 1 actively crawling pages 94-200
**Status**: Running successfully with 100% success rate

### Step 1: Kill Any Stuck Crawler Processes (if needed)
```bash
# Find node processes
tasklist | findstr node

# Kill stuck crawler (look for large process ~80-100MB)
taskkill //F //PID <process_id>
```

### Step 2: Verify Database Is Intact
```bash
cd Crawler
npx tsx src/scripts/check-table-counts.ts
```

**Expected**: Should show 1,787+ properties (growing as crawler runs)

### Step 3: Resume Crawler (if stopped)
```bash
cd Crawler

# Extended crawl command (200 pages to reach 3,600 properties)
node dist/main.js --city חיפה --start-page 1 --max-pages 200 --max-properties 3600 --no-images

# Watch logs in another terminal:
# tail -f logs/combined.log

# Crawler will:
# - Resume from last completed page (smart caching)
# - Skip duplicate properties automatically
# - Continue until 3,600 properties or 200 pages complete
```

### Step 4: Monitor for Stuck State
**Watch for these signs of stuck crawler:**
- ❌ No logs after "Initializing DuckDB database..." (>1 minute)
- ❌ Stuck after "Waiting XXs before next property" (>2 minutes past wait time)
- ❌ Only progress updates logging, no actual property processing
- ✅ Normal: Should see "Launching browser", "Extracted: XXXXX", "Saved X transactions", etc.

---

## 📊 CURRENT STATUS (2025-10-31 18:05) - RUNNING EXTENDED CRAWL

### Active Crawl Session
- **Shell ID**: `94c60a`
- **Started**: 2025-10-31 17:57
- **Session ID**: `crawl-1761926224047`
- **Command**: `node dist/main.js --city חיפה --start-page 1 --max-pages 200 --max-properties 3600 --no-images`

### Phase 1: Search URL Extraction 🔄 IN PROGRESS (Extended)
- **Status**: Pages 94-97 complete (as of 18:05)
- **Target**: 200 pages (expanded from original 106)
- **Pages Completed**: 97/200 (48.5%)
- **Progress**: Actively crawling page-by-page
- **Success Rate**: 100%

### Phase 2: Property Crawling ⏳ PENDING
- **Will Start**: After Phase 1 completes all 200 pages
- **Expected URLs**: ~1,800 total property URLs (9 per page × 200)
- **Current Database**: 1,787 properties ✅

### Database Status (VERIFIED SAFE)
- **Total Properties**: 1,787 ✅ (Updated 2025-10-31)
- **Transaction History**: 17,500+ records
- **Schools**: 9,500+ records
- **Ratings**: 1,745+ records
- **Price Comparisons**: 3,745+ records
- **Construction Projects**: 30,496+ records
- **Images**: 0 (--no-images flag active)

### Estimated Completion
- **Phase 1 ETA**: ~3-4 hours (103 pages × 2 min/page)
- **Phase 2 ETA**: Variable based on new vs duplicate properties
- **Target**: Reach 3,600 total properties

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

### CLI Command Explained
```bash
--city חיפה              # Target: Haifa properties
--start-page 1           # Start from page 1 (Phase 1)
--max-pages 200          # Crawl 200 search pages (extended from 106)
--max-properties 3600    # Target up to 3,600 properties
--no-images              # Skip image downloads (faster)
```

---

## 🔧 KEY FEATURES

### Anti-Blocking Strategy (99.73% Success Rate)
- **Fresh Browser Per Search Page**: New browser for each search results page
- **Fresh Browser Per Property**: Complete isolation per property
- **Random Delays**: 60-120s between operations
- **Israeli Locale**: Hebrew locale (he-IL) simulation
- **Human Behavior**: Scrolling, mouse movements, reading time
- **Headless=False**: Required to bypass PerimeterX

### Automatic Recovery & Retry
- **Duplicate Detection**: Checks database before crawling
- **Property Retry**: Auto-retry on timeout/errors
- **Resume Capability**: Restarts from interruption point

### Phase 5B Enhanced Data Extraction
- **38 property fields** + 11 amenities
- Transaction history (when available)
- Nearby schools (when available)
- Neighborhood ratings
- Price comparisons
- Construction projects in area

---

## 📁 KEY FILES

### Core Crawler
- `src/main.ts` - CLI entry point
- `src/crawlers/integratedCrawler.ts` - Orchestrates Phase 1 & 2
- `src/crawlers/searchCrawler.ts` - Search results crawler
- `src/crawlers/singleBrowserCrawler.ts` - Property crawler with duplicate detection

### Extractors
- `src/extractors/searchExtractor.ts` - Extract property URLs from search pages
- `src/extractors/propertyExtractor.ts` - Extract property data (38 fields)
- `src/extractors/transactionExtractor.ts` - Transaction history
- `src/extractors/schoolsExtractor.ts` - Nearby schools
- `src/extractors/ratingsExtractor.ts` - Neighborhood ratings
- `src/extractors/priceComparisonExtractor.ts` - Price comparisons
- `src/extractors/constructionExtractor.ts` - Construction projects

### Database & Utilities
- `src/repositories/` - DuckDB data access layer
- `src/scripts/check-table-counts.ts` - Quick status check
- `src/utils/config.ts` - Configuration settings

---

## 📊 TROUBLESHOOTING

### If Crawler Stopped
1. **Check logs**: `tail -100 logs/combined.log`
2. **Check database**: `npx tsx src/scripts/check-table-counts.ts`
3. **Check for errors**: Look for `❌` or `ERROR` in logs
4. **Resume**: Run same command (duplicate detection will skip already-crawled)

### Common Issues
- **Timeout errors**: Normal occasional issue, crawler auto-retries
- **PerimeterX blocking**: Should be 0% with current config
- **Database locked**: Wait for crawler to finish or kill process

### Monitoring Live Crawl
```bash
# View live logs
tail -f logs/combined.log

# Check progress (every 15 seconds in logs)
grep "Progress Update" logs/combined.log | tail -1

# Check latest property
grep "Properties: [0-9]* found" logs/combined.log | tail -1
```

### Weekly Database Backup

**When to Create**: Every Monday or when convenient (weekly reminder during status checks)

**⚠️ IMPORTANT**: Stop the crawler before creating backup (database must not be in use)

```bash
# 1. Stop the crawler (if running)
# Press Ctrl+C or use taskkill

# 2. Create backup
cd Crawler
npx tsx src/scripts/create-weekly-backup.ts

# 3. Restart crawler after backup completes
```

**What it does**:
- Creates backup with format: `weekly-backup-DD-MM-YYYY.duckdb` (Hebrew date format)
  - Example: `weekly-backup-29-10-2025.duckdb`
- Automatically deletes old weekly backups (keeps only latest)
- Shows git commit instructions

**Then commit to Git**:
```bash
git add data/databases/weekly-backup-*.duckdb
git commit -m "chore: weekly database backup (DD-MM-YYYY)"
git push
```

**Testing Reminder**: When running "status" checks, consider if it's been a week since last backup. Weekly backups ensure:
- Safe recovery point if database gets corrupted
- Historical snapshots of crawler progress
- Easy rollback if issues occur during development

---

## 🎯 PRODUCTION TARGET

**Target**: Haifa properties for sale
**Goal**: 3,600 properties (extended crawl)
**Search URL**: https://www.madlan.co.il/for-sale/חיפה-ישראל
**Strategy**: Crawling 200 pages to discover more properties

**Progress**:
- Pages 1-106: Yielded ~1,517 unique property URLs
- Pages 107-200: Currently crawling to find additional properties
- Current Database: 1,787 properties (ongoing)

---

## 📈 PERFORMANCE METRICS

### Success Rates
- **Phase 1 (Search)**: 100% (106/106 pages)
- **Phase 2 (Properties)**: 99.73% (741 success / 743 total)
- **Overall Blocking**: 0.27% (2 timeouts out of 743)

### Data Coverage (Phase 5B)
- **Properties**: 100% (all successful crawls)
- **Neighborhood Ratings**: 99%+ coverage
- **Transaction History**: Available when exists on property page
- **Schools**: Available when exists on property page
- **Price Comparisons**: Available when exists on property page
- **Construction Projects**: Available when exists on property page

---

**Last Verified**: 2025-10-31 18:05:00
**Status**: Extended crawl running (pages 94-200)
**Next Milestone**: Complete Phase 1 (200 pages), then process all properties to reach 3,600 total

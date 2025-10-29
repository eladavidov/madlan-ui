# Madlan Crawler - Project Status

**Status**: ✅ **RUNNING** - Production Crawl Resumed
**Last Updated**: 2025-10-28 20:49
**Current Database**: 1,419 properties ✅
**Shell ID**: b13ad7

---

## 🚨 QUICK RECOVERY GUIDE (After VSCode Restart / Session Resume)

### ✅ ISSUE RESOLVED (2025-10-28 20:49)
**Problem**: Crawler was stuck at "Initializing DuckDB database..."
**Root Cause**: Stale process + corrupted log file
**Solution**: Kill stuck process + delete logs/combined.log
**Status**: Crawler now running successfully

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
node -e "const duckdb = require('duckdb'); const db = new duckdb.Database('./data/databases/properties.duckdb'); db.all('SELECT COUNT(*) as total FROM properties', (err, res) => { if(err) console.error(err); else console.log('✅ Database:', res[0].total, 'properties'); process.exit(0); });"
```

**Expected**: Should show 1,419 properties

### Step 3: Resume Crawler Carefully
```bash
cd Crawler

# RECOMMENDED: Start in foreground first to monitor for issues
node dist/main.js --city חיפה --start-page 1 --max-pages 106 --max-properties 3600 --no-images

# Watch logs in another terminal:
# tail -f logs/combined.log

# If crawler gets stuck at "Initializing DuckDB database..." or during wait period:
# 1. Kill the process (Ctrl+C or taskkill)
# 2. Check if database file is locked
# 3. Try deleting logs/combined.log before restart
# 4. May need to investigate wait loop bug in code
```

### Step 4: Monitor for Stuck State
**Watch for these signs of stuck crawler:**
- ❌ No logs after "Initializing DuckDB database..." (>1 minute)
- ❌ Stuck after "Waiting XXs before next property" (>2 minutes past wait time)
- ❌ Only progress updates logging, no actual property processing
- ✅ Normal: Should see "Launching browser", "Extracted: XXXXX", "Saved X transactions", etc.

---

## 📊 CURRENT STATUS (2025-10-24 18:34) - SAFELY STOPPED

### Last Crawl Session (Stopped Cleanly)
- **Shell ID**: `9cad8a` (killed safely during wait period)
- **Started**: 2025-10-22 23:05
- **Stopped**: 2025-10-24 18:34
- **Total Runtime**: ~43.5 hours (1.8 days)
- **Command**: `node dist/main.js --city חיפה --start-page 1 --max-pages 106 --max-properties 3600 --no-images`

### Phase 1: Search URL Extraction ✅ COMPLETE
- **Status**: 100% Complete (10:04 AM, Oct 23)
- **Pages Crawled**: 106/106
- **URLs Extracted**: 1,517 property URLs
- **Duration**: ~11 hours
- **Success Rate**: 100%

### Phase 2: Property Crawling ⏸️ PAUSED (SAFE TO RESUME)
- **Progress**: 835/1,517 properties (55%)
- **Success**: 373 new properties crawled
- **Duplicates**: 455 skipped (already in DB)
- **Failures**: 7 (0.84% - excellent!)
- **Duration**: ~32.5 hours before stop
- **Rate**: ~0.3 properties/min (variable)

### Database Status (VERIFIED SAFE)
- **Total Properties**: 998 ✅ ALL SAVED
  - 625 from previous crawls
  - 373 new from last session
- **Transaction History**: 11,307 records
- **Schools**: 6,028 records
- **Ratings**: 985 records
- **Price Comparisons**: 2,382 records
- **Construction Projects**: 19,488 records
- **Images**: 0 (--no-images flag active)

### Remaining Work
- **Properties Left**: 682 (1,517 - 835)
- **Estimated Time**: ~38 hours at 0.3 props/min
- **Expected Finish**: ~1.6 days after resume

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
--max-pages 106          # Crawl 106 search pages
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
**Total Available**: ~1,517 properties (discovered in Phase 1)
**Search URL**: https://www.madlan.co.il/for-sale/חיפה-ישראל

**Note**: Original estimate was 3,600 but actual available properties is ~1,517 based on Phase 1 extraction.

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

**Last Verified**: 2025-10-23 22:30:38
**Status**: Running smoothly, 99.73% success rate
**Next Milestone**: Complete remaining 774 properties (~31 hours)

# URL Cache System

## Overview

The URL Cache System solves the critical problem of losing Phase 1 progress during computer restarts or crashes. Before this feature, every restart required re-crawling all 106 search pages (~11 hours). Now, Phase 1 URLs are cached in the database and persist across restarts.

## The Problem

**Before URL Cache:**
- Phase 1 URLs stored in memory only
- Computer restart = lose ALL Phase 1 progress
- Must re-crawl 106 pages every time (~11 hours wasted)
- User reported multiple restarts, losing progress each time

**After URL Cache:**
- Phase 1 URLs saved to database in real-time
- Computer restart = resume exactly where you left off
- Cache complete? Skip Phase 1 entirely (0 seconds)
- Cache partial? Resume from last page

## Time Savings

| Scenario | Before | After | Time Saved |
|----------|--------|-------|------------|
| First run | ~11 hours Phase 1 | ~11 hours Phase 1 | 0 (same) |
| Restart after 50% | ~11 hours restart | ~5.5 hours resume | **5.5 hours** |
| Restart after 100% | ~11 hours restart | 0 seconds (instant) | **11 hours** |

## Architecture

### Database Table

```sql
CREATE TABLE property_urls_cache (
  id INTEGER PRIMARY KEY,
  url VARCHAR UNIQUE NOT NULL,
  search_page INTEGER NOT NULL,
  city VARCHAR NOT NULL,
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  crawl_successful BOOLEAN,
  error_message TEXT
);
```

**Key Features:**
- `url`: Property URL discovered from search results
- `search_page`: Which page (1-106) this URL came from
- `city`: City filter (e.g., "חיפה")
- `processed`: Has Phase 2 crawled this property yet?
- `crawl_successful`: Did Phase 2 succeed or fail?

### Components

1. **PropertyUrlCacheRepository** (`src/database/repositories/PropertyUrlCacheRepository.ts`)
   - `saveBatch(urls, pageNumber, city)` - Save URLs from a search page
   - `getAllUrls(city)` - Get all cached URLs
   - `getUnprocessedUrls(city)` - Get URLs not yet processed by Phase 2
   - `getStats(city)` - Get cache statistics
   - `isPhase1Complete(city, expectedPages)` - Check if Phase 1 is done
   - `clearCache(city)` - Clear cache for fresh start

2. **Updated Crawlers:**
   - `searchCrawler.ts` - Saves URLs to cache as they're discovered
   - `integratedCrawler.ts` - Checks cache on startup, resumes intelligently

## How It Works

### Phase 1 Startup Logic

```typescript
// Check cache status
const cacheStats = await urlCacheRepo.getStats("חיפה");
const cacheComplete = await urlCacheRepo.isPhase1Complete("חיפה", 106);

if (cacheComplete && cacheStats.total > 0) {
  // ✅ Cache complete - skip Phase 1 entirely
  logger.info("💾 Using cached URLs (saving ~11 hours)");
  propertyUrls = await urlCacheRepo.getAllUrls("חיפה");

} else {
  // 🔄 Cache partial or empty - resume from last page
  const lastPage = cacheStats.lastPage; // e.g., 53
  const resumeFromPage = lastPage + 1;   // e.g., 54

  logger.info(`🔄 Resuming from page ${resumeFromPage}/106`);
  // Crawl only remaining pages (54-106)
  // Saves already crawled URLs (1-53)
}
```

### Real-Time Caching

```typescript
// In searchCrawler.ts - after extracting URLs from page
if (urlCacheRepo && city && pageUrls.length > 0) {
  const saved = await urlCacheRepo.saveBatch(pageUrls, pageNumber, city);
  logger.info(`💾 Saved ${saved} URLs to cache for page ${pageNumber}`);
}
```

## Usage

### Automatic (Default Behavior)

The cache system works automatically with zero configuration:

```bash
cd Crawler
node dist/main.js --city חיפה --start-page 1 --max-pages 106 --max-properties 3600 --no-images
```

**First run:**
- Crawls pages 1-106
- Saves URLs to cache in real-time
- Takes ~11 hours

**After computer restart (Phase 1 at 50%):**
- Detects cache has pages 1-53
- Resumes from page 54
- Only crawls pages 54-106
- Takes ~5.5 hours (50% time saved)

**After computer restart (Phase 1 complete):**
- Detects cache has all 106 pages
- Loads 1,517 URLs instantly from cache
- Skips Phase 1 entirely
- Takes 0 seconds (11 hours saved!)

### Cache Management

Check cache status:
```bash
cd Crawler
npx tsx src/scripts/manage-url-cache.ts status
```

Output:
```
📊 URL Cache Status
============================================================
City: חיפה
Total URLs: 1517
Last Page: 106
Processed: 998 (66%)
Unprocessed: 519
Successful: 974
Failed: 24
============================================================
```

Clear cache (force fresh Phase 1):
```bash
npx tsx src/scripts/manage-url-cache.ts clear חיפה
```

List URLs from specific page:
```bash
npx tsx src/scripts/manage-url-cache.ts list חיפה 5
```

View all commands:
```bash
npx tsx src/scripts/manage-url-cache.ts help
```

## Migration from Old Code

If you have an existing database from before URL cache:

1. **Automatic Migration:** The cache table is created automatically on next run
2. **First Run:** Will crawl all pages and populate cache
3. **Future Runs:** Will benefit from cache immediately

No manual intervention required!

## Testing the Feature

### Test 1: Fresh Start
```bash
# Clear cache
npx tsx src/scripts/manage-url-cache.ts clear חיפה

# Start crawler (will crawl pages 1-106)
node dist/main.js --city חיפה --max-pages 5 --no-images

# Check cache
npx tsx src/scripts/manage-url-cache.ts status
# Should show 5 pages cached
```

### Test 2: Resume from Interruption
```bash
# Start crawler
node dist/main.js --city חיפה --max-pages 10 --no-images

# Kill after page 5 (Ctrl+C)
# Restart - should resume from page 6
node dist/main.js --city חיפה --max-pages 10 --no-images
```

### Test 3: Skip Phase 1 Entirely
```bash
# Complete Phase 1 (all 106 pages)
node dist/main.js --city חיפה --max-pages 106 --no-images

# Restart - should load from cache instantly
node dist/main.js --city חיפה --max-pages 106 --no-images
# Look for: "💾 Using cached URLs (saving ~212+ minutes)"
```

## Benefits

### Performance
- **11 hours saved** on every restart after Phase 1 complete
- **~50% time saved** on restarts during Phase 1
- **Instant startup** when cache is complete

### Reliability
- No lost progress from computer restarts
- No lost progress from crashes
- Safe to stop crawler anytime

### User Experience
- Resume exactly where you left off
- Clear visibility into cache status
- Easy cache management with utilities

## Future Enhancements

Potential future improvements:

1. **Smart Invalidation:** Clear cache if URLs are too old (30+ days)
2. **Multi-City Support:** Cache URLs for multiple cities simultaneously
3. **Incremental Updates:** Re-crawl only pages with new properties
4. **Cache Statistics Dashboard:** Web UI to view cache status

## Technical Details

### Indexes
```sql
CREATE INDEX idx_url_cache_city ON property_urls_cache(city);
CREATE INDEX idx_url_cache_processed ON property_urls_cache(processed);
CREATE INDEX idx_url_cache_search_page ON property_urls_cache(search_page);
CREATE INDEX idx_url_cache_discovered ON property_urls_cache(discovered_at);
```

### Database Size Impact
- ~1,517 URLs per city
- ~200 bytes per URL entry
- Total: ~0.3 MB per city (negligible)

### Concurrency
- Thread-safe with DuckDB ACID transactions
- Duplicate URLs handled gracefully (UNIQUE constraint)
- Safe for multiple crawler instances (future)

## Troubleshooting

**Cache not working after restart:**
```bash
# Check if cache has data
npx tsx src/scripts/manage-url-cache.ts status

# If empty, check database file exists
ls -lh data/databases/properties.duckdb
```

**Want to force fresh Phase 1:**
```bash
# Clear cache and restart
npx tsx src/scripts/manage-url-cache.ts clear חיפה
node dist/main.js --city חיפה --max-pages 106 --no-images
```

**Cache shows wrong page count:**
```bash
# Clear and rebuild cache
npx tsx src/scripts/manage-url-cache.ts clear חיפה
# Run crawler to repopulate
```

## Conclusion

The URL Cache System is a critical improvement that saves hours of time and makes the crawler resilient to interruptions. It works automatically with zero configuration and provides clear visibility into cache status.

**Key Takeaway:** After Phase 1 completes once, you'll never have to wait 11 hours for search URL extraction again!

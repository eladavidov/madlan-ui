# Production Crawl Guide - 2000 Properties

**Target**: 2000+ properties from Madlan.co.il
**Strategy**: Sequential overnight batches (500 properties/night)
**Duration**: 3-4 nights
**Status**: Ready to execute after 100-property validation

---

## 🎯 Production Configuration

### Recommended Settings (.env)

```env
# Anti-Blocking (CRITICAL)
FRESH_BROWSER_PER_PROPERTY=true

# Production Delays (60-120 seconds)
BROWSER_LAUNCH_DELAY_MIN=60000
BROWSER_LAUNCH_DELAY_MAX=120000

# Headless Mode (run in background)
HEADLESS=true

# Target
TARGET_CITY=חיפה
MAX_PROPERTIES=2000

# Logging
LOG_LEVEL=info  # Reduce verbosity
LOG_TO_FILE=true
LOG_TO_CONSOLE=true

# Retries
MAX_REQUEST_RETRIES=3
```

---

## 📅 Execution Plan - 4-Night Strategy

### Night 1: Properties 1-500
**Duration**: ~10-15 hours
**Command**:
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-night-1.log 2>&1 &
```

**Monitoring**:
```bash
# Watch progress
tail -f logs/production-night-1.log | grep "Properties:"

# Check success rate
grep "✅ Successful" logs/production-night-1.log
```

---

### Night 2: Properties 501-1000
**Duration**: ~10-15 hours
**Command**:
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-night-2.log 2>&1 &
```

**Note**: Crawler automatically skips already-crawled properties (resume capability).

---

### Night 3: Properties 1001-1500
**Duration**: ~10-15 hours
**Command**:
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-night-3.log 2>&1 &
```

---

### Night 4: Properties 1501-2000
**Duration**: ~10-15 hours
**Command**:
```bash
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-night-4.log 2>&1 &
```

---

## 🔍 Monitoring During Production

### Real-Time Progress
```bash
# Watch crawler output (15-second updates)
tail -f logs/production-night-X.log | grep "Progress Update"

# Count properties crawled so far
tail logs/production-night-X.log | grep "Property completed"

# Check current property count in database
# (Note: sqlite3 not installed, use alternative)
```

### Success Rate Monitoring
```bash
# Count successful properties
grep "✅ Extracted" logs/production-night-X.log | wc -l

# Count failed properties
grep "❌ Failed" logs/production-night-X.log | wc -l

# Check for HTTP 520 retries
grep "🔄 Retry attempt" logs/production-night-X.log | wc -l
```

### Error Detection
```bash
# Watch for errors
tail -f logs/production-night-X.log | grep -i "error\|failed\|blocked"

# Check for CAPTCHA (should be 0)
grep "CAPTCHA detected" logs/production-night-X.log

# Check for 403 blocking (should be 0)
grep "403 Forbidden" logs/production-night-X.log
```

---

## 💾 Database Backups

### Before Each Night
```bash
# Backup database
cp data/databases/properties.db data/databases/properties-backup-night-X.db

# Verify backup
ls -lh data/databases/
```

### After Each Night
```bash
# Create timestamped backup
cp data/databases/properties.db "data/databases/properties-$(date +%Y%m%d).db"
```

---

## 📊 Performance Expectations

### Per Night (500 properties)
- **Duration**: 10-15 hours
- **Rate**: ~0.5-0.8 properties/minute
- **Success Rate**: 90-95% (with HTTP retries)
- **Failed**: ~25-50 properties (HTTP 520 errors after retries)
- **Images**: ~10,000-15,000 images downloaded

### Total (2000 properties over 4 nights)
- **Duration**: 40-60 hours total
- **Success Rate**: 90-95%
- **Total Properties**: ~1800-1900 (accounting for failures)
- **Total Images**: ~40,000-60,000 images
- **Database Size**: ~500MB-1GB
- **Image Storage**: ~20-50 GB

---

## 🚨 Troubleshooting

### If Crawler Crashes

**Resume from where it left off**:
```bash
# Just run the same command again!
cd Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-resume.log 2>&1 &
```

The crawler automatically skips already-crawled properties.

### If Success Rate Drops Below 80%

1. **Check logs for patterns**:
   ```bash
   grep "HTTP Status:" logs/production-night-X.log | sort | uniq -c
   ```

2. **Increase delays** (if seeing 403 errors):
   ```env
   BROWSER_LAUNCH_DELAY_MIN=90000   # 90s
   BROWSER_LAUNCH_DELAY_MAX=180000  # 180s
   ```

3. **Restart crawler** with new settings

### If Disk Space Running Low

**Images taking too much space**:
```bash
# Check image directory size
du -sh data/images/

# Option 1: Disable image downloading temporarily
# In .env: DOWNLOAD_IMAGES=false

# Option 2: Move images to external drive
mv data/images/ /path/to/external/drive/
ln -s /path/to/external/drive/images data/images
```

---

## ✅ Post-Crawl Validation

### After Each Night

1. **Check final stats**:
   ```bash
   tail -50 logs/production-night-X.log | grep "CRAWL SUMMARY" -A 10
   ```

2. **Validate data quality**:
   - Check for suspicious rooms values (should be 0):
     ```bash
     grep "Suspicious rooms value" logs/production-night-X.log
     ```

3. **Backup database**:
   ```bash
   cp data/databases/properties.db data/databases/backup-after-night-X.db
   ```

### After Final Night

1. **Total property count**:
   ```bash
   grep "Properties Found:" logs/production-night-*.log
   ```

2. **Success rate**:
   ```bash
   grep "Success" logs/production-night-*.log | awk '{sum+=$NF} END {print sum/NR "%"}'
   ```

3. **Image statistics**:
   ```bash
   find data/images/ -type f | wc -l  # Total images
   du -sh data/images/                 # Total size
   ```

---

## 📤 Data Export (Phase 6)

### After Production Crawl Complete

**Export to JSON** (for main Next.js app):
```bash
cd Crawler
npm run export:json
# Output: data/exports/haifa-properties.json
```

**Export to CSV** (for analysis):
```bash
cd Crawler
npm run export:csv
# Output: data/exports/haifa-properties.csv
```

**Export to Parquet** (for analytics):
```bash
cd Crawler
npm run export:parquet
# Output: data/exports/properties.parquet
```

---

## 🔄 Resume Capability

The crawler has **built-in resume capability**:

- **Database tracking**: Properties marked as crawled in database
- **Automatic skip**: Crawler checks if property already exists before crawling
- **Safe**: Can stop/restart anytime without losing progress
- **No duplicates**: Upsert logic prevents duplicate entries

**To resume**:
```bash
# Just run the exact same command!
node dist/main.js --city חיפה --max-properties 2000 --max-pages 20
```

---

## 📋 Pre-Flight Checklist

Before starting production crawl, verify:

- [ ] ✅ Rooms bug fixed (TEST-10-PROPERTIES shows 100% accuracy)
- [ ] ✅ 100-property test completed successfully (90%+ success rate)
- [ ] ✅ Production delays configured (60-120s)
- [ ] ✅ Headless mode enabled (for background running)
- [ ] ✅ Disk space available (~50GB for images)
- [ ] ✅ Database backed up
- [ ] ✅ Logs directory exists
- [ ] ✅ HTTP retry logic enabled (default: 2 retries)
- [ ] ✅ Progress updates working (verified in 100-property test)

---

## 🎯 Success Criteria

### Per Night:
- ✅ Success rate > 85%
- ✅ No CAPTCHA encounters
- ✅ No 403 blocking
- ✅ No rooms extraction bugs
- ✅ Image download > 90%

### Overall:
- ✅ Total properties: 1800+ (90%+ of 2000)
- ✅ Data completeness: > 95%
- ✅ Zero blocking incidents
- ✅ Database integrity maintained

---

## 📞 Support & Monitoring

### If Issues Arise:

1. **Stop the crawler**:
   ```bash
   pkill -f "node dist/main.js"
   ```

2. **Check logs**:
   ```bash
   tail -100 logs/production-night-X.log
   ```

3. **Review error patterns**:
   ```bash
   grep "ERROR" logs/crawler.log | tail -50
   ```

4. **Resume after fixing**:
   ```bash
   # Same command resumes from where it stopped
   node dist/main.js --city חיפה --max-properties 500 --max-pages 20
   ```

---

## 🚀 Quick Start Commands

### Start Night 1 (NOW):
```bash
cd C:\Src\Madlan\Crawler
node dist/main.js --city חיפה --max-properties 500 --max-pages 20 > logs/production-night-1.log 2>&1 &
```

### Monitor Progress:
```bash
tail -f logs/production-night-1.log | grep "Progress Update"
```

### Check After Morning:
```bash
tail -50 logs/production-night-1.log | grep "CRAWL SUMMARY" -A 10
```

---

**Last Updated**: 2025-10-09
**Ready**: After 100-property test validation
**Estimated Start**: 2025-10-10 (after 100-property test completes)

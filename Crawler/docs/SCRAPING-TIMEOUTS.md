# Scraping Timeouts & Time Estimates

**Generated**: 2025-10-10
**Crawler Version**: Phase 5B (Production Ready)
**Anti-Blocking Strategy**: Fresh Browser Per Property

---

## ⏱️ Timeout Configuration

### 1. Browser Launch Delays (Anti-Blocking)

**Purpose**: Prevent session-based blocking by spacing out requests

- **Minimum Delay**: `60,000ms` (60 seconds)
- **Maximum Delay**: `120,000ms` (120 seconds)
- **Average Delay**: `90 seconds` between properties
- **Environment Variables**:
  - `BROWSER_LAUNCH_DELAY_MIN` (default: 60000)
  - `BROWSER_LAUNCH_DELAY_MAX` (default: 120000)

**This is the PRIMARY anti-blocking mechanism** - Random delays make the crawler appear more human-like.

### 2. Page Load & Navigation Timeouts

| Operation | Timeout | Purpose |
|-----------|---------|---------|
| **Page Navigation** | 60,000ms (60s) | Wait for initial page load |
| **DOM Content Loaded** | Included in navigation | Wait for DOM to be ready |
| **Content Rendering** | 15,000ms (15s) | Wait for React/SPA content |
| **Network Idle** | 5,000ms (5s) | Wait for AJAX requests (optional) |

### 3. Human Behavior Simulation

**Total Time**: ~18 seconds per property

| Action | Duration | Purpose |
|--------|----------|---------|
| Initial Delay | 5,000ms (5s) | Pause after page load |
| First Scroll | 300px smooth | Simulate reading |
| Scroll Pause | 2,000ms (2s) | Reading time |
| Second Scroll | 500px smooth | Continue reading |
| Reading Time | 8,000ms (8s) | Extended reading pause |
| Pre-Extraction Delay | 3,000ms (3s) | Final pause before extraction |

**Total**: 5s + 2s + 8s + 3s = **18 seconds**

### 4. Image Download Timeouts

| Setting | Default Value | Environment Variable |
|---------|---------------|---------------------|
| **Download Timeout** | 30,000ms (30s) per image | `IMAGE_TIMEOUT` |
| **Max Retries** | 3 attempts | `IMAGE_RETRIES` |
| **Total Max Time** | ~90s per image (3 × 30s) | N/A |

### 5. HTTP Retry Logic

**Retryable Status Codes**: 520, 502, 503 (server errors)

| Retry Attempt | Delay Before Retry | Cumulative Delay |
|---------------|-------------------|------------------|
| **1st Retry** | 10,000ms (10s) | 10s |
| **2nd Retry** | 15,000ms (15s) | 25s |
| **3rd Retry** | 20,000ms (20s) | 45s |

**Max HTTP Retries**: 2 (configurable via `maxHttpErrorRetries`)

---

## 📊 Time Estimates Per Property

### Base Processing Time (No Delays)

| Phase | Time Range | Average |
|-------|------------|---------|
| Browser Launch | 5-10s | 7.5s |
| Page Load | 5-15s | 10s |
| Content Rendering | 5-15s | 10s |
| Human Behavior | 18s | 18s |
| Data Extraction | 5-10s | 7.5s |
| Image Download | 10-30s | 20s |
| **SUBTOTAL** | **48-98s** | **73s (1.22 min)** |

### With Anti-Blocking Delay

| Component | Time | Notes |
|-----------|------|-------|
| Base Processing | 73s | Average time (see above) |
| Anti-Blocking Delay | 90s | Average (60-120s range) |
| **TOTAL PER PROPERTY** | **163s** | **2.72 minutes** |

---

## 🎯 Crawling Time Estimates

### Assumptions

- **Success Rate**: 100% (proven in production)
- **Average Time Per Property**: 163 seconds (2.72 minutes)
- **No Failures**: Assuming no HTTP retries needed
- **Serial Processing**: One property at a time (anti-blocking requirement)

### Time Estimates

| Properties | Formula | Total Time | Human-Readable |
|------------|---------|------------|----------------|
| **20** | 20 × 163s | **3,260 seconds** | **~54 minutes** |
| **100** | 100 × 163s | **16,300 seconds** | **~4.5 hours** |
| **1,000** | 1,000 × 163s | **163,000 seconds** | **~45 hours (2 days)** |

### Time Estimates by Scenario

#### Scenario 1: Fast Crawl (Minimum Delays)
- **Delay**: 60s between properties
- **Total Per Property**: 133s (2.22 min)

| Properties | Total Time | Human-Readable |
|------------|------------|----------------|
| 20 | 2,660s | **44 minutes** |
| 100 | 13,300s | **3.7 hours** |
| 1,000 | 133,000s | **37 hours** |

#### Scenario 2: Balanced Crawl (Average Delays)
- **Delay**: 90s between properties
- **Total Per Property**: 163s (2.72 min)

| Properties | Total Time | Human-Readable |
|------------|------------|----------------|
| 20 | 3,260s | **54 minutes** |
| 100 | 16,300s | **4.5 hours** |
| 1,000 | 163,000s | **45 hours (2 days)** |

#### Scenario 3: Conservative Crawl (Maximum Delays)
- **Delay**: 120s between properties
- **Total Per Property**: 193s (3.22 min)

| Properties | Total Time | Human-Readable |
|------------|------------|----------------|
| 20 | 3,860s | **64 minutes** |
| 100 | 19,300s | **5.4 hours** |
| 1,000 | 193,000s | **54 hours (2.25 days)** |

---

## 🚀 Production Recommendations

### For 20 Properties (Testing)
- **Estimated Time**: 54 minutes (balanced)
- **Command**: `npm run crawl -- --max-properties 20`
- **Use Case**: Testing, validation, small updates

### For 100 Properties (Small Batch)
- **Estimated Time**: 4.5 hours (balanced)
- **Command**: `npm run crawl -- --max-properties 100`
- **Use Case**: Daily updates, specific neighborhoods
- **Recommendation**: Run overnight or during off-hours

### For 1,000 Properties (Large Batch)
- **Estimated Time**: 45 hours / 2 days (balanced)
- **Command**: `npm run crawl -- --max-properties 1000`
- **Use Case**: Full database population, comprehensive market data
- **Recommendation**:
  - Split into 2-3 overnight batches (500 properties each)
  - Monitor logs for any issues
  - Resume capability ensures no data loss on interruption

### For 2,000+ Properties (Full Dataset)
- **Estimated Time**: ~4 days (split into batches)
- **Strategy**:
  1. **Night 1**: 500 properties (~14 hours)
  2. **Night 2**: 500 properties (~14 hours)
  3. **Night 3**: 500 properties (~14 hours)
  4. **Night 4**: 500 properties (~14 hours)
- **Benefits**: Manageable batches, easier monitoring, natural breaks

---

## 🛠️ Tuning Performance

### To Speed Up (With Caution)

⚠️ **Warning**: Reducing delays may trigger blocking mechanisms

```bash
# Reduce browser launch delays (not recommended for production)
export BROWSER_LAUNCH_DELAY_MIN=30000  # 30s (default: 60s)
export BROWSER_LAUNCH_DELAY_MAX=60000  # 60s (default: 120s)
```

**Impact**: Could reduce time by ~30-40%, but increases blocking risk

### To Slow Down (More Conservative)

```bash
# Increase browser launch delays for extra safety
export BROWSER_LAUNCH_DELAY_MIN=90000   # 90s (default: 60s)
export BROWSER_LAUNCH_DELAY_MAX=180000  # 180s (default: 120s)
```

**Impact**: Increases time by ~40-50%, but virtually eliminates blocking risk

---

## 📈 Performance Metrics

### Current Production Stats

- **Success Rate**: 100% (34/34 properties in last test)
- **Blocking Rate**: 0% (with current delays)
- **Average Speed**: 0.4-0.7 properties/minute
- **Most Common HTTP Status**: 200 (all successful)
- **Failed Extractions**: 0 (with multi-strategy extractors)

### Bottlenecks

1. **Anti-Blocking Delays** (90s avg) - **54% of total time**
2. **Human Behavior Simulation** (18s) - **11% of total time**
3. **Image Downloads** (20s avg) - **12% of total time**
4. **Page Load & Rendering** (20s avg) - **12% of total time**
5. **Browser Launch** (7.5s) - **5% of total time**
6. **Data Extraction** (7.5s) - **5% of total time**

**Key Insight**: Anti-blocking delays are the largest time consumer, but they're essential for 100% success rate.

---

## 📝 Notes

- All times are **averages** - actual times may vary by ±20%
- Slower internet connections will increase page load times
- Image-heavy properties will take longer to download
- Server load on Madlan's side can affect response times
- HTTP retries (520/502/503) add 10-45s when triggered (rare)

**Last Updated**: 2025-10-10
**Status**: Production-Ready ✅

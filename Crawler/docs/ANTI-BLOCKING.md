# Anti-Blocking Strategy for Madlan Crawler

## Overview

This document outlines the comprehensive anti-blocking and anti-detection strategies for the Madlan property crawler. The goal is to avoid IP blocking, CAPTCHA challenges, and rate limiting while maintaining respectful crawling practices.

## Crawlee Built-in Anti-Blocking Features

### ✅ Enabled by Default (Zero Configuration)

Crawlee provides robust anti-blocking features that work out of the box:

#### 1. Browser Fingerprinting 🎭
**Status**: ✅ Enabled by default in PlaywrightCrawler

**What it does:**
- Generates realistic, human-like browser fingerprints
- Randomizes browser attributes to avoid detection
- Makes headless browsers appear as real user browsers

**How it works:**
- Uses real browser fingerprint data
- Automatically rotates fingerprints between requests
- Modifies HTTP headers, browser APIs, and low-level signals

**Configuration:**
```typescript
const crawler = new PlaywrightCrawler({
  // Fingerprints are enabled by default
  // You can customize:
  browserPoolOptions: {
    useFingerprints: true, // Default: true
    fingerprintOptions: {
      browsers: ['chrome', 'firefox'], // Browser types
      operatingSystems: ['windows', 'macos'], // OS
      devices: ['desktop'], // Device type
      locales: ['he-IL', 'en-US'], // Locale
    }
  }
});
```

#### 2. User Agent Rotation 🔄
**Status**: ✅ Automatic

**What it does:**
- Automatically applies correct User-Agent headers
- Rotates user agents to appear as different browsers
- Matches user agent with browser fingerprint

#### 3. TLS Fingerprint Replication 🔐
**Status**: ✅ Automatic

**What it does:**
- Replicates real browser TLS fingerprints
- Prevents detection via TLS handshake analysis
- Makes HTTPS connections appear authentic

#### 4. Browser-Like Headers 📋
**Status**: ✅ Automatic

**What it does:**
- Generates realistic HTTP headers
- Includes Accept, Accept-Language, Accept-Encoding
- Maintains consistent header ordering

### ⚙️ Configurable Rate Limiting

Crawlee provides several mechanisms for controlling request rate:

#### 1. Concurrency Control
**Purpose**: Limit parallel requests

```typescript
const crawler = new PlaywrightCrawler({
  minConcurrency: 2,    // Start with 2 parallel requests
  maxConcurrency: 5,    // Max 5 parallel requests
});
```

**Defaults:**
- Starts with 1 concurrent request
- Scales up to maximum of 200 (auto-scaled)

**Best Practice for Madlan:**
- Start conservative: `minConcurrency: 2`
- Limit maximum: `maxConcurrency: 5-10`
- Let AutoscaledPool find optimal rate

#### 2. Requests Per Minute Limit
**Purpose**: Cap total requests per minute

```typescript
const crawler = new PlaywrightCrawler({
  maxConcurrency: 10,
  maxRequestsPerMinute: 120, // Max 120 requests/minute = ~2 per second
});
```

**Best Practice for Madlan:**
- Conservative: `60-120` requests/minute
- Aggressive: `200-300` requests/minute (higher risk)
- Monitor for blocking and adjust

#### 3. Custom Delays Between Requests

**Method 1: Using Crawlee's `sleep()` function**
```typescript
import { PlaywrightCrawler, sleep } from 'crawlee';

const crawler = new PlaywrightCrawler({
  async requestHandler({ page, request, enqueueLinks }) {
    // Extract data...
    await page.click('.property-card');

    // Random delay: 2-5 seconds
    const randomDelay = 2000 + Math.random() * 3000;
    await sleep(randomDelay);

    // Continue crawling...
  },
});
```

**Method 2: Using Playwright's `waitForTimeout()`**
```typescript
const crawler = new PlaywrightCrawler({
  async requestHandler({ page }) {
    // Navigate...
    await page.goto(request.url);

    // Wait 3 seconds
    await page.waitForTimeout(3000);

    // Extract data...
  },
  // Increase handler timeout if using long delays
  requestHandlerTimeoutSecs: 120, // Default: 60 seconds
});
```

## Advanced Anti-Detection Techniques

### 1. Stealth Plugin (Enhanced Mode)
**Purpose**: Additional evasion for strict anti-bot systems

**Installation:**
```bash
npm install playwright-extra puppeteer-extra-plugin-stealth
```

**Usage:**
```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const crawler = new PlaywrightCrawler({
  launchContext: {
    launcher: chromium,
    launchOptions: {
      headless: true, // Can use headless with stealth
    },
  },
});
```

**What it adds:**
- Removes `navigator.webdriver` flag
- Mimics real Chrome DevTools Protocol
- Randomizes canvas fingerprints
- Spoofs plugins and permissions

### 2. Session Management
**Purpose**: Maintain consistent sessions with cookies

```typescript
const crawler = new PlaywrightCrawler({
  persistCookiesPerSession: true, // Maintain cookies across requests
  sessionPoolOptions: {
    maxPoolSize: 10,        // Max 10 concurrent sessions
    sessionOptions: {
      maxUsageCount: 50,    // Retire session after 50 uses
      maxErrorScore: 3,     // Retire after 3 errors
    },
  },
});
```

**Benefits:**
- Appears as persistent user sessions
- Reduces suspicious "new visitor" signals
- Maintains authentication state (if needed)

### 3. Headful Mode (Last Resort)
**Purpose**: Run real visible browser for maximum authenticity

```typescript
const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: {
      headless: false, // Show actual browser window
      slowMo: 100,     // Slow down actions by 100ms
    },
  },
});
```

**Trade-offs:**
- ✅ Hardest to detect
- ✅ Most human-like behavior
- ❌ Slower performance
- ❌ Higher resource usage
- ❌ Can't run on headless servers

## Recommended Strategy for Madlan.co.il

### Phase 1: Conservative Approach (Start Here)

```typescript
const crawler = new PlaywrightCrawler({
  // Concurrency
  minConcurrency: 2,
  maxConcurrency: 5,
  maxRequestsPerMinute: 60, // 1 request per second average

  // Session management
  persistCookiesPerSession: true,
  sessionPoolOptions: {
    maxPoolSize: 5,
  },

  // Browser configuration
  browserPoolOptions: {
    useFingerprints: true, // Default, but explicit
  },

  // Request handler
  async requestHandler({ page, request, enqueueLinks, log }) {
    // Random delay before each action: 1-3 seconds
    const randomDelay = () => sleep(1000 + Math.random() * 2000);

    await randomDelay();

    // Navigate and extract data...
    log.info(`Processing: ${request.url}`);

    await randomDelay();
  },

  // Timeouts
  requestHandlerTimeoutSecs: 120,
});
```

**Expected behavior:**
- ~60 requests per hour (1 per minute)
- Random delays make patterns less detectable
- Session cookies maintained
- Browser fingerprints rotated

### Phase 2: If Not Blocked - Increase Speed

```typescript
const crawler = new PlaywrightCrawler({
  minConcurrency: 5,
  maxConcurrency: 10,
  maxRequestsPerMinute: 120, // 2 requests per second

  async requestHandler({ page, request }) {
    // Shorter random delays: 0.5-1.5 seconds
    await sleep(500 + Math.random() * 1000);

    // Extract data...
  },
});
```

### Phase 3: If Blocked - Add Stealth

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

const crawler = new PlaywrightCrawler({
  minConcurrency: 1,          // Reduce concurrency
  maxConcurrency: 3,
  maxRequestsPerMinute: 30,   // Very conservative

  launchContext: {
    launcher: chromium,       // Use stealth-enhanced browser
  },

  async requestHandler({ page, request }) {
    // Longer random delays: 3-7 seconds
    await sleep(3000 + Math.random() * 4000);

    // Simulate human scrolling
    await page.evaluate(() => {
      window.scrollTo(0, Math.random() * 500);
    });

    await sleep(1000);

    // Extract data...
  },
});
```

## Additional Human-Like Behaviors

### 1. Mouse Movements
```typescript
await page.mouse.move(
  Math.random() * 1000,
  Math.random() * 800
);
```

### 2. Random Scrolling
```typescript
await page.evaluate(() => {
  window.scrollBy({
    top: Math.random() * 500,
    behavior: 'smooth',
  });
});
```

### 3. Varying Navigation Patterns
```typescript
// Sometimes wait for network idle
await page.goto(url, { waitUntil: 'networkidle' });

// Sometimes wait for DOM content
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### 4. Random Click Delays
```typescript
// Before clicking, move mouse over element
await page.hover('.property-card');
await sleep(200 + Math.random() * 300);
await page.click('.property-card');
```

## Monitoring & Adaptive Throttling

### Detect Blocking Signals

```typescript
async requestHandler({ page, request, log }) {
  const content = await page.content();

  // Check for blocking indicators
  if (content.includes('captcha') ||
      content.includes('access denied') ||
      content.includes('rate limit')) {
    log.error('🚫 Blocking detected!');

    // Increase delays
    await sleep(30000); // Wait 30 seconds

    // Reduce concurrency
    // (Would need external state management)
  }
}
```

### Progressive Backoff

```typescript
let delayMultiplier = 1;

async requestHandler({ page, request, log }) {
  const baseDelay = 2000;
  const currentDelay = baseDelay * delayMultiplier;

  await sleep(currentDelay + Math.random() * 1000);

  try {
    // Crawl...
    delayMultiplier = Math.max(1, delayMultiplier * 0.9); // Decrease
  } catch (error) {
    if (isBlockingError(error)) {
      delayMultiplier *= 2; // Double delays on errors
      log.warning(`Increasing delays to ${currentDelay * 2}ms`);
    }
  }
}
```

## Proxy Support (If Needed)

If Madlan implements IP-based rate limiting:

```typescript
const crawler = new PlaywrightCrawler({
  proxyConfiguration: {
    proxyUrls: [
      'http://proxy1.example.com:8000',
      'http://proxy2.example.com:8000',
    ],
    // Or use Apify Proxy
    // useApifyProxy: true,
  },
});
```

**Proxy options:**
- **Free**: Rotating residential proxies (often unreliable)
- **Paid**: Bright Data, Oxylabs, Smartproxy (~$50-500/month)
- **Last resort**: Only if IP blocking is confirmed

## Ethical Considerations

### Respectful Crawling Checklist

- ✅ Use reasonable delays (2-5 seconds between requests)
- ✅ Limit concurrency (5-10 max)
- ✅ Crawl during off-peak hours (if possible)
- ✅ Respect robots.txt (if applicable)
- ✅ Include contact info in User-Agent
- ✅ Stop if blocking is detected
- ✅ Don't overwhelm their servers

### Custom User Agent

```typescript
const crawler = new PlaywrightCrawler({
  launchContext: {
    launchOptions: {
      args: [
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (Research Bot; contact: your-email@example.com)',
      ],
    },
  },
});
```

## Summary: Default vs Custom Configuration

| Feature | Crawlee Default | Recommended for Madlan |
|---------|----------------|------------------------|
| **Fingerprinting** | ✅ Enabled | ✅ Keep enabled |
| **User Agent** | ✅ Auto-rotated | ✅ Keep default or custom with contact |
| **TLS Fingerprints** | ✅ Enabled | ✅ Keep enabled |
| **Headers** | ✅ Auto-generated | ✅ Keep default |
| **Concurrency** | 1-200 (auto) | 🔧 Set 2-10 manual |
| **Rate Limit** | Infinity | 🔧 Set 60-120/min |
| **Random Delays** | ❌ Not default | ✅ **Add manually** (critical!) |
| **Session Management** | ❌ Not default | ✅ **Enable** (recommended) |
| **Stealth Plugin** | ❌ Not default | ⚠️ Add if blocked |
| **Proxies** | ❌ Not default | ⚠️ Only if IP-blocked |

## Key Takeaway

**Crawlee provides excellent anti-blocking features by default, BUT:**

You **MUST add custom random delays** between requests to fully mimic human behavior. The built-in `maxRequestsPerMinute` controls average rate, but random delays (1-5 seconds) make the pattern irregular and less detectable.

**Recommended starting configuration:**
1. ✅ Use Crawlee defaults (fingerprints, headers, TLS)
2. ✅ Set conservative concurrency (2-5)
3. ✅ Set rate limit (60-120 requests/min)
4. ✅ **Add random delays** (2-5 seconds) in request handler
5. ✅ Enable session management
6. ⚠️ Monitor for blocking and adjust

This approach balances speed, reliability, and respectful crawling.

---

**Last Updated**: 2025-10-08
**For**: Madlan Property Crawler Project

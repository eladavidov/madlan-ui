# CAPTCHA Solving Guide

This document explains how to solve Madlan's CAPTCHA protection to enable web scraping.

## The Problem

Madlan.co.il uses **PerimeterX (HUMAN Security)** bot detection with a "Press & Hold" CAPTCHA challenge. This prevents automated scraping.

**Confirmed Details:**
- **Service**: PerimeterX (App ID: `PXo4wPDYYd`)
- **Challenge Type**: "Press & Hold" button in iframe
- **NOT Cloudflare**: This is a different protection system
- **Difficulty**: High - sophisticated behavioral analysis

## Solution Options

### Option 1: Commercial CAPTCHA Solving Service (Recommended for Production)

**Best for**: Automated, scalable, production crawling

**Services for PerimeterX**:
- **CapSolver** - **BEST for PerimeterX** - Specializes in PerimeterX/HUMAN - [https://capsolver.com](https://capsolver.com)
- **2Captcha** - Use GeeTest method - $2.99/1000 - [https://2captcha.com](https://2captcha.com)
- **Anti-Captcha** - Good alternative - $1-3/1000 - [https://anti-captcha.com](https://anti-captcha.com)

**⚠️ Important**: PerimeterX is more sophisticated than regular CAPTCHAs. **CapSolver** has the best success rate for this specific protection.

**Setup Instructions**:

### Option A: CapSolver (Recommended for PerimeterX)

1. **Sign up for CapSolver**:
   ```bash
   # Create account at https://capsolver.com
   # Add funds ($5-10 minimum)
   # Get API key from dashboard
   ```

2. **Configure environment**:
   ```bash
   # Add to .env
   CAPTCHA_SERVICE=capsolver
   CAPTCHA_API_KEY=your_capsolver_api_key
   CAPTCHA_TIMEOUT=120000
   ```

3. **Enable in crawler** (implementation coming soon)

### Option B: 2Captcha (Standard Alternative)

1. **Sign up for 2Captcha**:
   ```bash
   # Create account at https://2captcha.com
   # Add funds ($5-10 minimum)
   # Get API key from dashboard
   ```

2. **Configure environment**:
   ```bash
   # Add to .env
   CAPTCHA_SERVICE=2captcha
   CAPTCHA_API_KEY=your_2captcha_api_key
   CAPTCHA_TIMEOUT=120000
   ```

3. **Select method**: Use "GeeTest" method for PerimeterX challenges

**Note**: CapSolver typically has higher success rates (90%+) for PerimeterX vs 2Captcha (70-80%)

**Pros**:
- ✅ Fully automated
- ✅ High success rate (>90%)
- ✅ Scalable to thousands of requests
- ✅ Fast (10-30 seconds per solve)

**Cons**:
- ❌ Costs money (~$2-3 per 1000 properties)
- ❌ Requires API integration
- ❌ Monthly subscription or pay-as-you-go

**Cost Example**:
- 1000 properties = ~$2.99
- 10,000 properties = ~$29.90
- Very affordable for data collection

---

### Option 2: Manual Solving with Claude Code (Best for Testing)

**Best for**: Initial testing, small batches, understanding the CAPTCHA

**How it works**:
1. Crawler runs in **non-headless mode** (visible browser)
2. CAPTCHA detected → Crawler **pauses automatically**
3. **You solve CAPTCHA manually** in the browser window
4. Crawler **detects success** and continues automatically
5. **Session cookies saved** for reuse (valid ~30 minutes)

**Setup Instructions**:

1. **Enable non-headless mode**:
   ```bash
   # Add to .env
   HEADLESS=false
   ```

2. **Run crawler**:
   ```bash
   npm run crawl
   ```

3. **When CAPTCHA appears**:
   - Browser window opens automatically
   - Complete the "Press & Hold" challenge
   - Crawler continues automatically
   - Session saved to `data/cache/session.json`

**Pros**:
- ✅ Free
- ✅ No API keys needed
- ✅ Learn the CAPTCHA behavior
- ✅ Session reuse (30 min validity)
- ✅ Good for testing/debugging

**Cons**:
- ❌ Manual intervention required
- ❌ Not scalable
- ❌ Limited to your availability
- ❌ Session expires after ~30 minutes

**When to use**:
- Initial testing (5-10 properties)
- Understanding CAPTCHA behavior
- Verifying selector accuracy
- Development and debugging

---

### Option 3: Claude Code Assisted (Semi-Automated)

**Best for**: Learning, guided solving, screenshot analysis

**How it works**:
1. Crawler takes **screenshot of CAPTCHA**
2. You ask Claude Code to **analyze screenshot**
3. Claude provides **solving instructions**
4. You **follow instructions** to solve
5. Crawler continues

**Setup Instructions**:

1. **Enable screenshot mode**:
   ```typescript
   const captchaHelper = new ManualCaptchaHelper();
   await captchaHelper.solveWithClaudeGuidance(page);
   ```

2. **When CAPTCHA appears**:
   - Screenshot saved to `data/cache/captcha-screenshot.png`
   - Ask Claude: "Read @data/cache/captcha-screenshot.png and help me solve this"
   - Claude analyzes and provides instructions
   - You solve manually
   - Crawler continues

**Pros**:
- ✅ Free
- ✅ Claude helps understand CAPTCHA
- ✅ Educational
- ✅ Good for troubleshooting

**Cons**:
- ❌ Still manual
- ❌ Slower than other options
- ❌ Not for production

---

## Integration into Crawler

### Using Commercial Service (2Captcha)

**File**: `src/crawlers/propertyCrawler.ts`

```typescript
import { createCaptchaSolver } from "../utils/captchaSolver.js";

const captchaSolver = createCaptchaSolver();

// In request handler, replace the CAPTCHA detection block:
const captchaDetected = await page.locator('text="Press & Hold"').count() > 0;

if (captchaDetected) {
  if (captchaSolver) {
    logger.info("CAPTCHA detected, attempting to solve...");
    const solved = await captchaSolver.solveCaptcha(page);

    if (solved) {
      logger.info("✅ CAPTCHA solved, continuing...");
      // Continue with extraction
    } else {
      logger.error("❌ CAPTCHA solving failed");
      sessionRepo.logError(sessionId, "captcha", "Failed to solve CAPTCHA", undefined, url);
      stats.propertiesFailed++;
      return;
    }
  } else {
    logger.warn("CAPTCHA detected but no solver configured");
    stats.propertiesFailed++;
    return;
  }
}
```

### Using Manual Solving

**File**: `src/crawlers/propertyCrawler.ts`

```typescript
import { ManualCaptchaHelper } from "../utils/manualCaptchaHelper.js";

const captchaHelper = new ManualCaptchaHelper();

// Before crawler starts, try to load existing session:
if (captchaHelper.hasSavedSession()) {
  await captchaHelper.loadSession(page);
  logger.info("✅ Loaded saved session, may skip CAPTCHA");
}

// In request handler:
const captchaDetected = await page.locator('text="Press & Hold"').count() > 0;

if (captchaDetected) {
  logger.warn("🛑 CAPTCHA detected, waiting for manual solve...");
  const solved = await captchaHelper.waitForManualSolve(page);

  if (solved) {
    logger.info("✅ CAPTCHA solved manually, continuing...");
    // Continue with extraction
  } else {
    logger.error("❌ Manual solve timeout");
    stats.propertiesFailed++;
    return;
  }
}
```

---

## Comparison Table

| Feature | Commercial Service | Manual Solving | Claude Assisted |
|---------|-------------------|----------------|-----------------|
| **Cost** | $3/1000 | Free | Free |
| **Speed** | 10-30 sec | 30-60 sec | 1-2 min |
| **Automation** | Fully automated | Manual | Semi-manual |
| **Scalability** | Unlimited | Limited | Limited |
| **Best For** | Production | Testing | Learning |
| **Success Rate** | 90%+ | 100% | 100% |
| **Effort** | Low (setup once) | Medium | Medium |

---

## Recommended Approach

**For your situation, I recommend**:

### Phase 1: Testing (Use Manual Solving)
```bash
# Set up for manual testing
echo "HEADLESS=false" >> .env
npm run crawl
```

1. Run crawler with 5-10 properties
2. Solve CAPTCHA manually once
3. Session saved automatically
4. Verify selectors work correctly
5. Confirm data extraction accuracy

### Phase 2: Production (Switch to 2Captcha)
```bash
# Once testing confirms everything works
echo "CAPTCHA_SERVICE=2captcha" >> .env
echo "CAPTCHA_API_KEY=your_key" >> .env
echo "HEADLESS=true" >> .env
npm run crawl
```

1. Sign up for 2Captcha ($5-10 initial)
2. Add API key to config
3. Run automated crawls
4. Monitor success rate
5. Scale to full dataset

**Estimated Costs**:
- Testing (manual): $0
- Small batch (100 properties): ~$0.30
- Full crawl (1000 properties): ~$3
- Large dataset (10,000): ~$30

---

## Implementation Status

- ✅ CAPTCHA detection implemented
- ✅ Error logging for CAPTCHA encounters
- ✅ Manual solving helper created (`manualCaptchaHelper.ts`)
- ✅ Commercial solver integration created (`captchaSolver.ts`)
- ⏳ 2Captcha API integration (skeleton ready, needs testing)
- ⏳ Session management (implemented, needs testing)
- ⏳ Anti-Captcha integration (planned)
- ⏳ CapSolver integration (planned)

---

## Next Steps

### To Enable Manual Solving (Right Now):

1. **Update `.env`**:
   ```bash
   HEADLESS=false
   ```

2. **Modify `propertyCrawler.ts`** to use ManualCaptchaHelper (see Integration section)

3. **Test with small batch**:
   ```bash
   # Crawl just 5 properties
   MAX_PROPERTIES=5 npm run crawl
   ```

### To Enable 2Captcha (After Testing):

1. **Sign up**: https://2captcha.com
2. **Add funds**: $5-10 to start
3. **Get API key** from dashboard
4. **Update `.env`**:
   ```bash
   CAPTCHA_SERVICE=2captcha
   CAPTCHA_API_KEY=your_api_key_here
   ```
5. **Test with small batch** first
6. **Scale up** once confirmed working

---

## Support

**If CAPTCHA solving fails**:
- Check logs in `logs/crawler.log`
- Verify session file: `data/cache/session.json`
- Try refreshing session (delete session.json)
- Check CAPTCHA service balance/status
- Verify API key is correct

**Common Issues**:
- Session expired → Delete `session.json` and solve again
- CAPTCHA changed → Update detection selectors
- Service timeout → Increase `CAPTCHA_TIMEOUT`
- High failure rate → Switch CAPTCHA service

**Need help?** Check the logs first, then consult:
- 2Captcha docs: https://2captcha.com/2captcha-api
- Playwright docs: https://playwright.dev/
- Or ask Claude Code for assistance

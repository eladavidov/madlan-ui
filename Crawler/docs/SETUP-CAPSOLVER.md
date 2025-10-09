# CapSolver Setup Guide

## 🔐 Step 1: Secure Your API Key

Create a `.env` file in the `Crawler/` directory:

```bash
cd Crawler
```

**Option A: Create `.env` file manually:**

1. Create a new file called `.env` (no extension) in the `Crawler/` folder
2. Add the following content:

```env
# Database Configuration
DB_PATH=./data/databases/properties.db
DUCKDB_PATH=./data/databases/analytics.duckdb

# Storage Configuration
IMAGES_DIR=./data/images
EXPORTS_DIR=./data/exports
CACHE_DIR=./data/cache
LOGS_DIR=./logs

# Crawler Configuration
CONCURRENCY_MIN=2
CONCURRENCY_MAX=5
MAX_REQUESTS_PER_MINUTE=60
MAX_REQUEST_RETRIES=3
REQUEST_DELAY_MIN=2000
REQUEST_DELAY_MAX=5000

# Target Configuration
TARGET_CITY=חיפה
MAX_PROPERTIES=100

# Logging Configuration
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_TO_CONSOLE=true

# Browser Configuration
HEADLESS=true
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36

# CapSolver CAPTCHA Configuration
CAPTCHA_SERVICE=capsolver
CAPTCHA_API_KEY=YOUR_CAPSOLVER_API_KEY_HERE
CAPTCHA_TIMEOUT=120000
```

3. **Replace `YOUR_CAPSOLVER_API_KEY_HERE` with your actual API key**

**Option B: Copy from example and edit:**

```bash
# From Crawler/ directory
cp .env.example .env

# Then edit .env and add your API key:
# CAPTCHA_API_KEY=your_actual_key_here
```

---

## ⚠️ Important Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Keep your API key secret** - Don't share it publicly
3. **Check balance** regularly at https://dashboard.capsolver.com/

---

## ✅ Step 2: Verify Setup

Check that your `.env` file exists and has the correct settings:

```bash
cd Crawler

# Check if file exists (PowerShell)
Test-Path .env

# Or check file content (be careful not to expose API key in screenshots!)
cat .env | findstr CAPTCHA_SERVICE
# Should show: CAPTCHA_SERVICE=capsolver
```

---

## 🚀 Step 3: Test the Configuration

### Small Test Crawl (5 properties):

```bash
cd Crawler
npm run crawl
```

Or with explicit limits:

```bash
cd Crawler
set MAX_PROPERTIES=5
npm run crawl
```

**What will happen:**
1. Crawler starts
2. Navigates to Madlan search page
3. **CAPTCHA appears** → Detected automatically
4. **CapSolver API called** → Sends challenge for solving
5. **Waits 10-30 seconds** → Human solver works on it
6. **Solution received** → Applied to page
7. **Crawler continues** → Extracts property data

**Expected console output:**
```
[info]: CAPTCHA detected on https://www.madlan.co.il/...
[info]: Attempting to solve CAPTCHA automatically...
[info]: Sending CAPTCHA to CapSolver (PerimeterX)...
[info]: CapSolver task created: abc123-def456
[debug]: CapSolver still processing...
[info]: ✅ CapSolver solved CAPTCHA successfully
[info]: ✅ CAPTCHA solved successfully, continuing...
[info]: Processing property: https://www.madlan.co.il/...
```

---

## 📊 Step 4: Monitor Your Usage

**Check CapSolver Dashboard:**
- Login: https://dashboard.capsolver.com/
- View balance and usage
- Each solve costs ~$0.002-0.003
- Refill when balance gets low

**Monitor Crawler Logs:**
```bash
# View logs in real-time
tail -f logs/crawler.log

# Or on Windows PowerShell:
Get-Content logs/crawler.log -Wait
```

---

## 🐛 Troubleshooting

### Problem: "CAPTCHA detected but no solver configured"

**Solution:** Check your `.env` file:
```bash
# Make sure these lines exist:
CAPTCHA_SERVICE=capsolver
CAPTCHA_API_KEY=CAP-xxx...    # Your actual key
```

### Problem: "CapSolver task creation failed"

**Possible causes:**
1. **Invalid API key** → Check you copied it correctly
2. **Insufficient balance** → Add funds at https://capsolver.com/
3. **Network issues** → Check internet connection

**Fix:** Verify API key in dashboard: https://dashboard.capsolver.com/dashboard/api

### Problem: "CapSolver timeout after 2 minutes"

**Causes:**
- CapSolver is busy (rare)
- Challenge is too difficult

**Fix:** Crawler will retry automatically (up to 3 times)

### Problem: CAPTCHA still not solved

**Debug steps:**
1. Check logs: `cat logs/crawler.log`
2. Verify CapSolver balance: https://dashboard.capsolver.com/
3. Test API key manually:

```bash
# Test API key with curl (replace YOUR_KEY):
curl -X POST https://api.capsolver.com/getBalance \
  -H "Content-Type: application/json" \
  -d '{"clientKey":"YOUR_API_KEY_HERE"}'

# Should return: {"errorId":0,"balance":10.50}
```

---

## 💰 Cost Tracking

**Estimated costs for Madlan scraping:**

| Properties | Approx. CAPTCHAs | Cost |
|-----------|------------------|------|
| 10 | ~2-3 | $0.01 |
| 100 | ~10-15 | $0.03-0.05 |
| 1,000 | ~100-150 | $0.30-0.45 |
| 10,000 | ~1,000-1,500 | $3-4.50 |

**Why multiple CAPTCHAs?**
- One per session start
- One if session expires (~30 min)
- One if IP changes or suspicious activity

**Optimization tips:**
- Run larger batches to amortize session costs
- Use lower concurrency (fewer parallel sessions)
- Increase delays between requests

---

## 🔄 Alternative: Free Manual Testing

If you want to test WITHOUT spending money first:

```bash
# Disable CapSolver, enable manual mode
cd Crawler

# Edit .env and change:
HEADLESS=false
# CAPTCHA_API_KEY=    # Comment out or remove

# Run crawler
npm run crawl

# When CAPTCHA appears:
# 1. Browser window opens
# 2. YOU manually press & hold button
# 3. Crawler continues automatically
```

This is free but requires your manual intervention each time CAPTCHA appears.

---

## ✅ Setup Complete!

You're ready to scrape Madlan with automated CAPTCHA solving!

**Next commands:**

```bash
# Test with 5 properties:
cd Crawler
set MAX_PROPERTIES=5
npm run crawl

# Full crawl (100 properties):
cd Crawler
npm run crawl

# Large dataset (1000 properties):
cd Crawler
set MAX_PROPERTIES=1000
npm run crawl
```

**Monitor progress in logs:**
```bash
tail -f logs/crawler.log    # Unix/Mac
Get-Content logs/crawler.log -Wait    # Windows PowerShell
```

---

## 📚 Additional Resources

- **CapSolver Docs**: https://docs.capsolver.com/
- **CapSolver Dashboard**: https://dashboard.capsolver.com/
- **Support**: https://t.me/capsolver (Telegram)
- **Pricing**: https://capsolver.com/pricing

---

## 🆘 Need Help?

1. **Check logs**: `logs/crawler.log` and `logs/errors.log`
2. **Verify balance**: https://dashboard.capsolver.com/
3. **Test API key**: See troubleshooting section above
4. **Ask Claude Code**: Provide logs and I'll help debug!

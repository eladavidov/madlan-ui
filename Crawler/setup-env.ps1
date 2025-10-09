# CapSolver Setup Script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CapSolver API Key Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path .env) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

# Get API key from user
Write-Host "Please enter your CapSolver API key:" -ForegroundColor Green
Write-Host "(You can find it at: https://dashboard.capsolver.com/dashboard/api)" -ForegroundColor Gray
$apiKey = Read-Host "API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "❌ API key cannot be empty!" -ForegroundColor Red
    exit
}

# Create .env file
$envContent = @"
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
CAPTCHA_API_KEY=$apiKey
CAPTCHA_TIMEOUT=120000
"@

# Write to file
$envContent | Out-File -FilePath .env -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run crawl" -ForegroundColor White
Write-Host "2. Watch the crawler solve CAPTCHAs automatically!" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor usage at: https://dashboard.capsolver.com/" -ForegroundColor Gray

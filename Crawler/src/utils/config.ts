/**
 * Configuration Utilities
 * Load and validate environment configuration
 */

import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";

// Load .env file if it exists
if (existsSync(".env")) {
  loadEnv();
}

/**
 * Crawler configuration
 */
export const config = {
  // Database
  database: {
    path: process.env.DB_PATH || "./data/databases/properties.db",
    duckdbPath: process.env.DUCKDB_PATH || "./data/databases/analytics.duckdb",
  },

  // Storage
  storage: {
    imagesDir: process.env.IMAGES_DIR || "./data/images",
    exportsDir: process.env.EXPORTS_DIR || "./data/exports",
    cacheDir: process.env.CACHE_DIR || "./data/cache",
    logsDir: process.env.LOGS_DIR || "./logs",
  },

  // Crawler settings
  crawler: {
    concurrencyMin: parseInt(process.env.CONCURRENCY_MIN || "2", 10),
    concurrencyMax: parseInt(process.env.CONCURRENCY_MAX || "5", 10),
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || "60", 10),
    maxRequestRetries: parseInt(process.env.MAX_REQUEST_RETRIES || "3", 10),
    requestDelayMin: parseInt(process.env.REQUEST_DELAY_MIN || "2000", 10),
    requestDelayMax: parseInt(process.env.REQUEST_DELAY_MAX || "5000", 10),
    // Fresh browser per property (anti-blocking strategy)
    freshBrowserPerProperty: process.env.FRESH_BROWSER_PER_PROPERTY !== "false", // Default: true
    browserLaunchDelayMin: parseInt(process.env.BROWSER_LAUNCH_DELAY_MIN || "60000", 10), // 60s default
    browserLaunchDelayMax: parseInt(process.env.BROWSER_LAUNCH_DELAY_MAX || "120000", 10), // 120s default
  },

  // Target
  target: {
    city: process.env.TARGET_CITY || "חיפה",
    maxProperties: parseInt(process.env.MAX_PROPERTIES || "100", 10),
    // CRITICAL: Correct URL format with required parameters
    searchUrlTemplate: "https://www.madlan.co.il/for-sale/{city}-%D7%99%D7%A9%D7%A8%D7%90%D7%9C?tracking_search_source=new_search&marketplace=residential",
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    toFile: process.env.LOG_TO_FILE !== "false",
    toConsole: process.env.LOG_TO_CONSOLE !== "false",
  },

  // Browser
  browser: {
    headless: process.env.HEADLESS !== "false",
    userAgent:
      process.env.USER_AGENT ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (config.crawler.concurrencyMin < 1) {
    errors.push("CONCURRENCY_MIN must be >= 1");
  }

  if (config.crawler.concurrencyMax < config.crawler.concurrencyMin) {
    errors.push("CONCURRENCY_MAX must be >= CONCURRENCY_MIN");
  }

  if (config.crawler.maxRequestsPerMinute < 1) {
    errors.push("MAX_REQUESTS_PER_MINUTE must be >= 1");
  }

  if (config.crawler.requestDelayMin < 0) {
    errors.push("REQUEST_DELAY_MIN must be >= 0");
  }

  if (config.crawler.requestDelayMax < config.crawler.requestDelayMin) {
    errors.push("REQUEST_DELAY_MAX must be >= REQUEST_DELAY_MIN");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join("\n")}`);
  }
}

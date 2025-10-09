/**
 * Manual CAPTCHA Helper
 * Assists with manual CAPTCHA solving using Claude Code + Chrome MCP
 */

import { Page } from "playwright";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { logger } from "./logger.js";

export interface SavedSession {
  cookies: any[];
  userAgent: string;
  timestamp: number;
}

/**
 * Manual CAPTCHA solving workflow
 *
 * This helper coordinates with Claude Code to solve CAPTCHAs manually:
 * 1. Detect CAPTCHA on page
 * 2. Pause crawler and take screenshot
 * 3. User solves CAPTCHA manually (with Claude's guidance if needed)
 * 4. Save session cookies
 * 5. Resume crawler with saved session
 */
export class ManualCaptchaHelper {
  private sessionFile: string;

  constructor(sessionFile: string = "./data/cache/session.json") {
    this.sessionFile = sessionFile;
  }

  /**
   * Check if we have a valid saved session
   */
  hasSavedSession(): boolean {
    if (!existsSync(this.sessionFile)) return false;

    try {
      const session: SavedSession = JSON.parse(readFileSync(this.sessionFile, "utf-8"));
      const age = Date.now() - session.timestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes

      return age < maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Load saved session into page
   */
  async loadSession(page: Page): Promise<boolean> {
    try {
      if (!existsSync(this.sessionFile)) {
        logger.info("No saved session found");
        return false;
      }

      const session: SavedSession = JSON.parse(readFileSync(this.sessionFile, "utf-8"));

      // Set user agent
      await page.setExtraHTTPHeaders({
        "User-Agent": session.userAgent,
      });

      // Load cookies
      await page.context().addCookies(session.cookies);

      logger.info("✅ Loaded saved session from file");
      return true;
    } catch (error: any) {
      logger.error("Failed to load session:", error);
      return false;
    }
  }

  /**
   * Save current session to file
   */
  async saveSession(page: Page): Promise<void> {
    try {
      const cookies = await page.context().cookies();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      const session: SavedSession = {
        cookies,
        userAgent,
        timestamp: Date.now(),
      };

      writeFileSync(this.sessionFile, JSON.stringify(session, null, 2));
      logger.info("✅ Session saved to file");
    } catch (error: any) {
      logger.error("Failed to save session:", error);
    }
  }

  /**
   * Wait for user to solve CAPTCHA manually
   *
   * This pauses execution and provides instructions for manual solving
   */
  async waitForManualSolve(page: Page): Promise<boolean> {
    logger.info("\n" + "=".repeat(60));
    logger.info("🛑 CAPTCHA DETECTED - Manual Intervention Required");
    logger.info("=".repeat(60));
    logger.info("Please solve the CAPTCHA in the browser window.");
    logger.info("After solving, the crawler will automatically continue.");
    logger.info("");
    logger.info("Instructions:");
    logger.info("1. A browser window should be visible (set HEADLESS=false)");
    logger.info("2. Complete the CAPTCHA challenge");
    logger.info("3. Wait for the page to load");
    logger.info("4. The crawler will detect success and continue");
    logger.info("=".repeat(60));

    // Wait for CAPTCHA to be solved (page navigation or CAPTCHA disappears)
    try {
      await Promise.race([
        // Wait for navigation
        page.waitForNavigation({ timeout: 300000 }), // 5 minutes

        // Or wait for CAPTCHA to disappear
        page.waitForSelector('text="Press & Hold"', { state: "hidden", timeout: 300000 }),
      ]);

      logger.info("✅ CAPTCHA appears to be solved!");

      // Save session for future use
      await this.saveSession(page);

      return true;
    } catch (error) {
      logger.error("❌ Timeout waiting for CAPTCHA solve");
      return false;
    }
  }

  /**
   * Interactive CAPTCHA solving with Claude Code guidance
   *
   * This method can work with Chrome MCP to provide step-by-step guidance
   */
  async solveWithClaudeGuidance(page: Page): Promise<boolean> {
    logger.info("🤖 Starting Claude-assisted CAPTCHA solving...");

    // Take screenshot for analysis
    const screenshotPath = "./data/cache/captcha-screenshot.png";
    await page.screenshot({ path: screenshotPath, fullPage: false });

    logger.info(`📸 Screenshot saved to: ${screenshotPath}`);
    logger.info("");
    logger.info("💡 Next steps:");
    logger.info("1. Ask Claude Code to read the screenshot");
    logger.info("2. Claude will analyze the CAPTCHA type");
    logger.info("3. Claude will provide solving instructions");
    logger.info("4. Follow the instructions to solve manually");
    logger.info("");
    logger.info("Example prompt for Claude:");
    logger.info("  'Read @data/cache/captcha-screenshot.png and tell me how to solve this CAPTCHA'");
    logger.info("");

    // Wait for manual solve
    return await this.waitForManualSolve(page);
  }
}

/**
 * Example usage in crawler
 *
 * const captchaHelper = new ManualCaptchaHelper();
 *
 * // Try to load existing session first
 * if (captchaHelper.hasSavedSession()) {
 *   await captchaHelper.loadSession(page);
 * }
 *
 * // If CAPTCHA detected
 * if (await isCaptchaPresent(page)) {
 *   const solved = await captchaHelper.waitForManualSolve(page);
 *   // Or use Claude guidance:
 *   // const solved = await captchaHelper.solveWithClaudeGuidance(page);
 * }
 */

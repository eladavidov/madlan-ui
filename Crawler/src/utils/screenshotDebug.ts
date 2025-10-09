/**
 * Screenshot Debugging Utility
 * For quality-first debugging - capture screenshots when things go wrong
 */

import { Page } from "playwright";
import { logger } from "./logger.js";
import * as fs from "fs";
import * as path from "path";

export interface ScreenshotOptions {
  name?: string;
  fullPage?: boolean;
  saveDir?: string;
}

/**
 * Take a screenshot for debugging purposes
 */
export async function takeDebugScreenshot(
  page: Page,
  reason: string,
  options: ScreenshotOptions = {}
): Promise<string | null> {
  try {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = options.saveDir || path.join(process.cwd(), "debug-screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = options.name || reason.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const filename = `${timestamp}-${name}.png`;
    const filepath = path.join(screenshotDir, filename);

    // Take screenshot
    await page.screenshot({
      path: filepath,
      fullPage: options.fullPage ?? true,
    });

    logger.info(`📸 Debug screenshot saved: ${filename}`);
    logger.debug(`   Reason: ${reason}`);
    logger.debug(`   Path: ${filepath}`);

    return filepath;
  } catch (error: any) {
    logger.error(`Failed to take debug screenshot: ${error.message}`);
    return null;
  }
}

/**
 * Take screenshot if JavaScript is not running
 * NOTE: Disabled due to false positives from GTM noscript tags
 */
export async function screenshotIfJavaScriptDisabled(page: Page): Promise<void> {
  try {
    // Better detection: Check if React actually rendered content
    const hasContent = await page.evaluate(() => {
      const images = document.querySelectorAll('img').length;
      const links = document.querySelectorAll('a').length;
      const bodyLength = document.body.textContent?.length || 0;
      // If we have lots of content, images, and links, JavaScript is working
      return images > 5 && links > 10 && bodyLength > 10000;
    });

    if (!hasContent) {
      await takeDebugScreenshot(page, "javascript-disabled", {
        name: "js-disabled",
        fullPage: true,
      });
      logger.warn("⚠️  JavaScript may not be running - screenshot saved for debugging");
    }
  } catch (error) {
    // Non-critical, ignore
  }
}

/**
 * Take screenshot if CAPTCHA detected
 */
export async function screenshotIfCaptcha(page: Page, detected: boolean): Promise<void> {
  if (detected) {
    try {
      await takeDebugScreenshot(page, "captcha-detected", {
        name: "captcha",
        fullPage: false, // Just visible area for CAPTCHA
      });
      logger.warn("⚠️  CAPTCHA detected - screenshot saved for debugging");
    } catch (error) {
      // Non-critical, ignore
    }
  }
}

/**
 * Take screenshot if blocking detected
 */
export async function screenshotIfBlocked(page: Page, url: string): Promise<void> {
  try {
    await takeDebugScreenshot(page, `blocked-${url}`, {
      name: "blocked-page",
      fullPage: true,
    });
    logger.warn("⚠️  Blocking detected - screenshot saved for debugging");
  } catch (error) {
    // Non-critical, ignore
  }
}

/**
 * Take screenshot on error
 */
export async function screenshotOnError(
  page: Page,
  error: Error,
  context: string
): Promise<void> {
  try {
    const errorType = error.name.replace(/Error$/, "").toLowerCase();
    await takeDebugScreenshot(page, `error-${context}-${errorType}`, {
      name: `error-${errorType}`,
      fullPage: true,
    });
    logger.error(`📸 Error screenshot saved: ${context} - ${error.message}`);
  } catch (screenshotError) {
    // Non-critical, ignore
  }
}

/**
 * Take screenshot with page HTML for maximum debugging
 */
export async function screenshotWithHtml(
  page: Page,
  reason: string
): Promise<{ screenshot: string | null; html: string | null }> {
  const screenshot = await takeDebugScreenshot(page, reason, { fullPage: true });

  let html: string | null = null;
  try {
    const htmlContent = await page.content();
    const screenshotDir = path.join(process.cwd(), "debug-screenshots");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const htmlFilename = `${timestamp}-${reason.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html`;
    const htmlPath = path.join(screenshotDir, htmlFilename);

    fs.writeFileSync(htmlPath, htmlContent, "utf-8");
    html = htmlPath;
    logger.debug(`📄 HTML saved: ${htmlFilename}`);
  } catch (error) {
    // Non-critical
  }

  return { screenshot, html };
}

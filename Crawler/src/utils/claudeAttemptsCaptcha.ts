/**
 * Claude Attempts CAPTCHA (Educational - Will Likely Fail)
 *
 * This demonstrates WHY automated CAPTCHA solving doesn't work
 * even with sophisticated browser automation.
 */

import { Page } from "playwright";
import { logger } from "./logger.js";

/**
 * Claude attempts to solve CAPTCHA
 *
 * EXPECTED RESULT: ❌ Failure
 * WHY: CAPTCHAs detect automation through behavioral analysis
 */
export async function claudeAttemptsCaptcha(page: Page): Promise<boolean> {
  logger.info("🤖 Claude attempting to solve CAPTCHA (experimental)...");

  try {
    // Attempt 1: Simple click and hold
    logger.info("Attempt 1: Click and hold...");

    const pressHoldButton = page.locator('text="Press & Hold"');
    const buttonExists = await pressHoldButton.count() > 0;

    if (!buttonExists) {
      logger.info("No CAPTCHA button found");
      return false;
    }

    // Get button position
    const box = await pressHoldButton.boundingBox();
    if (!box) {
      logger.error("Could not get button position");
      return false;
    }

    // Try to simulate human-like behavior
    // (Spoiler: This won't work)

    // Move mouse in slightly curved path (simulate human movement)
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const x = box.x + box.width / 2 + Math.random() * 5 - 2.5; // Add jitter
      const y = box.y + box.height / 2 + Math.random() * 5 - 2.5;
      await page.mouse.move(x, y);
      await page.waitForTimeout(20 + Math.random() * 10); // Variable timing
    }

    // Press and hold
    await page.mouse.down();
    logger.info("Holding for 3 seconds...");

    // Hold with slight position variations (simulate hand tremor)
    for (let i = 0; i < 30; i++) {
      const x = box.x + box.width / 2 + Math.random() * 2 - 1;
      const y = box.y + box.height / 2 + Math.random() * 2 - 1;
      await page.mouse.move(x, y);
      await page.waitForTimeout(100);
    }

    await page.mouse.up();

    // Wait a moment to see if it worked
    await page.waitForTimeout(2000);

    // Check if CAPTCHA disappeared
    const stillThere = await pressHoldButton.count() > 0;

    if (!stillThere) {
      logger.info("✅ CAPTCHA solved! (Unlikely but possible!)");
      return true;
    } else {
      logger.warn("❌ CAPTCHA not solved (expected - detected automation)");
      logger.info("Why it failed:");
      logger.info("  - Mouse movements too programmatic");
      logger.info("  - WebDriver flags detected");
      logger.info("  - Missing human behavioral signals");
      logger.info("  - Browser fingerprint reveals automation");
      return false;
    }

  } catch (error: any) {
    logger.error("CAPTCHA attempt error:", error);
    return false;
  }
}

/**
 * Advanced attempt with more sophisticated mimicry
 * (Still unlikely to work - modern CAPTCHAs are too advanced)
 */
export async function claudeAdvancedAttempt(page: Page): Promise<boolean> {
  logger.info("🤖 Claude advanced CAPTCHA attempt...");

  try {
    // Try to hide automation signals
    await page.evaluate(() => {
      // Remove webdriver flag
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Add plugins to look more human
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Use more human-like delays
    const humanDelay = () => 100 + Math.random() * 200;

    const button = page.locator('text="Press & Hold"');
    const box = await button.boundingBox();
    if (!box) return false;

    // Simulate reading the page first (humans don't click instantly)
    await page.waitForTimeout(humanDelay());
    await page.waitForTimeout(humanDelay());

    // Move mouse in very realistic path (Bezier curve)
    const startX = 0, startY = 0;
    const endX = box.x + box.width / 2;
    const endY = box.y + box.height / 2;

    // Cubic bezier curve for natural mouse movement
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      // Control points for curve
      const cp1x = startX + (endX - startX) * 0.3;
      const cp1y = startY + (endY - startY) * 0.1;
      const cp2x = startX + (endX - startX) * 0.7;
      const cp2y = startY + (endY - startY) * 0.9;

      const x = mt3 * startX + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * endX;
      const y = mt3 * startY + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * endY;

      await page.mouse.move(x, y);
      await page.waitForTimeout(5 + Math.random() * 10);
    }

    // Brief pause before clicking (humans don't click instantly)
    await page.waitForTimeout(humanDelay());

    // Press
    await page.mouse.down();

    // Hold with micro-movements (simulate hand tremor)
    const holdDuration = 3000 + Math.random() * 500; // 3-3.5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < holdDuration) {
      // Tiny random movements (simulate hand tremor)
      const tremor = 0.5;
      const dx = (Math.random() - 0.5) * tremor;
      const dy = (Math.random() - 0.5) * tremor;
      await page.mouse.move(endX + dx, endY + dy);
      await page.waitForTimeout(50 + Math.random() * 50);
    }

    // Release
    await page.mouse.up();

    // Wait for result
    await page.waitForTimeout(2000);

    // Check success
    const stillThere = await button.count() > 0;

    if (!stillThere) {
      logger.info("✅ Advanced attempt succeeded!");
      return true;
    } else {
      logger.warn("❌ Even advanced attempt failed");
      logger.info("Modern CAPTCHAs analyze too many signals");
      logger.info("Human solving or commercial service required");
      return false;
    }

  } catch (error: any) {
    logger.error("Advanced attempt error:", error);
    return false;
  }
}

/**
 * Reality check function
 */
export function whyClaudeCantSolveCaptcha(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                Why Claude Can't Solve CAPTCHAs                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  CAPTCHAs analyze 100+ signals to detect bots:                  ║
║                                                                  ║
║  ❌ Mouse Movement Pattern                                      ║
║     • Humans: Imperfect curves, micro-tremors                   ║
║     • Bots: Perfect mathematical curves                         ║
║                                                                  ║
║  ❌ Timing Analysis                                             ║
║     • Humans: Variable reaction times (100-500ms)               ║
║     • Bots: Consistent timing                                   ║
║                                                                  ║
║  ❌ Behavioral Biometrics                                       ║
║     • Humans: Pressure variations, acceleration curves          ║
║     • Bots: Uniform digital signals                             ║
║                                                                  ║
║  ❌ Browser Fingerprinting                                      ║
║     • navigator.webdriver = true (exposed!)                     ║
║     • Missing plugins, canvas fingerprint mismatch              ║
║     • Automation framework signatures                           ║
║                                                                  ║
║  ❌ Machine Learning Models                                     ║
║     • Trained on millions of bot attempts                       ║
║     • Detect patterns humans can't even see                     ║
║     • 99.9%+ accuracy in detecting automation                   ║
║                                                                  ║
║  ✅ What Works:                                                 ║
║     • Real humans (you!)                                        ║
║     • 2Captcha/Anti-Captcha (real human solvers)               ║
║     • Nothing else reliably works                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

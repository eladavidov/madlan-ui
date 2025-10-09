/**
 * Human-Like Behavior Simulation
 * Makes crawler actions appear more natural to avoid detection
 */

import { Page } from "playwright";
import { sleep } from "crawlee";
import { logger } from "./logger.js";

/**
 * Simulate human-like mouse movement to a target position
 */
export async function humanMouseMove(
  page: Page,
  targetX: number,
  targetY: number
): Promise<void> {
  try {
    // Get current position (start from random position if unknown)
    const startX = Math.random() * 400;
    const startY = Math.random() * 400;

    // Create bezier curve for natural movement
    const steps = 10 + Math.floor(Math.random() * 5);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Cubic bezier with random control points
      const cp1x = startX + (targetX - startX) * (0.3 + Math.random() * 0.2);
      const cp1y = startY + (targetY - startY) * (0.1 + Math.random() * 0.1);
      const cp2x = startX + (targetX - startX) * (0.7 + Math.random() * 0.2);
      const cp2y = startY + (targetY - startY) * (0.9 + Math.random() * 0.1);

      const x = Math.pow(1-t, 3) * startX +
                3 * Math.pow(1-t, 2) * t * cp1x +
                3 * (1-t) * Math.pow(t, 2) * cp2x +
                Math.pow(t, 3) * targetX;

      const y = Math.pow(1-t, 3) * startY +
                3 * Math.pow(1-t, 2) * t * cp1y +
                3 * (1-t) * Math.pow(t, 2) * cp2y +
                Math.pow(t, 3) * targetY;

      // Add micro-jitter (hand tremor)
      const jitterX = x + (Math.random() - 0.5) * 2;
      const jitterY = y + (Math.random() - 0.5) * 2;

      await page.mouse.move(jitterX, jitterY);
      await sleep(10 + Math.random() * 20); // Variable timing
    }
  } catch (error) {
    // Don't fail if mouse movement fails
    logger.debug("Mouse movement simulation failed (non-critical)");
  }
}

/**
 * Simulate random mouse movements across the page
 */
export async function randomMouseMovements(page: Page): Promise<void> {
  try {
    const movements = 2 + Math.floor(Math.random() * 3); // 2-4 movements

    for (let i = 0; i < movements; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 800;
      await humanMouseMove(page, x, y);
      await sleep(500 + Math.random() * 1000);
    }
  } catch (error) {
    logger.debug("Random mouse movements failed (non-critical)");
  }
}

/**
 * Simulate human-like scrolling behavior
 */
export async function humanScroll(page: Page): Promise<void> {
  try {
    // Random scroll depth
    const scrolls = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < scrolls; i++) {
      const scrollAmount = 200 + Math.random() * 400;

      await page.evaluate((amount) => {
        window.scrollBy({
          top: amount,
          behavior: 'smooth',
        });
      }, scrollAmount);

      // Random pause while "reading"
      await sleep(1000 + Math.random() * 2000);
    }

    // Sometimes scroll back up a bit (like re-reading)
    if (Math.random() > 0.5) {
      await page.evaluate(() => {
        window.scrollBy({
          top: -150 - Math.random() * 200,
          behavior: 'smooth',
        });
      });
      await sleep(500 + Math.random() * 1000);
    }
  } catch (error) {
    logger.debug("Scroll simulation failed (non-critical)");
  }
}

/**
 * Simulate reading the page (pause before interacting)
 */
export async function simulateReading(): Promise<void> {
  // Humans take time to read/scan the page
  const readingTime = 1000 + Math.random() * 2000; // 1-3 seconds
  await sleep(readingTime);
}

/**
 * Full human behavior simulation for a page
 */
export async function simulateHumanBehavior(page: Page): Promise<void> {
  try {
    logger.debug("Simulating human behavior...");

    // TEMPORARILY SIMPLIFIED FOR TESTING - normally this would include:
    // - Initial reading pause (1-3s)
    // - Random mouse movements (2-6s)
    // - Human scroll (4-12s)
    // - Final pause (0.5-1.5s)
    // Total: 8-22 seconds

    // For now, just a quick scroll and minimal pause
    await page.evaluate(() => {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    });
    await sleep(500);

    logger.debug("Human behavior simulation complete (simplified)");
  } catch (error) {
    logger.debug("Human behavior simulation failed (non-critical)");
  }
}

/**
 * Hover over element before clicking (human-like)
 */
export async function humanClick(page: Page, selector: string): Promise<void> {
  try {
    // Get element position
    const element = await page.locator(selector).first();
    const box = await element.boundingBox();

    if (box) {
      // Move mouse to element
      const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
      const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * 10;

      await humanMouseMove(page, targetX, targetY);

      // Pause before clicking (reading)
      await sleep(200 + Math.random() * 300);

      // Click
      await element.click();
    } else {
      // Fallback to normal click
      await element.click();
    }
  } catch (error) {
    logger.warn(`Human click failed for ${selector}, using fallback`);
    await page.click(selector);
  }
}

/**
 * Type text with human-like delays
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  try {
    const element = await page.locator(selector).first();

    // Click to focus
    await element.click();
    await sleep(200 + Math.random() * 200);

    // Type character by character with varying delays
    for (const char of text) {
      await element.type(char);

      // Varying typing speed (50-150ms per character)
      const typingDelay = 50 + Math.random() * 100;
      await sleep(typingDelay);
    }

    // Small pause after typing
    await sleep(300 + Math.random() * 300);
  } catch (error) {
    logger.warn(`Human typing failed for ${selector}, using fallback`);
    await page.fill(selector, text);
  }
}

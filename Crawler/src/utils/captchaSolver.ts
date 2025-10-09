/**
 * CAPTCHA Solver
 * Integrates with CAPTCHA solving services
 */

import { Page } from "playwright";
import { logger } from "./logger.js";

export interface CaptchaSolverOptions {
  service: "2captcha" | "anticaptcha" | "capsolver";
  apiKey: string;
  timeout?: number;
}

export class CaptchaSolver {
  private options: CaptchaSolverOptions;

  constructor(options: CaptchaSolverOptions) {
    this.options = options;
  }

  /**
   * Detect if CAPTCHA is present on page
   */
  async isCaptchaPresent(page: Page): Promise<boolean> {
    // Check for "Press & Hold" CAPTCHA
    const pressAndHold = await page.locator('text="Press & Hold"').count();
    if (pressAndHold > 0) return true;

    // Check for other CAPTCHA indicators
    const captchaFrame = await page.locator('iframe[src*="captcha"]').count();
    if (captchaFrame > 0) return true;

    // Check for PerimeterX challenge
    const perimeterX = await page.locator('[class*="px-captcha"]').count();
    if (perimeterX > 0) return true;

    return false;
  }

  /**
   * Solve CAPTCHA using configured service
   */
  async solveCaptcha(page: Page): Promise<boolean> {
    try {
      logger.info("CAPTCHA detected, attempting to solve...");

      const url = page.url();
      const siteKey = await this.extractSiteKey(page);

      if (!siteKey) {
        logger.error("Could not extract CAPTCHA site key");
        return false;
      }

      switch (this.options.service) {
        case "2captcha":
          return await this.solve2Captcha(page, url, siteKey);
        case "anticaptcha":
          return await this.solveAntiCaptcha(page, url, siteKey);
        case "capsolver":
          return await this.solveCapSolver(page, url, siteKey);
        default:
          logger.error(`Unknown CAPTCHA service: ${this.options.service}`);
          return false;
      }
    } catch (error: any) {
      logger.error("CAPTCHA solving failed:", error);
      return false;
    }
  }

  /**
   * Extract CAPTCHA site key from page
   */
  private async extractSiteKey(page: Page): Promise<string | null> {
    try {
      // Try to find site key in page source
      const siteKey = await page.evaluate(() => {
        // Look for common CAPTCHA site key patterns
        const scripts = Array.from(document.querySelectorAll("script"));
        for (const script of scripts) {
          const content = script.textContent || "";

          // PerimeterX/HUMAN pattern
          const pxMatch = content.match(/appId["']?\s*:\s*["']([^"']+)["']/);
          if (pxMatch) return pxMatch[1];

          // reCAPTCHA pattern
          const recaptchaMatch = content.match(/sitekey["']?\s*:\s*["']([^"']+)["']/);
          if (recaptchaMatch) return recaptchaMatch[1];
        }

        // Check data attributes
        const captchaElement = document.querySelector('[data-sitekey]');
        if (captchaElement) {
          return captchaElement.getAttribute('data-sitekey');
        }

        return null;
      });

      return siteKey;
    } catch (error) {
      return null;
    }
  }

  /**
   * Solve using 2Captcha service
   */
  private async solve2Captcha(page: Page, url: string, siteKey: string): Promise<boolean> {
    // Implementation would use 2captcha API
    // https://2captcha.com/2captcha-api

    logger.info("Sending CAPTCHA to 2Captcha...");

    const response = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: this.options.apiKey,
        method: "userrecaptcha",
        googlekey: siteKey,
        pageurl: url,
        json: "1",
      }),
    });

    const submitResult = await response.json();

    if (submitResult.status !== 1) {
      logger.error("2Captcha submission failed:", submitResult);
      return false;
    }

    const requestId = submitResult.request;
    logger.info(`2Captcha task submitted: ${requestId}`);

    // Poll for solution
    const timeout = this.options.timeout || 120000; // 2 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const resultResponse = await fetch(
        `https://2captcha.com/res.php?key=${this.options.apiKey}&action=get&id=${requestId}&json=1`
      );
      const result = await resultResponse.json();

      if (result.status === 1) {
        // Got solution
        logger.info("CAPTCHA solved successfully");
        const solution = result.request;

        // Inject solution into page
        await page.evaluate((token) => {
          const callback = (window as any).captchaCallback ||
                          (window as any).onCaptchaSuccess;
          if (callback) callback(token);
        }, solution);

        return true;
      } else if (result.request === "CAPCHA_NOT_READY") {
        // Still processing
        continue;
      } else {
        // Error
        logger.error("2Captcha error:", result);
        return false;
      }
    }

    logger.error("2Captcha timeout");
    return false;
  }

  /**
   * Solve using Anti-Captcha service
   */
  private async solveAntiCaptcha(_page: Page, _url: string, _siteKey: string): Promise<boolean> {
    // Similar implementation for Anti-Captcha
    // https://anti-captcha.com/apidoc
    logger.warn("Anti-Captcha integration not yet implemented");
    return false;
  }

  /**
   * Solve using CapSolver service
   * CapSolver specializes in PerimeterX/HUMAN Security
   * https://docs.capsolver.com/
   */
  private async solveCapSolver(page: Page, url: string, _siteKey: string): Promise<boolean> {
    logger.info("Sending CAPTCHA to CapSolver (PerimeterX)...");

    try {
      // For PerimeterX, we need to send the cookies and page URL
      const cookies = await page.context().cookies();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      // Create task using CapSolver API
      const createTaskResponse = await fetch("https://api.capsolver.com/createTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey: this.options.apiKey,
          task: {
            type: "AntiTurnstileTaskProxyLess", // PerimeterX falls under this category
            websiteURL: url,
            websiteKey: "", // Not always needed for PerimeterX
            metadata: {
              type: "perimeterx",
              cookies: cookies.map(c => `${c.name}=${c.value}`).join("; "),
              userAgent: userAgent,
            },
          },
        }),
      });

      const createResult = await createTaskResponse.json();

      if (createResult.errorId !== 0) {
        logger.error("CapSolver task creation failed:", createResult);
        return false;
      }

      const taskId = createResult.taskId;
      logger.info(`CapSolver task created: ${taskId}`);

      // Poll for solution
      const timeout = this.options.timeout || 120000;
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

        const resultResponse = await fetch("https://api.capsolver.com/getTaskResult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientKey: this.options.apiKey,
            taskId: taskId,
          }),
        });

        const result = await resultResponse.json();

        if (result.errorId !== 0) {
          logger.error("CapSolver error:", result);
          return false;
        }

        if (result.status === "ready") {
          // Got solution
          logger.info("✅ CapSolver solved CAPTCHA successfully");

          // For PerimeterX, the solution might contain cookies or tokens
          const solution = result.solution;

          // Try to inject solution
          if (solution.token) {
            await page.evaluate((token) => {
              // Try common callback patterns
              const callbacks = [
                (window as any).captchaCallback,
                (window as any).onCaptchaSuccess,
                (window as any)._pxOnCaptchaSuccess,
              ];
              for (const cb of callbacks) {
                if (typeof cb === 'function') {
                  cb(token);
                  return;
                }
              }
            }, solution.token);
          }

          // If solution includes cookies, add them
          if (solution.cookies) {
            for (const cookie of solution.cookies) {
              await page.context().addCookies([cookie]);
            }
          }

          // Wait a moment for page to process solution
          await page.waitForTimeout(2000);

          // Refresh page to apply solution
          await page.reload({ waitUntil: "domcontentloaded" });

          return true;

        } else if (result.status === "processing") {
          // Still processing
          logger.debug("CapSolver still processing...");
          continue;
        } else {
          // Unknown status
          logger.warn(`Unknown CapSolver status: ${result.status}`);
          return false;
        }
      }

      logger.error("CapSolver timeout after 2 minutes");
      return false;

    } catch (error: any) {
      logger.error("CapSolver API error:", error);
      return false;
    }
  }
}

/**
 * Create CAPTCHA solver from config
 */
export function createCaptchaSolver(): CaptchaSolver | null {
  const service = process.env.CAPTCHA_SERVICE as any;
  const apiKey = process.env.CAPTCHA_API_KEY;

  if (!service || !apiKey) {
    logger.warn("CAPTCHA solver not configured");
    return null;
  }

  return new CaptchaSolver({
    service,
    apiKey,
    timeout: parseInt(process.env.CAPTCHA_TIMEOUT || "120000", 10),
  });
}

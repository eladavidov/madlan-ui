/**
 * Panel Expansion Utility
 * Handles expanding collapsed sections, accordions, and "show more" buttons
 * Used for extracting data from dynamic panels on Madlan property pages
 */

import type { Page } from "playwright";

/**
 * Expand all collapsible panels on the page
 * Finds and clicks all expandable elements (buttons, divs with click handlers, etc.)
 */
export async function expandAllPanels(page: Page): Promise<number> {
  try {
    let expandedCount = 0;

    // Strategy 1: Find "show more" / "הצג עוד" buttons
    const showMoreButtons = await page.$$('button:has-text("הצג עוד"), button:has-text("ראה עוד"), button:has-text("עוד")');
    for (const button of showMoreButtons) {
      try {
        await button.click({ timeout: 2000 });
        await page.waitForTimeout(500); // Wait for animation
        expandedCount++;
      } catch (error) {
        // Button might not be clickable or already expanded
      }
    }

    // Strategy 2: Find elements with aria-expanded="false"
    const ariaCollapsed = await page.$$('[aria-expanded="false"]');
    for (const element of ariaCollapsed) {
      try {
        await element.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        expandedCount++;
      } catch (error) {
        // Element might not be clickable
      }
    }

    // Strategy 3: Find accordion headers with common classes
    const accordionHeaders = await page.$$('[class*="accordion"], [class*="collaps"], [class*="expand"]');
    for (const header of accordionHeaders) {
      try {
        // Check if it's clickable and not already expanded
        const isExpanded = await header.getAttribute('aria-expanded');
        if (isExpanded === 'false') {
          await header.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          expandedCount++;
        }
      } catch (error) {
        // Element might not be expandable
      }
    }

    return expandedCount;
  } catch (error) {
    console.warn('Error expanding panels:', error);
    return 0;
  }
}

/**
 * Expand a specific panel by its heading text
 * Searches for heading elements containing the text and expands the associated panel
 */
export async function expandPanelByText(page: Page, headingText: string): Promise<boolean> {
  try {
    // Strategy 1: Look for heading elements (h2, h3, h4) with the text
    const headings = ['h2', 'h3', 'h4', 'div[class*="heading"]', 'div[class*="title"]'];

    for (const headingSelector of headings) {
      const heading = await page.locator(headingSelector).filter({ hasText: headingText }).first();

      if (await heading.count() > 0) {
        // Try clicking the heading itself
        try {
          await heading.click({ timeout: 2000 });
          await page.waitForTimeout(500);
          return true;
        } catch (error) {
          // Heading might not be clickable, try parent
        }

        // Try finding a button near the heading
        try {
          const parentSection = heading.locator('..').first();
          const expandButton = parentSection.locator('button, [role="button"], [aria-expanded]').first();
          if (await expandButton.count() > 0) {
            await expandButton.click({ timeout: 2000 });
            await page.waitForTimeout(500);
            return true;
          }
        } catch (error) {
          // No button found
        }
      }
    }

    // Strategy 2: Look for any element containing the text that might be clickable
    const element = await page.locator(`text=${headingText}`).first();
    if (await element.count() > 0) {
      try {
        await element.click({ timeout: 2000 });
        await page.waitForTimeout(500);
        return true;
      } catch (error) {
        // Element not clickable
      }
    }

    return false;
  } catch (error) {
    console.warn(`Error expanding panel with text "${headingText}":`, error);
    return false;
  }
}

/**
 * Wait for panel content to load after expansion
 * Useful for panels that load content via AJAX
 */
export async function waitForPanelContent(
  page: Page,
  selector: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, {
      state: 'visible',
      timeout: timeoutMs
    });

    // Additional wait for content to settle
    await page.waitForTimeout(500);

    return true;
  } catch (error) {
    console.warn(`Timeout waiting for panel content: ${selector}`);
    return false;
  }
}

/**
 * Expand a specific panel and wait for its content
 * Combines expandPanelByText and waitForPanelContent
 */
export async function expandAndWaitForPanel(
  page: Page,
  headingText: string,
  contentSelector?: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  // Try to expand the panel
  const expanded = await expandPanelByText(page, headingText);

  if (!expanded) {
    return false;
  }

  // If content selector provided, wait for it
  if (contentSelector) {
    return await waitForPanelContent(page, contentSelector, timeoutMs);
  }

  return true;
}

/**
 * Check if a panel is already expanded
 */
export async function isPanelExpanded(page: Page, headingText: string): Promise<boolean> {
  try {
    // Look for elements with aria-expanded attribute near the heading
    const heading = await page.locator(`text=${headingText}`).first();

    if (await heading.count() === 0) {
      return false;
    }

    // Check if heading or nearby elements have aria-expanded="true"
    const parentSection = heading.locator('..').first();
    const expandedElement = parentSection.locator('[aria-expanded="true"]').first();

    return (await expandedElement.count()) > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Scroll element into view before interacting
 * Useful for panels that are below the fold
 */
export async function scrollIntoView(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).first().scrollIntoViewIfNeeded({ timeout: 3000 });
    await page.waitForTimeout(300); // Wait for scroll to complete
    return true;
  } catch (error) {
    console.warn(`Error scrolling to element: ${selector}`);
    return false;
  }
}

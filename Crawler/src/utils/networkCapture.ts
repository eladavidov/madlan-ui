/**
 * Network Request Capture
 * Captures API responses from Madlan while page loads
 */

import { Page } from "playwright";
import { logger } from "./logger.js";

export interface CapturedApiData {
  properties: any[];
  totalResults?: number;
  rawResponses: any[];
}

/**
 * Capture API responses while page loads
 */
export async function captureApiResponses(page: Page): Promise<CapturedApiData> {
  const apiResponses: any[] = [];

  // Listen for responses
  page.on('response', async (response) => {
    const url = response.url();

    // Capture API2 and API3 responses
    if (url.includes('/api2') || url.includes('/api3')) {
      try {
        const json = await response.json();
        apiResponses.push({
          url,
          status: response.status(),
          data: json
        });

        logger.debug(`Captured API response from ${url}`);
      } catch (e) {
        // Not JSON or failed to parse
      }
    }
  });

  return {
    properties: [],
    rawResponses: apiResponses
  };
}

/**
 * Extract properties from captured API responses
 */
export function extractPropertiesFromApiResponses(captured: CapturedApiData): any[] {
  const properties: any[] = [];

  for (const response of captured.rawResponses) {
    // Parse response structure (to be determined from actual data)
    const data = response.data;

    // Common patterns in API responses
    if (data?.results) {
      properties.push(...data.results);
    } else if (data?.data) {
      if (Array.isArray(data.data)) {
        properties.push(...data.data);
      } else if (data.data?.results) {
        properties.push(...data.data.results);
      }
    } else if (Array.isArray(data)) {
      properties.push(...data);
    }
  }

  return properties;
}

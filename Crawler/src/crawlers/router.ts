/**
 * Crawler Router
 * Routes URLs to appropriate crawler based on URL pattern
 */

/**
 * Determine if URL is a search results page
 */
export function isSearchPage(url: string): boolean {
  // Search pages: https://www.madlan.co.il/for-sale/{city}
  return /madlan\.co\.il\/(for-sale|למכירה)/i.test(url);
}

/**
 * Determine if URL is a property detail page
 */
export function isPropertyPage(url: string): boolean {
  // Property pages: https://www.madlan.co.il/listings/{id} or /bulletin/{id}
  return /madlan\.co\.il\/(listings|bulletin)\//i.test(url);
}

/**
 * Extract property ID from URL
 */
export function extractPropertyId(url: string): string | null {
  const match = url.match(/\/(listings|bulletin)\/([^/?]+)/);
  return match ? match[2] : null;
}

/**
 * Extract city from search URL
 */
export function extractCity(url: string): string | null {
  const match = url.match(/\/(for-sale|למכירה)\/([^/?]+)/);
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Build search URL for a city
 */
export function buildSearchUrl(city: string): string {
  return `https://www.madlan.co.il/for-sale/${encodeURIComponent(city)}`;
}

/**
 * Build property URL from ID
 */
export function buildPropertyUrl(propertyId: string): string {
  return `https://www.madlan.co.il/listings/${propertyId}`;
}

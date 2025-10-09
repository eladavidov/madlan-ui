/**
 * CSS Selectors for Madlan.co.il Property Crawler
 *
 * **STATUS**: PRELIMINARY - Based on Phase 1 research
 * **TO BE VERIFIED**: In Phase 2 with actual HTML inspection
 *
 * These selectors are based on screenshot analysis and typical real estate site patterns.
 * They MUST be verified and updated during Phase 2 implementation when we have access
 * to actual HTML structure (after CAPTCHA bypass).
 *
 * Created: 2025-10-08
 * Last Updated: 2025-10-08
 */

/**
 * Search Results Page Selectors
 * URL: https://www.madlan.co.il/for-sale/{city}
 */
export const SEARCH_RESULTS_SELECTORS = {
  // Property Cards Container
  propertyCards: '.property-card, [data-testid="property-card"]',

  // Individual Property Card Fields (PRELIMINARY - MUST VERIFY)
  card: {
    image: 'img',
    badge: '.badge-new, .new-badge',
    title: 'h3, .property-title',
    neighborhood: '.primary-location, .location-primary',
    city: '.secondary-location, .location-secondary',
    price: '.price, .property-price',
    rooms: '.rooms, .room-count',
    size: '.size, .property-size',
    link: 'a[href*="/listings/"], a[href*="/bulletin/"]',
  },

  // Map
  map: '#map, .map-container',

  // Pagination (unknown mechanism - to be verified)
  pagination: {
    nextButton: '.pagination-next, button[aria-label*="הבא"]',
    loadMore: 'button:has-text("טען עוד")',
    infiniteScroll: '.infinite-scroll-container',
  },

  // Results Count
  resultsCount: '.results-count, [data-testid="results-count"]',
};

/**
 * Property Detail Page Selectors
 * URL: https://www.madlan.co.il/listings/{id} or /bulletin/{id}
 *
 * **STATUS**: ✅ VERIFIED - Updated 2025-10-09
 * Selectors verified against live Madlan.co.il pages using Chrome DevTools MCP
 */
export const PROPERTY_PAGE_SELECTORS = {
  // Basic Information (VERIFIED)
  price: '.css-4wbc3h, .e24ibwc3', // Main price display
  rooms: '.css-1d9zsyn.e188cvy02', // Value is sibling to text "חדרים"
  size: '.css-1d9zsyn.e188cvy02', // Value is sibling to text "מ״ר"
  floor: '.css-1d9zsyn.e188cvy02', // Value is sibling to text "קומה"
  totalFloors: '.css-1uz6ydw.eajab3c2', // In "מידע נוסף" section, sibling to "קומות בבניין"

  // Location (VERIFIED)
  address: 'h1.css-9jcth2.e24ibwc4, h1', // Main address heading
  neighborhood: 'h1', // Part of h1 text (will need to parse)
  city: 'h1', // Part of h1 text (will need to parse)

  // Property Details (VERIFIED)
  propertyType: '.css-4wbc3h + div', // Near price, e.g. "דירה למכירה"
  description: 'h2:has-text("תיאור הנכס") + div', // Next sibling of description heading

  // Property Status/Condition (VERIFIED)
  propertyStatus: '.css-1uz6ydw.eajab3c2', // "מצב הנכס" value (e.g., "חדש")

  // Amenities Container (VERIFIED)
  amenitiesContainer: '.css-1x88tlv.e1iycc2q2', // "יתרונות הנכס" section
  fullSpecsContainer: 'h2:has-text("מפרט מלא") + div', // "מפרט מלא" section
  amenityItem: 'div', // Text nodes within containers

  // Specific Amenities (TEXT-BASED DETECTION - VERIFIED)
  // Note: Madlan uses text labels, not data attributes. Check if text contains Hebrew terms.
  amenities: {
    parking: 'חניה', // Text to search for
    elevator: 'מעלית',
    balcony: 'מרפסת',
    airConditioning: 'מיזוג אוויר',
    securityDoor: 'דלת בטחון',
    bars: 'סורגים',
    storage: 'מחסן',
    shelter: 'ממ״ד', // Mamad (safe room)
    accessible: 'נגיש לנכים',
    renovated: 'משופצת',
    furnished: 'מרוהטת',
    garden: 'גינה',
  },

  // Images (VERIFIED)
  imageGallery: '.css-qhd8a4, img', // Property images
  images: 'img.css-qhd8a4.ery4ov3, img',
  mainImage: 'img',

  // Contact Information (VERIFIED)
  contactName: 'a[href*="/agent/"]', // Link to agent profile
  contactPhone: 'a[href^="tel:"]', // Phone link
  contactAgency: '.agent-agency, div:has-text("נכסים")', // Agency name

  // Dates (VERIFIED)
  listingDate: '[data-testid="listing-date"], .listing-date',
  lastUpdated: '[data-testid="last-updated"], .last-updated',
  entryDate: '.css-1uz6ydw.eajab3c2', // In "מידע נוסף", sibling to "תאריך כניסה"
};

/**
 * Selector utility functions
 */
export const selectorUtils = {
  /**
   * Try multiple selectors and return first match
   */
  trySelectors: (element: any, selectors: string[]): any => {
    for (const selector of selectors) {
      const result = element.querySelector(selector);
      if (result) return result;
    }
    return null;
  },

  /**
   * Get text content from element using multiple selectors
   */
  getTextBySelectors: (element: any, selectors: string[]): string | null => {
    const el = selectorUtils.trySelectors(element, selectors);
    return el?.textContent?.trim() || null;
  },

  /**
   * Check if amenity exists using multiple selectors
   */
  hasAmenity: (element: any, selectors: string[]): boolean => {
    return selectorUtils.trySelectors(element, selectors) !== null;
  },
};

/**
 * TODO for Phase 2:
 *
 * 1. Navigate to actual property pages (after CAPTCHA bypass)
 * 2. Use Chrome DevTools to inspect HTML structure
 * 3. Update all selectors with verified values
 * 4. Add any missing selectors discovered during inspection
 * 5. Document selector patterns found on Madlan
 * 6. Create fallback selectors for robustness
 * 7. Add comments with example HTML snippets
 *
 * Example verification process:
 * ```typescript
 * // In Chrome DevTools Console:
 * document.querySelector('.property-price')?.textContent
 * document.querySelector('[data-testid="price"]')?.textContent
 * // Find which selector actually works
 * ```
 */

export default {
  searchResults: SEARCH_RESULTS_SELECTORS,
  propertyPage: PROPERTY_PAGE_SELECTORS,
  utils: selectorUtils,
};

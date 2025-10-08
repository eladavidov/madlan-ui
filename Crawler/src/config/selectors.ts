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
 * **CRITICAL**: These selectors are ENTIRELY PRELIMINARY
 * Based on typical real estate site structure patterns
 * MUST be verified in Phase 2
 */
export const PROPERTY_PAGE_SELECTORS = {
  // Basic Information
  price: '[data-testid="price"], .property-price, .price-value',
  rooms: '[data-testid="rooms"], .room-count, .rooms-value',
  size: '[data-testid="size"], .property-size, .size-value',
  floor: '[data-testid="floor"], .floor-number, .floor-value',
  totalFloors: '[data-testid="total-floors"], .total-floors',

  // Location
  address: '[data-testid="address"], .property-address, .address-value',
  neighborhood: '[data-testid="neighborhood"], .neighborhood, .neighborhood-value',
  city: '[data-testid="city"], .city, .city-value',

  // Property Details
  propertyType: '[data-testid="property-type"], .property-type, .type-value',
  description: '[data-testid="description"], .property-description, .description-content',

  // Amenities Container
  amenitiesContainer: '[data-testid="amenities"], .amenities, .property-amenities',
  amenityItem: '.amenity-item, .amenity-badge, [data-amenity]',

  // Specific Amenities (boolean checks)
  amenities: {
    parking: '[data-amenity="parking"], .amenity-parking',
    elevator: '[data-amenity="elevator"], .amenity-elevator',
    balcony: '[data-amenity="balcony"], .amenity-balcony',
    airConditioning: '[data-amenity="ac"], .amenity-ac',
    securityDoor: '[data-amenity="security-door"], .amenity-security',
    bars: '[data-amenity="bars"], .amenity-bars',
    storage: '[data-amenity="storage"], .amenity-storage',
    shelter: '[data-amenity="shelter"], .amenity-shelter, .amenity-mamad',
    accessible: '[data-amenity="accessible"], .amenity-accessible',
    renovated: '[data-amenity="renovated"], .amenity-renovated',
    furnished: '[data-amenity="furnished"], .amenity-furnished',
  },

  // Images
  imageGallery: '.image-gallery, [data-testid="gallery"], .property-gallery',
  images: '.gallery-image, img[data-gallery-image], .gallery img',
  mainImage: '.main-image, img[data-main-image]',

  // Contact Information
  contactName: '[data-testid="contact-name"], .contact-name, .agent-name',
  contactPhone: '[data-testid="contact-phone"], .contact-phone, .phone-number',
  contactAgency: '[data-testid="agency"], .agency-name, .agent-agency',

  // Dates
  listingDate: '[data-testid="listing-date"], .listing-date',
  lastUpdated: '[data-testid="last-updated"], .last-updated',
  entryDate: '[data-testid="entry-date"], .entry-date',
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

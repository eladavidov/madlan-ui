/**
 * Property Data Extractor
 * Extracts property data from Madlan property pages
 */

import type { Page } from "playwright";
import type { PropertyInput } from "../models/Property.js";
import { PROPERTY_PAGE_SELECTORS } from "../config/selectors.js";

/**
 * Extract property data from a property detail page
 */
export async function extractPropertyData(
  page: Page,
  url: string
): Promise<PropertyInput | null> {
  try {
    // Extract property ID from URL
    // URL format: https://www.madlan.co.il/listings/{id} or /bulletin/{id}
    const urlMatch = url.match(/\/(listings|bulletin)\/([^/?]+)/);
    if (!urlMatch) {
      console.error("Could not extract property ID from URL:", url);
      return null;
    }

    const propertyId = urlMatch[2];

    // Extract price
    const price = await extractNumber(page, PROPERTY_PAGE_SELECTORS.price);

    // Extract rooms, floor, size (context-based - same CSS class but different labels)
    const rooms = await extractNumberByLabel(page, 'חדרים');
    const floor = await extractNumberByLabel(page, 'קומה');
    const size = await extractNumberByLabel(page, 'מ״ר');
    const totalFloors = await extractNumberByLabel(page, 'קומות בבניין');

    // Extract enhanced property metrics (Phase 5B)
    const pricePerSqm = await extractNumberByLabel(page, 'מחיר למ״ר');
    const expectedYield = await extractNumberByLabel(page, 'תשואה');

    // Extract address (H1 contains full location)
    const addressFull = await extractText(page, PROPERTY_PAGE_SELECTORS.address);
    // Parse address: "רענן , כרמל ותיק, חיפה" -> street, neighborhood, city
    const addressParts = addressFull?.split(',').map(s => s.trim()) || [];
    const address = addressParts[0] || null;
    const neighborhood = addressParts[1] || null;
    const city = addressParts[2] || addressParts[addressParts.length - 1] || 'חיפה';

    // Extract property type
    const propertyTypeRaw = await extractText(page, PROPERTY_PAGE_SELECTORS.propertyType);

    // Extract description
    const description = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2')).find(h2 =>
        h2.textContent?.includes('תיאור הנכס')
      );
      return heading?.nextElementSibling?.textContent?.trim() || null;
    });

    // Extract neighborhood description (Phase 5B: "החיים בשכונה")
    const neighborhoodDescription = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2, h3')).find(h =>
        h.textContent?.includes('החיים בשכונה')
      );
      if (!heading) return null;

      // Try to find the description text (usually in next sibling or nearby element)
      const nextElement = heading.nextElementSibling;
      if (nextElement) {
        const text = nextElement.textContent?.trim();
        if (text && text.length > 20) { // Minimum length for valid description
          return text;
        }
      }

      // Try parent's next sibling
      const parentNext = heading.parentElement?.nextElementSibling;
      if (parentNext) {
        const text = parentNext.textContent?.trim();
        if (text && text.length > 20) {
          return text;
        }
      }

      return null;
    });

    // Extract map coordinates (Phase 5B)
    const coordinates = await page.evaluate(() => {
      try {
        // Method 1: Check for Mapbox map data attributes or embedded data
        const mapContainer = document.querySelector('[class*="map"], [class*="Map"]');
        if (mapContainer) {
          const dataLat = mapContainer.getAttribute('data-lat') || mapContainer.getAttribute('data-latitude');
          const dataLng = mapContainer.getAttribute('data-lng') || mapContainer.getAttribute('data-longitude');
          if (dataLat && dataLng) {
            return {
              latitude: parseFloat(dataLat),
              longitude: parseFloat(dataLng)
            };
          }
        }

        // Method 2: Check for embedded JSON data (common pattern in SPAs)
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const content = script.textContent || '';
          // Look for latitude/longitude patterns in JSON
          const latMatch = content.match(/"latitude"\s*:\s*([\d.]+)/i);
          const lngMatch = content.match(/"longitude"\s*:\s*([\d.]+)/i);
          if (latMatch && lngMatch) {
            const lat = parseFloat(latMatch[1]);
            const lng = parseFloat(lngMatch[1]);
            // Validate coordinates are in Israel's approximate range
            if (lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36) {
              return { latitude: lat, longitude: lng };
            }
          }
        }

        return { latitude: null, longitude: null };
      } catch (error) {
        return { latitude: null, longitude: null };
      }
    });

    // Extract amenities (text-based detection)
    const hasParking = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.parking);
    const hasElevator = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.elevator);
    const hasBalcony = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.balcony);
    const hasAirConditioning = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.airConditioning);
    const hasSecurityDoor = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.securityDoor);
    const hasBars = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.bars);
    const hasStorage = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.storage);
    const hasShelter = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.shelter);
    const isAccessible = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.accessible);
    const isRenovated = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.renovated);
    const isFurnished = await checkTextExists(page, PROPERTY_PAGE_SELECTORS.amenities.furnished);

    // Extract contact info
    const contactName = await extractText(page, PROPERTY_PAGE_SELECTORS.contactName);
    const contactPhone = await extractText(page, PROPERTY_PAGE_SELECTORS.contactPhone);
    const contactAgency = await extractText(page, PROPERTY_PAGE_SELECTORS.contactAgency);

    // Extract dates
    const listingDate = await extractText(page, PROPERTY_PAGE_SELECTORS.listingDate);
    const entryDate = await extractText(page, PROPERTY_PAGE_SELECTORS.entryDate);

    // Build property object
    const property: PropertyInput = {
      id: propertyId,
      url: url,
      city: city || "חיפה", // Default to Haifa if not found
      price: price ?? undefined,
      rooms: rooms ?? undefined,
      size: size ?? undefined,
      floor: floor ?? undefined,
      total_floors: totalFloors ?? undefined,
      // Phase 5B: Enhanced property metrics
      price_per_sqm: pricePerSqm ?? undefined,
      expected_yield: expectedYield ?? undefined,
      latitude: coordinates.latitude ?? undefined,
      longitude: coordinates.longitude ?? undefined,
      neighborhood_description: neighborhoodDescription ?? undefined,
      // End Phase 5B additions
      address: address ?? undefined,
      neighborhood: neighborhood ?? undefined,
      property_type: (propertyTypeRaw as any) ?? undefined,
      description: description ?? undefined,
      has_parking: hasParking ?? undefined,
      has_elevator: hasElevator ?? undefined,
      has_balcony: hasBalcony ?? undefined,
      has_air_conditioning: hasAirConditioning ?? undefined,
      has_security_door: hasSecurityDoor ?? undefined,
      has_bars: hasBars ?? undefined,
      has_storage: hasStorage ?? undefined,
      has_shelter: hasShelter ?? undefined,
      is_accessible: isAccessible ?? undefined,
      is_renovated: isRenovated ?? undefined,
      is_furnished: isFurnished ?? undefined,
      contact_name: contactName ?? undefined,
      contact_phone: contactPhone ?? undefined,
      contact_agency: contactAgency ?? undefined,
      listing_date: listingDate ?? undefined,
      entry_date: entryDate ?? undefined,
    };

    return property;
  } catch (error) {
    console.error("Error extracting property data:", error);
    return null;
  }
}

/**
 * Extract image URLs from property page
 */
export async function extractImageUrls(page: Page): Promise<string[]> {
  try {
    // Try to find all images in the gallery
    const images = await page.$$eval(
      PROPERTY_PAGE_SELECTORS.images,
      (imgs) => imgs.map((img) => (img as HTMLImageElement).src).filter(Boolean)
    );

    return images;
  } catch (error) {
    console.error("Error extracting images:", error);
    return [];
  }
}

/**
 * Helper: Extract text from element using CSS selector
 */
async function extractText(page: Page, selector: string): Promise<string | null> {
  try {
    // Split selector by comma (multiple selectors)
    const selectors = selector.split(",").map((s) => s.trim());

    for (const sel of selectors) {
      const element = await page.$(sel);
      if (element) {
        const text = await element.textContent();
        if (text) {
          return text.trim();
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Extract number from element (parse from text)
 */
async function extractNumber(page: Page, selector: string): Promise<number | null> {
  const text = await extractText(page, selector);
  if (!text) return null;

  // Remove non-numeric characters except decimal point
  const cleaned = text.replace(/[^\d.]/g, "");
  const number = parseFloat(cleaned);

  return isNaN(number) ? null : number;
}

/**
 * Helper: Check if text exists anywhere on page (for text-based amenities)
 */
async function checkTextExists(page: Page, searchText: string): Promise<boolean> {
  try {
    const found = await page.evaluate((text) => {
      return document.body.textContent?.includes(text) || false;
    }, searchText);
    return found;
  } catch (error) {
    return false;
  }
}

/**
 * Helper: Extract number by adjacent label text
 * Example: Find "5" next to "חדרים" (rooms)
 */
async function extractNumberByLabel(page: Page, labelText: string): Promise<number | null> {
  try {
    const value = await page.evaluate((label) => {
      // Find all elements
      const elements = Array.from(document.querySelectorAll('*'));

      // Find element with label text (exact match, no children)
      const labelEl = elements.find(el =>
        el.textContent?.trim() === label && el.children.length === 0
      );

      if (!labelEl) return null;

      // Strategy 1: Check next sibling first (value often comes after label in RTL)
      const nextSibling = labelEl.nextElementSibling;
      if (nextSibling && nextSibling.children.length === 0) {
        const text = nextSibling.textContent?.trim();
        // Validate it looks like a number
        if (text && /^\d+\.?\d*$/.test(text)) {
          return text;
        }
      }

      // Strategy 2: Check previous sibling
      const prevSibling = labelEl.previousElementSibling;
      if (prevSibling && prevSibling.children.length === 0) {
        const text = prevSibling.textContent?.trim();
        // Validate it looks like a number
        if (text && /^\d+\.?\d*$/.test(text)) {
          return text;
        }
      }

      // Strategy 3: Look in parent container for a sibling with specific class
      // Madlan uses .css-1d9zsyn.e188cvy02 for numeric values
      const parent = labelEl.parentElement;
      if (parent) {
        // First, try to find by specific class (more reliable)
        const valueWithClass = parent.querySelector('.css-1d9zsyn, .e188cvy02');
        if (valueWithClass && valueWithClass !== labelEl) {
          const text = valueWithClass.textContent?.trim();
          if (text && /^\d+\.?\d*$/.test(text)) {
            return text;
          }
        }

        // Fallback: Find first numeric child in parent (excluding label)
        // But only if parent has 2-3 children (to avoid picking random numbers)
        if (parent.children.length >= 2 && parent.children.length <= 3) {
          const valueEl = Array.from(parent.children).find(child =>
            child !== labelEl &&
            child.children.length === 0 &&
            /^\d+\.?\d*$/.test(child.textContent?.trim() || '')
          );
          if (valueEl) return valueEl.textContent?.trim() || null;
        }
      }

      return null;
    }, labelText);

    if (!value) return null;

    // Parse number
    const cleaned = value.replace(/[^\d.]/g, "");
    const number = parseFloat(cleaned);

    // Additional validation for specific fields to prevent wrong values
    if (labelText === 'חדרים') {
      // Rooms should be 0.5-20 (reasonable range)
      if (number < 0.5 || number > 20) {
        console.warn(`Suspicious rooms value: ${number} (expected 0.5-20)`);
        return null;
      }
    } else if (labelText === 'קומה') {
      // Floor should be -2 to 100 (basement to high-rise)
      if (number < -2 || number > 100) {
        console.warn(`Suspicious floor value: ${number} (expected -2 to 100)`);
        return null;
      }
    } else if (labelText === 'מ״ר') {
      // Size should be 10-1000 m² (reasonable apartment range)
      if (number < 10 || number > 1000) {
        console.warn(`Suspicious size value: ${number} (expected 10-1000)`);
        return null;
      }
    }

    return isNaN(number) ? null : number;
  } catch (error) {
    return null;
  }
}

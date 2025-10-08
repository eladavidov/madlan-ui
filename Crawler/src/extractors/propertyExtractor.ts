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

    // Extract basic fields
    const price = await extractNumber(page, PROPERTY_PAGE_SELECTORS.price);
    const rooms = await extractNumber(page, PROPERTY_PAGE_SELECTORS.rooms);
    const size = await extractNumber(page, PROPERTY_PAGE_SELECTORS.size);
    const floor = await extractNumber(page, PROPERTY_PAGE_SELECTORS.floor);
    const totalFloors = await extractNumber(page, PROPERTY_PAGE_SELECTORS.totalFloors);

    // Extract text fields
    const address = await extractText(page, PROPERTY_PAGE_SELECTORS.address);
    const neighborhood = await extractText(page, PROPERTY_PAGE_SELECTORS.neighborhood);
    const city = await extractText(page, PROPERTY_PAGE_SELECTORS.city);
    const propertyTypeRaw = await extractText(page, PROPERTY_PAGE_SELECTORS.propertyType);
    const description = await extractText(page, PROPERTY_PAGE_SELECTORS.description);

    // Extract amenities (boolean flags)
    const hasParking = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.parking);
    const hasElevator = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.elevator);
    const hasBalcony = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.balcony);
    const hasAirConditioning = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.airConditioning);
    const hasSecurityDoor = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.securityDoor);
    const hasBars = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.bars);
    const hasStorage = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.storage);
    const hasShelter = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.shelter);
    const isAccessible = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.accessible);
    const isRenovated = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.renovated);
    const isFurnished = await checkExists(page, PROPERTY_PAGE_SELECTORS.amenities.furnished);

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
 * Helper: Check if element exists (for amenities)
 */
async function checkExists(page: Page, selector: string): Promise<boolean | null> {
  try {
    // Split selector by comma (multiple selectors)
    const selectors = selector.split(",").map((s) => s.trim());

    for (const sel of selectors) {
      const element = await page.$(sel);
      if (element) {
        return true;
      }
    }

    return false;
  } catch (error) {
    return null;
  }
}

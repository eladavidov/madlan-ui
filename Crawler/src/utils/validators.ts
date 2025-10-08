/**
 * Data Validators
 * Validate extracted property data
 */

import type { PropertyInput } from "../models/Property.js";

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate property data
 */
export function validateProperty(property: PropertyInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!property.id || property.id.trim() === "") {
    errors.push({ field: "id", message: "Property ID is required" });
  }

  if (!property.url || property.url.trim() === "") {
    errors.push({ field: "url", message: "Property URL is required" });
  }

  if (!property.city || property.city.trim() === "") {
    errors.push({ field: "city", message: "City is required" });
  }

  // Price validation
  if (property.price !== undefined && property.price !== null) {
    if (property.price <= 0) {
      errors.push({
        field: "price",
        message: "Price must be positive",
        value: property.price,
      });
    }
    if (property.price > 100000000) {
      errors.push({
        field: "price",
        message: "Price seems unrealistically high",
        value: property.price,
      });
    }
  }

  // Rooms validation
  if (property.rooms !== undefined && property.rooms !== null) {
    if (property.rooms < 0.5) {
      errors.push({
        field: "rooms",
        message: "Rooms must be >= 0.5",
        value: property.rooms,
      });
    }
    if (property.rooms > 20) {
      errors.push({
        field: "rooms",
        message: "Rooms count seems unrealistic",
        value: property.rooms,
      });
    }
  }

  // Size validation
  if (property.size !== undefined && property.size !== null) {
    if (property.size <= 0) {
      errors.push({
        field: "size",
        message: "Size must be positive",
        value: property.size,
      });
    }
    if (property.size > 1000) {
      errors.push({
        field: "size",
        message: "Size seems unrealistically large",
        value: property.size,
      });
    }
  }

  // Floor validation
  if (property.floor !== undefined && property.floor !== null) {
    if (property.floor < -3) {
      errors.push({
        field: "floor",
        message: "Floor seems unrealistically low",
        value: property.floor,
      });
    }
    if (property.floor > 50) {
      errors.push({
        field: "floor",
        message: "Floor seems unrealistically high",
        value: property.floor,
      });
    }
  }

  // Total floors validation
  if (property.total_floors !== undefined && property.total_floors !== null) {
    if (property.total_floors <= 0) {
      errors.push({
        field: "total_floors",
        message: "Total floors must be positive",
        value: property.total_floors,
      });
    }
    if (property.floor && property.total_floors && property.floor > property.total_floors) {
      errors.push({
        field: "floor",
        message: "Floor cannot be higher than total floors",
        value: `${property.floor} > ${property.total_floors}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize property data (clean and normalize)
 */
export function sanitizeProperty(property: PropertyInput): PropertyInput {
  return {
    ...property,
    // Trim string fields
    id: property.id.trim(),
    url: property.url.trim(),
    city: property.city.trim(),
    address: property.address?.trim(),
    neighborhood: property.neighborhood?.trim(),
    description: property.description?.trim(),
    contact_name: property.contact_name?.trim(),
    contact_phone: property.contact_phone?.trim(),
    contact_agency: property.contact_agency?.trim(),
  };
}

/**
 * Check if property has minimum required data
 */
export function hasMinimumData(property: PropertyInput): boolean {
  // At minimum, we need: id, url, city, and at least one of price/rooms/size
  return !!(
    property.id &&
    property.url &&
    property.city &&
    (property.price || property.rooms || property.size)
  );
}

/**
 * Calculate data completeness percentage
 */
export function calculateCompleteness(property: PropertyInput): number {
  const fields = [
    "price",
    "rooms",
    "size",
    "floor",
    "total_floors",
    "address",
    "neighborhood",
    "property_type",
    "description",
    "has_parking",
    "has_elevator",
    "has_balcony",
  ];

  let filledFields = 0;
  for (const field of fields) {
    const value = (property as any)[field];
    if (value !== undefined && value !== null) {
      filledFields++;
    }
  }

  return Math.round((filledFields / fields.length) * 100);
}

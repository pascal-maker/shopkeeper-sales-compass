/**
 * Input validation utilities for security
 */

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  // Allow international format: +[country][number] or local format: 0[number]
  const phoneRegex = /^[\+]?[0-9][\d]{0,15}$/;
  return phoneRegex.test(phone.trim());
};

// Length validation
export const validateLength = (input: string, maxLength: number): boolean => {
  return input.trim().length <= maxLength;
};

// Name validation (prevent XSS and injection)
export const validateName = (name: string): boolean => {
  // Allow letters, numbers, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-']+$/;
  return nameRegex.test(name.trim()) && validateLength(name, 100);
};

// SKU validation
export const validateSKU = (sku: string): boolean => {
  // Allow alphanumeric characters, hyphens, underscores
  const skuRegex = /^[a-zA-Z0-9\-_]+$/;
  return skuRegex.test(sku.trim()) && validateLength(sku, 50);
};

// Category validation
export const validateCategory = (category: string): boolean => {
  return validateName(category) && validateLength(category, 50);
};

// Location validation
export const validateLocation = (location: string): boolean => {
  return validateLength(location, 200);
};

// Notes validation
export const validateNotes = (notes: string): boolean => {
  return validateLength(notes, 1000);
};

// Business name validation
export const validateBusinessName = (businessName: string): boolean => {
  return validateLength(businessName, 200);
};

// Price validation
export const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 999999.99 && Number.isFinite(price);
};

// Quantity validation
export const validateQuantity = (quantity: number): boolean => {
  return quantity >= 0 && Number.isInteger(quantity) && quantity <= 999999;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validation error messages
export const ValidationErrors = {
  PHONE_INVALID: 'Phone number must be in valid format (e.g., +1234567890 or 0123456789)',
  NAME_INVALID: 'Name contains invalid characters or is too long (max 100 characters)',
  SKU_INVALID: 'SKU contains invalid characters or is too long (max 50 characters)',
  CATEGORY_INVALID: 'Category contains invalid characters or is too long (max 50 characters)',
  LOCATION_TOO_LONG: 'Location is too long (max 200 characters)',
  NOTES_TOO_LONG: 'Notes are too long (max 1000 characters)',
  BUSINESS_NAME_TOO_LONG: 'Business name is too long (max 200 characters)',
  PRICE_INVALID: 'Price must be a positive number',
  QUANTITY_INVALID: 'Quantity must be a non-negative integer',
  REQUIRED_FIELD: 'This field is required'
};
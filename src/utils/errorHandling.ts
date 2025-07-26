/**
 * Secure error handling utilities
 */

// Error levels for logging
export enum ErrorLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  GENERAL = 'general'
}

// Safe error interface for user display
export interface SafeError {
  message: string;
  category: ErrorCategory;
  timestamp: Date;
}

// Internal error interface (contains sensitive details)
interface InternalError extends SafeError {
  level: ErrorLevel;
  originalError?: Error;
  context?: Record<string, any>;
  userId?: string;
}

// Safe error messages that don't expose sensitive information
const SAFE_ERROR_MESSAGES = {
  [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
  [ErrorCategory.AUTHENTICATION]: 'Please log in to continue.',
  [ErrorCategory.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorCategory.DATABASE]: 'A database error occurred. Please try again later.',
  [ErrorCategory.NETWORK]: 'Network error. Please check your connection and try again.',
  [ErrorCategory.GENERAL]: 'An unexpected error occurred. Please try again later.'
};

// Specific error patterns that are safe to show to users
const SAFE_ERROR_PATTERNS = [
  /email already exists/i,
  /invalid email format/i,
  /password too weak/i,
  /phone number format/i,
  /name too long/i,
  /required field/i,
  /invalid quantity/i,
  /insufficient inventory/i
];

/**
 * Sanitize error message for user display
 */
export const sanitizeErrorMessage = (error: Error | string, category: ErrorCategory): string => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Check if error message is safe to display
  const isSafeError = SAFE_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
  
  if (isSafeError) {
    return errorMessage;
  }
  
  // Return generic safe message
  return SAFE_ERROR_MESSAGES[category];
};

/**
 * Create a safe error for user display
 */
export const createSafeError = (
  error: Error | string,
  category: ErrorCategory = ErrorCategory.GENERAL
): SafeError => {
  return {
    message: sanitizeErrorMessage(error, category),
    category,
    timestamp: new Date()
  };
};

/**
 * Log error securely (in production, this would go to a secure logging service)
 */
export const logError = (
  error: Error | string,
  level: ErrorLevel = ErrorLevel.ERROR,
  category: ErrorCategory = ErrorCategory.GENERAL,
  context?: Record<string, any>,
  userId?: string
): void => {
  const internalError: InternalError = {
    message: typeof error === 'string' ? error : error.message,
    level,
    category,
    timestamp: new Date(),
    originalError: typeof error === 'string' ? undefined : error,
    context,
    userId
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', internalError);
  }
  
  // In production, this would send to a secure logging service
  // logToSecureService(internalError);
};

/**
 * Handle Supabase errors with proper categorization
 */
export const handleSupabaseError = (error: any): SafeError => {
  let category = ErrorCategory.DATABASE;
  
  if (error?.message?.includes('JWT')) {
    category = ErrorCategory.AUTHENTICATION;
  } else if (error?.message?.includes('policy')) {
    category = ErrorCategory.AUTHORIZATION;
  } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    category = ErrorCategory.NETWORK;
  }
  
  logError(error, ErrorLevel.ERROR, category);
  return createSafeError(error, category);
};

/**
 * Handle validation errors
 */
export const handleValidationError = (error: string | Error): SafeError => {
  logError(error, ErrorLevel.WARN, ErrorCategory.VALIDATION);
  return createSafeError(error, ErrorCategory.VALIDATION);
};
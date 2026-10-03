/**
 * Application-wide constants and configuration values.
 * Centralizing these makes the codebase easier to maintain and modify.
 */

export const WATER_GOALS = {
  glasses: 8,
  ml: 2000,
  l: 2,
}

export const DEFAULT_WATER_GOAL_UNIT = 'glasses'

export const WEIGHT_UNITS = {
  kg: 'kg',
  lb: 'lb',
}

export const DEFAULT_WEIGHT_UNIT = 'kg'

export const HEIGHT_UNITS = {
  cm: 'cm',
  in: 'in',
}

export const DEFAULT_HEIGHT_UNIT = 'cm'

export const TOAST_DURATION_MS = 3000

export const MIN_SERVINGS = 0.25
export const SERVINGS_STEP = 0.25

export const MIN_BARCODE_SCAN_DELAY_MS = 500

// Async operation timeout for providing feedback
export const ASYNC_OPERATION_TIMEOUT_MS = 10000

// Firebase error codes (partial list of common ones)
export const FIREBASE_ERROR_CODES = {
  RESOURCE_EXHAUSTED: 'functions/resource-exhausted',
  UNAUTHENTICATED: 'functions/unauthenticated',
  PERMISSION_DENIED: 'functions/permission-denied',
  NOT_FOUND: 'functions/not-found',
  INVALID_ARGUMENT: 'functions/invalid-argument',
}

export const ERROR_MESSAGES = {
  INVALID_IMAGE_DATA: 'Invalid image data.',
  SIGN_IN_REQUIRED: 'Sign in again to use meal scanning.',
  PHOTO_ANALYSIS_FAILED: 'Could not analyze that photo. Try again.',
  FOOD_NAME_REQUIRED: 'Give this food a name.',
  CALORIES_REQUIRED: 'Enter the calories as a positive number.',
  NO_RECIPE_MATCH_FOUND: (barcode) => `No match found for barcode ${barcode}. Enter the details manually below.`,
}

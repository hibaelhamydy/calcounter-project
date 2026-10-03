import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import {
  ERROR_MESSAGES,
  FIREBASE_ERROR_CODES,
} from './constants'

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.*)$/s

/**
 * Sends a compressed meal photo to the meal estimation Cloud Function.
 *
 * @param {string} imageDataUrl - A data URL containing the base64-encoded image
 *   (e.g., from fileToCompressedDataUrl)
 * @returns {Promise<Object>} Meal estimation result with calories and items
 * @throws {Error} If the image data is invalid, authentication fails, or the API fails
 *
 * @remarks
 * Requires the estimateMealCalories Cloud Function to be deployed with the
 * appropriate API credentials configured (see functions/index.js).
 */
export async function estimateMealFromPhoto(imageDataUrl) {
  const match = DATA_URL_PATTERN.exec(imageDataUrl)
  if (!match) throw new Error(ERROR_MESSAGES.INVALID_IMAGE_DATA)
  const [, mediaType, base64] = match

  const call = httpsCallable(functions, 'estimateMealCalories')
  try {
    const result = await call({ image: base64, mediaType })
    return result.data
  } catch (err) {
    if (err.code === FIREBASE_ERROR_CODES.RESOURCE_EXHAUSTED) {
      throw new Error(err.message)
    }
    if (err.code === FIREBASE_ERROR_CODES.UNAUTHENTICATED) {
      throw new Error(ERROR_MESSAGES.SIGN_IN_REQUIRED)
    }
    throw new Error(ERROR_MESSAGES.PHOTO_ANALYSIS_FAILED)
  }
}

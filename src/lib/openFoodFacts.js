// Thin client for the Open Food Facts product API (world.openfoodfacts.org).
// Verified CORS-open (Access-Control-Allow-Origin: *) for the product-by-barcode
// endpoint, so this can be called directly from the browser with no backend.
// Note: OFF's free-text search endpoints are not reliably CORS-open for
// third-party origins, so this app only supports lookup by barcode.

const PRODUCT_ENDPOINT = 'https://world.openfoodfacts.org/api/v2/product'

export function isBarcodeScanningSupported() {
  // Barcode decoding runs in pure JS (html5-qrcode), not a native browser
  // API, so any device with a camera can scan - including iOS Safari, which
  // never implemented the native BarcodeDetector API.
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

export async function getProductByBarcode(code) {
  let res
  try {
    res = await fetch(
      `${PRODUCT_ENDPOINT}/${encodeURIComponent(code)}.json?fields=code,product_name,brands,nutriments,serving_size`,
    )
  } catch {
    throw new Error('Could not reach the food database. Check your connection and try again.')
  }
  if (!res.ok) throw new Error('Could not reach the food database. Check your connection and try again.')
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null
  return normalizeProduct(data.product)
}

// Exported for unit testing - the branching logic around which calorie
// figure to prefer is the part worth covering directly.
export function normalizeProduct(product) {
  const per100g = product.nutriments?.['energy-kcal_100g']
  const perServing = product.nutriments?.['energy-kcal_serving']
  // Prefer the label's own per-serving calories; fall back to the per-100g
  // figure as a starting estimate the user can adjust for their actual portion.
  const caloriesPerServing =
    perServing != null ? Math.round(perServing) : per100g != null ? Math.round(per100g) : null

  return {
    code: product.code,
    name: product.product_name || 'Unknown product',
    brand: (product.brands || '').split(',')[0]?.trim() || '',
    caloriesPerServing,
    caloriesPer100g: per100g != null ? Math.round(per100g) : null,
    servingSize: product.serving_size || '',
    usedPer100g: perServing == null && per100g != null,
  }
}

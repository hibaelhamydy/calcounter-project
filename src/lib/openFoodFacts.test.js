import { describe, expect, it } from 'vitest'
import { normalizeProduct } from './openFoodFacts'

describe('normalizeProduct', () => {
  it('prefers the label\'s own per-serving calories when available', () => {
    const result = normalizeProduct({
      code: '123',
      product_name: 'Granola Bar',
      brands: 'Acme, Acme Foods',
      serving_size: '1 bar (40g)',
      nutriments: { 'energy-kcal_100g': 450, 'energy-kcal_serving': 180 },
    })

    expect(result.caloriesPerServing).toBe(180)
    expect(result.caloriesPer100g).toBe(450)
    expect(result.usedPer100g).toBe(false)
    expect(result.brand).toBe('Acme')
    expect(result.servingSize).toBe('1 bar (40g)')
  })

  it('falls back to the per-100g figure when no per-serving value exists', () => {
    const result = normalizeProduct({
      code: '456',
      product_name: 'Plain Yogurt',
      nutriments: { 'energy-kcal_100g': 61 },
    })

    expect(result.caloriesPerServing).toBe(61)
    expect(result.usedPer100g).toBe(true)
  })

  it('returns null calories when neither figure is present', () => {
    const result = normalizeProduct({ code: '789', nutriments: {} })
    expect(result.caloriesPerServing).toBeNull()
    expect(result.caloriesPer100g).toBeNull()
  })

  it('falls back to a placeholder name and empty brand when missing', () => {
    const result = normalizeProduct({ code: '999', nutriments: {} })
    expect(result.name).toBe('Unknown product')
    expect(result.brand).toBe('')
  })

  it('rounds fractional calorie values', () => {
    const result = normalizeProduct({
      code: '111',
      nutriments: { 'energy-kcal_serving': 142.6 },
    })
    expect(result.caloriesPerServing).toBe(143)
  })
})

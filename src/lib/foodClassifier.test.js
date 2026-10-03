import { describe, expect, it } from 'vitest'
import { matchPrediction } from './foodClassifier'

describe('matchPrediction', () => {
  it('matches a MobileNet class name against the food keyword table', () => {
    const result = matchPrediction({ className: 'cheeseburger', probability: 0.87 })
    expect(result).toEqual({
      label: 'Cheeseburger',
      caloriesPerServing: 300,
      servingHint: '1 burger',
      confidencePct: 87,
    })
  })

  it('matches against comma-separated ImageNet synonym lists', () => {
    // Real MobileNet output, e.g. "hotdog, hot dog, red hot" - the keyword
    // just needs to appear anywhere in the string.
    const result = matchPrediction({ className: 'hotdog, hot dog, red hot', probability: 0.5 })
    expect(result.label).toBe('Hot dog')
  })

  it('matches case-insensitively', () => {
    const result = matchPrediction({ className: 'BANANA', probability: 0.6 })
    expect(result.label).toBe('Banana')
  })

  it('returns null when no keyword in the table matches', () => {
    const result = matchPrediction({ className: 'sports car', probability: 0.9 })
    expect(result).toBeNull()
  })

  it('rounds probability to a whole-number confidence percentage', () => {
    const result = matchPrediction({ className: 'pizza', probability: 0.333 })
    expect(result.confidencePct).toBe(33)
  })
})

import { describe, expect, it } from 'vitest'
import { friendlyAuthError } from './authErrors'

describe('friendlyAuthError', () => {
  it.each([
    ['auth/invalid-credential', 'Incorrect email or password.'],
    ['auth/wrong-password', 'Incorrect email or password.'],
    ['auth/user-not-found', 'Incorrect email or password.'],
    ['auth/email-already-in-use', 'An account with this email already exists.'],
    ['auth/weak-password', 'Password should be at least 6 characters.'],
    ['auth/invalid-email', 'Please enter a valid email address.'],
  ])('maps %s to a friendly message', (code, expected) => {
    expect(friendlyAuthError({ code })).toBe(expected)
  })

  it('falls back to a generic message for unrecognized codes', () => {
    expect(friendlyAuthError({ code: 'auth/network-request-failed' })).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('falls back gracefully when given no error object at all', () => {
    expect(friendlyAuthError(undefined)).toBe('Something went wrong. Please try again.')
  })
})

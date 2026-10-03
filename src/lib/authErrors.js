export function friendlyAuthError(err) {
  const code = err?.code || ''
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return 'Incorrect email or password.'
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists.'
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters.'
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.'
  }
  return 'Something went wrong. Please try again.'
}

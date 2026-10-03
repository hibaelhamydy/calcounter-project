import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../lib/firebase'

const AuthContext = createContext(null)

/**
 * Provides Firebase authentication to the app.
 * Manages user state and auth-related operations.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  /**
   * Creates a new user account and optionally sets their display name.
   *
   * @param {string} email - Email address
   * @param {string} password - Password
   * @param {string} displayName - Optional display name
   * @returns {Promise<User>} Firebase User object
   * @throws {FirebaseError} If signup fails
   */
  async function signup(email, password, displayName) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }
    return credential.user
  }

  /**
   * Signs in an existing user.
   *
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {Promise<UserCredential>}
   * @throws {FirebaseError} If login fails
   */
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  /**
   * Signs out the current user.
   *
   * @returns {Promise<void>}
   */
  function logout() {
    return signOut(auth)
  }

  const value = { user, loading, signup, login, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication state and operations.
 * Must be used within an AuthProvider.
 *
 * @returns {Object} { user, loading, signup, login, logout }
 * @throws {Error} If not used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

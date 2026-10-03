import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Database schema constants and utilities for calorie tracking.
 * Data is organized under `users/{uid}` for per-user privacy and security.
 */

const entriesCollection = (uid, date) =>
  collection(db, 'users', uid, 'logs', date, 'entries')

const profileDoc = (uid) => doc(db, 'users', uid, 'profile', 'settings')

export const ALL_TRACKERS = ['water', 'weight', 'symptoms', 'mood', 'steps', 'exercise', 'fasting']
export const DEFAULT_TRACKERS = ['water', 'weight', 'symptoms']

/**
 * Subscribes to real-time updates of meal entries for a given date.
 * Entries are ordered by logged time (oldest first).
 *
 * @param {string} uid - The user's UID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Function} onChange - Called with array of entries on updates
 * @param {Function} onError - Called if subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToLogEntries(uid, date, onChange, onError) {
  const q = query(entriesCollection(uid, date), orderBy('loggedAt', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      onChange(entries)
    },
    onError,
  )
}

/**
 * Adds a new meal entry to the log.
 *
 * @param {string} uid - The user's UID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} entry - Entry data (title, calories, servings, category, etc.)
 * @returns {Promise<DocumentReference>} Reference to the created document
 */
export function addLogEntry(uid, date, entry) {
  return addDoc(entriesCollection(uid, date), {
    ...entry,
    loggedAt: serverTimestamp(),
  })
}

/**
 * Removes a meal entry from the log.
 *
 * @param {string} uid - The user's UID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} entryId - Document ID of the entry to delete
 * @returns {Promise<void>}
 */
export function deleteLogEntry(uid, date, entryId) {
  return deleteDoc(doc(db, 'users', uid, 'logs', date, 'entries', entryId))
}

/**
 * Subscribes to user profile settings (goals, units, preferences).
 *
 * @param {string} uid - The user's UID
 * @param {Function} onChange - Called with profile object on updates
 * @param {Function} onError - Called if subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToProfile(uid, onChange, onError) {
  return onSnapshot(profileDoc(uid), (snapshot) => onChange(snapshot.data() || {}), onError)
}

/**
 * Updates the user's daily calorie goal.
 *
 * @param {string} uid - The user's UID
 * @param {number} dailyCalorieGoal - Target daily calorie intake
 * @returns {Promise<void>}
 */
export function setDailyCalorieGoal(uid, dailyCalorieGoal) {
  return setDoc(profileDoc(uid), { dailyCalorieGoal }, { merge: true })
}

/**
 * Updates the user's water intake goal.
 *
 * @param {string} uid - The user's UID
 * @param {number} waterGoal - Water goal in the user's preferred unit
 * @returns {Promise<void>}
 */
export function setWaterGoal(uid, waterGoal) {
  return setDoc(profileDoc(uid), { waterGoal }, { merge: true })
}

/**
 * Updates the user's preferred water measurement unit (glasses, ml, l).
 *
 * @param {string} uid - The user's UID
 * @param {string} waterUnit - 'glasses', 'ml', or 'l'
 * @returns {Promise<void>}
 */
export function setWaterUnit(uid, waterUnit) {
  return setDoc(profileDoc(uid), { waterUnit }, { merge: true })
}

/**
 * Updates the user's preferred weight unit (kg or lb).
 *
 * @param {string} uid - The user's UID
 * @param {string} weightUnit - 'kg' or 'lb'
 * @returns {Promise<void>}
 */
export function setWeightUnit(uid, weightUnit) {
  return setDoc(profileDoc(uid), { weightUnit }, { merge: true })
}

/**
 * Updates the user's stored height.
 *
 * @param {string} uid - The user's UID
 * @param {number} height - Height in the user's preferred unit
 * @returns {Promise<void>}
 */
export function setHeight(uid, height) {
  return setDoc(profileDoc(uid), { height }, { merge: true })
}

/**
 * Updates the user's preferred height unit (cm or in).
 *
 * @param {string} uid - The user's UID
 * @param {string} heightUnit - 'cm' or 'in'
 * @returns {Promise<void>}
 */
export function setHeightUnit(uid, heightUnit) {
  return setDoc(profileDoc(uid), { heightUnit }, { merge: true })
}

/**
 * Updates which wellness trackers are enabled for the user.
 *
 * @param {string} uid - The user's UID
 * @param {Array<string>} enabledTrackers - Subset of ALL_TRACKERS to enable
 * @returns {Promise<void>}
 */
export function setEnabledTrackers(uid, enabledTrackers) {
  return setDoc(profileDoc(uid), { enabledTrackers }, { merge: true })
}

/**
 * Returns today's date as a YYYY-MM-DD string (using local timezone).
 * Used as the key for daily log entries.
 *
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

/**
 * Generates an array of date strings going back from a given date.
 * Useful for fetching historical data.
 *
 * @param {number} count - Number of days to include
 * @param {Date} endDate - The most recent date (defaults to today)
 * @returns {Array<string>} Array of dates in YYYY-MM-DD format, oldest first
 */
export function dateKeysBack(count, endDate = new Date()) {
  const keys = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    keys.push(d.toLocaleDateString('en-CA'))
  }
  return keys
}

/**
 * Subscribes to aggregated daily totals across multiple dates.
 * Useful for trend views and statistics.
 *
 * @param {string} uid - The user's UID
 * @param {Array<string>} dates - Array of dates in YYYY-MM-DD format
 * @param {Function} onChange - Called with map of date -> { total, byCategory }
 * @returns {Function} Unsubscribe function
 *
 * @remarks
 * Sets up subscriptions to all requested dates simultaneously to detect changes
 * in any date's entries. Returns aggregated totals and breakdown by meal category.
 */
export function subscribeToDailyTotals(uid, dates, onChange) {
  const totals = {}
  let stopped = false

  const unsubscribes = dates.map((date) => {
    totals[date] = { total: 0, byCategory: {} }
    return onSnapshot(entriesCollection(uid, date), (snapshot) => {
      let total = 0
      const byCategory = {}
      snapshot.docs.forEach((d) => {
        const data = d.data()
        const amount = Number(data.calories || 0) * Number(data.servings || 1)
        total += amount
        const category = data.category || 'other'
        byCategory[category] = (byCategory[category] || 0) + amount
      })
      totals[date] = { total, byCategory }
      if (!stopped) onChange({ ...totals })
    })
  })

  return () => {
    stopped = true
    unsubscribes.forEach((unsubscribe) => unsubscribe())
  }
}

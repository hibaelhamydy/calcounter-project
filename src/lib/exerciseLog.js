import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const EXERCISES = [
  { id: 'walking', label: 'Walking (3 mph)', met: 3.5 },
  { id: 'brisk-walking', label: 'Brisk walking (4 mph)', met: 5 },
  { id: 'running-5', label: 'Running (5 mph)', met: 8.3 },
  { id: 'running-6', label: 'Running (6 mph)', met: 9.8 },
  { id: 'cycling-light', label: 'Cycling (light)', met: 4 },
  { id: 'cycling-moderate', label: 'Cycling (moderate)', met: 8 },
  { id: 'swimming', label: 'Swimming', met: 8 },
  { id: 'weightlifting', label: 'Weightlifting', met: 6 },
  { id: 'yoga', label: 'Yoga', met: 3 },
  { id: 'hiit', label: 'HIIT', met: 12 },
  { id: 'basketball', label: 'Basketball', met: 8.3 },
  { id: 'soccer', label: 'Soccer', met: 10 },
  { id: 'dancing', label: 'Dancing', met: 5.5 },
  { id: 'elliptical', label: 'Elliptical', met: 8.5 },
  { id: 'rowing', label: 'Rowing', met: 9 },
  { id: 'hiking', label: 'Hiking', met: 7 },
  { id: 'jump-rope', label: 'Jump rope', met: 12.3 },
  { id: 'pilates', label: 'Pilates', met: 3.8 },
  { id: 'other', label: 'Other', met: 4 },
]

export const DEFAULT_FALLBACK_WEIGHT_KG = 70

const entriesCollection = (uid, date) => collection(db, 'users', uid, 'exerciseLogs', date, 'entries')

export function estimateCaloriesBurned(met, weightKg, durationMinutes) {
  if (!met || !weightKg || !durationMinutes || durationMinutes <= 0) return 0
  return Math.round(met * weightKg * (durationMinutes / 60))
}

export function subscribeToExerciseEntries(uid, date, onChange, onError) {
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

export function addExerciseEntry(uid, date, entry) {
  return addDoc(entriesCollection(uid, date), {
    ...entry,
    loggedAt: serverTimestamp(),
  })
}

export function deleteExerciseEntry(uid, date, entryId) {
  return deleteDoc(doc(db, 'users', uid, 'exerciseLogs', date, 'entries', entryId))
}

export function subscribeToExerciseTotals(uid, dates, onChange) {
  const totals = {}
  let stopped = false

  const unsubscribes = dates.map((date) => {
    totals[date] = { caloriesBurned: 0, minutes: 0, count: 0 }
    return onSnapshot(entriesCollection(uid, date), (snapshot) => {
      let caloriesBurned = 0
      let minutes = 0
      let count = 0
      snapshot.docs.forEach((d) => {
        const data = d.data()
        caloriesBurned += Number(data.caloriesBurned || 0)
        minutes += Number(data.durationMinutes || 0)
        count += 1
      })
      totals[date] = { caloriesBurned, minutes, count }
      if (!stopped) onChange({ ...totals })
    })
  })

  return () => {
    stopped = true
    unsubscribes.forEach((unsubscribe) => unsubscribe())
  }
}

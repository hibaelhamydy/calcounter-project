import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export const SYMPTOMS = ['bloating', 'pain', 'gas', 'fatigue']

export const SYMPTOM_LABELS = {
  bloating: 'Bloating',
  pain: 'Abdominal pain',
  gas: 'Gas',
  fatigue: 'Fatigue',
}

export const SEVERITY_LABELS = ['None', 'Mild', 'Moderate', 'Severe']

export const MOOD_LABELS = ['Rough', 'Low', 'Okay', 'Good', 'Great']

const wellnessDoc = (uid, date) => doc(db, 'users', uid, 'wellness', date)

export function subscribeToWellness(uid, date, onChange, onError) {
  return onSnapshot(wellnessDoc(uid, date), (snapshot) => onChange(snapshot.data() || {}), onError)
}

// Subscribes to a range of daily wellness docs at once, reporting a map of
// date -> wellness data every time any of them changes. Mirrors the pattern
// used for calorie totals so Stats can chart weight/water/symptoms trends.
export function subscribeToWellnessRange(uid, dates, onChange) {
  const entries = {}
  let stopped = false

  const unsubscribes = dates.map((date) => {
    entries[date] = {}
    return onSnapshot(wellnessDoc(uid, date), (snapshot) => {
      entries[date] = snapshot.data() || {}
      if (!stopped) onChange({ ...entries })
    })
  })

  return () => {
    stopped = true
    unsubscribes.forEach((unsubscribe) => unsubscribe())
  }
}

export function setWeight(uid, date, weight) {
  return setDoc(wellnessDoc(uid, date), { weight }, { merge: true })
}

export function setWater(uid, date, water) {
  return setDoc(wellnessDoc(uid, date), { water }, { merge: true })
}

export function setSymptom(uid, date, symptomKey, severity) {
  return setDoc(wellnessDoc(uid, date), { symptoms: { [symptomKey]: severity } }, { merge: true })
}

export function setSymptomNote(uid, date, note) {
  return setDoc(wellnessDoc(uid, date), { symptomNote: note }, { merge: true })
}

export function setMood(uid, date, mood) {
  return setDoc(wellnessDoc(uid, date), { mood }, { merge: true })
}

export function setSteps(uid, date, steps) {
  return setDoc(wellnessDoc(uid, date), { steps }, { merge: true })
}

export function setFasting(uid, date, fasting) {
  return setDoc(wellnessDoc(uid, date), { fasting }, { merge: true })
}

export function calculateBMI(weight, height, weightUnit = 'kg', heightUnit = 'cm') {
  if (!weight || !height || weight <= 0 || height <= 0) return null

  let weightKg = weight
  let heightM = height

  if (weightUnit === 'lb') {
    weightKg = weight / 2.20462
  }

  if (heightUnit === 'in') {
    heightM = (height * 2.54) / 100
  } else if (heightUnit === 'cm') {
    heightM = height / 100
  }

  return (weightKg / (heightM * heightM)).toFixed(1)
}

export function getBMICategory(bmi) {
  if (!bmi) return null
  const num = Number(bmi)
  if (num < 18.5) return 'Underweight'
  if (num < 25) return 'Normal weight'
  if (num < 30) return 'Overweight'
  return 'Obese'
}

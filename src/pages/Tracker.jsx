import { useEffect, useMemo, useState } from 'react'
import ActionSheet from '../components/ActionSheet'
import CalorieRing from '../components/CalorieRing'
import MealScan from '../components/MealScan'
import QuickAddModal from '../components/QuickAddModal'
import WellnessPanel from '../components/WellnessPanel'
import { useAuth } from '../context/AuthContext'
import { useTrackerProfile } from '../hooks/useTrackerProfile'
import {
  MIN_SERVINGS,
  SERVINGS_STEP,
  TOAST_DURATION_MS,
} from '../lib/constants'
import {
  addLogEntry,
  deleteLogEntry,
  subscribeToLogEntries,
  todayKey,
} from '../lib/calorieLog'
import { subscribeToExerciseEntries } from '../lib/exerciseLog'

export default function Tracker() {
  const { user } = useAuth()
  const [date, setDate] = useState(todayKey())
  const [entries, setEntries] = useState([])
  const [exerciseEntries, setExerciseEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showMealScan, setShowMealScan] = useState(false)
  const [toast, setToast] = useState('')

  const profile = useTrackerProfile(user.uid)

  useEffect(() => {
    const unsubscribe = subscribeToLogEntries(
      user.uid,
      date,
      (data) => {
        setEntries(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [user.uid, date])

  useEffect(() => {
    const unsubscribe = subscribeToExerciseEntries(user.uid, date, setExerciseEntries)
    return unsubscribe
  }, [user.uid, date])

  const totalCalories = useMemo(() => {
    const eaten = entries.reduce((sum, entry) => sum + Number(entry.calories || 0) * Number(entry.servings || 1), 0)
    const burned = exerciseEntries.reduce((sum, entry) => sum + Number(entry.caloriesBurned || 0), 0)
    return Math.max(0, eaten - burned)
  }, [entries, exerciseEntries])

  const goalNumber = Number(profile.goal) || 0

  async function handleRemove(entryId) {
    await deleteLogEntry(user.uid, date, entryId)
  }

  async function handleUpdateServings(entryId, newServings) {
    if (newServings < MIN_SERVINGS) return
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return
    await addLogEntry(user.uid, date, {
      ...entry,
      servings: newServings,
    })
  }

  function handleActionSheetAction(action) {
    setShowActionSheet(false)
    if (action === 'quickadd' || action === 'scan') {
      setShowQuickAdd(true)
    } else if (action === 'photo') {
      setShowMealScan(true)
    }
  }

  async function handleGoalChange(newGoal) {
    await profile.updateGoal(newGoal)
  }

  async function handleWaterGoalChange(value) {
    await profile.updateWaterGoal(value)
  }

  async function handleWaterUnitChange(unit) {
    await profile.updateWaterUnit(unit)
  }

  async function handleWeightUnitChange(unit) {
    await profile.updateWeightUnit(unit)
  }

  function handleQuickAdded(title) {
    setShowQuickAdd(false)
    setToast(`Logged "${title}" to today's tracker.`)
    setTimeout(() => setToast(''), TOAST_DURATION_MS)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Calorie Tracker</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="tracker-summary">
        <label>
          Daily goal (calories)
          <input
            type="number"
            min="0"
            value={profile.goal}
            placeholder="e.g. 1800"
            onChange={(e) => handleGoalChange(e.target.value)}
          />
        </label>
      </div>

      <CalorieRing total={totalCalories} goal={goalNumber} entries={entries} />

      <WellnessPanel
        uid={user.uid}
        date={date}
        enabledTrackers={profile.enabledTrackers}
        waterGoal={profile.waterGoal}
        waterUnit={profile.waterUnit}
        weightUnit={profile.weightUnit}
        height={profile.height}
        heightUnit={profile.heightUnit}
        onWaterGoalChange={handleWaterGoalChange}
        onWaterUnitChange={handleWaterUnitChange}
        onWeightUnitChange={handleWeightUnitChange}
      />

      <button type="button" className="fab" onClick={() => setShowActionSheet(true)}>
        +
      </button>

      <ActionSheet isOpen={showActionSheet} onClose={() => setShowActionSheet(false)} onAction={handleActionSheetAction} />

      {showQuickAdd && (
        <QuickAddModal
          uid={user.uid}
          date={date}
          authorName={user.displayName || user.email}
          onClose={() => setShowQuickAdd(false)}
          onLogged={handleQuickAdded}
        />
      )}

      {showMealScan && <MealScan uid={user.uid} date={date} onLogged={handleQuickAdded} onClose={() => setShowMealScan(false)} />}

      {loading && <p>Loading log...</p>}

      {!loading && entries.length === 0 && <div className="empty-state">Nothing logged for this day yet.</div>}

      <ul className="log-list">
        {entries.map((entry) => (
          <li key={entry.id} className="log-entry">
            <div className="log-entry-content">
              <span className="log-entry-title">{entry.title}</span>
              <span className="log-entry-cal">{Number(entry.calories || 0) * Number(entry.servings || 1)} cal</span>
            </div>
            <div className="log-entry-controls">
              <div className="servings-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => handleUpdateServings(entry.id, Math.max(MIN_SERVINGS, entry.servings - SERVINGS_STEP))}
                >
                  −
                </button>
                <span className="servings-value">{entry.servings}×</span>
                <button type="button" className="stepper-btn" onClick={() => handleUpdateServings(entry.id, entry.servings + SERVINGS_STEP)}>
                  +
                </button>
              </div>
              <button type="button" className="danger" onClick={() => handleRemove(entry.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { DumbbellIcon } from './icons'
import { addExerciseEntry, deleteExerciseEntry, estimateCaloriesBurned, subscribeToExerciseEntries, EXERCISES, DEFAULT_FALLBACK_WEIGHT_KG } from '../lib/exerciseLog'

export default function ExercisePanel({ uid, date, weightKg }) {
  const [entries, setEntries] = useState([])
  const [selectedExerciseId, setSelectedExerciseId] = useState(EXERCISES[0].id)
  const [durationMinutes, setDurationMinutes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToExerciseEntries(uid, date, setEntries)
    return unsubscribe
  }, [uid, date])

  const selectedExercise = EXERCISES.find((e) => e.id === selectedExerciseId) || EXERCISES[0]
  const effectiveWeight = weightKg || DEFAULT_FALLBACK_WEIGHT_KG
  const duration = Number(durationMinutes) || 0
  const estimatedCalories = estimateCaloriesBurned(selectedExercise.met, effectiveWeight, duration)
  const totalCalories = entries.reduce((sum, entry) => sum + (Number(entry.caloriesBurned) || 0), 0)
  const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0)

  async function handleAdd() {
    if (!durationMinutes || Number.isNaN(Number(durationMinutes)) || Number(durationMinutes) <= 0) return
    setSubmitting(true)
    try {
      await addExerciseEntry(uid, date, {
        exerciseId: selectedExerciseId,
        label: selectedExercise.label,
        met: selectedExercise.met,
        durationMinutes: Number(durationMinutes),
        caloriesBurned: estimatedCalories,
      })
      setDurationMinutes('')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(entryId) {
    await deleteExerciseEntry(uid, date, entryId)
  }

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>
          <DumbbellIcon className="header-icon" /> Exercise
        </h2>
        {totalCalories > 0 && <span className="calorie-badge">{totalCalories.toLocaleString()} cal burned</span>}
      </div>

      <div className="exercise-add-row">
        <label>
          Exercise
          <select value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)}>
            {EXERCISES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Duration (min)
          <input
            type="number"
            min="1"
            step="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="e.g. 30"
          />
        </label>

        <button type="button" onClick={handleAdd} disabled={submitting || !durationMinutes}>
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </div>

      {duration > 0 && (
        <p className="exercise-preview">
          ~{estimatedCalories} cal{!weightKg && ' (using default weight)'}
        </p>
      )}

      {!weightKg && <p style={{ fontSize: '12px', color: 'var(--text)', opacity: '0.7', margin: '8px 0 0' }}>Log today's weight above for a more accurate estimate.</p>}

      {entries.length > 0 && (
        <ul className="log-list">
          {entries.map((entry) => (
            <li key={entry.id} className="log-entry">
              <div className="log-entry-content">
                <span className="log-entry-title">{entry.label}</span>
                <span className="log-entry-cal">{entry.durationMinutes} min</span>
              </div>
              <div className="log-entry-controls">
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', marginRight: '12px' }}>
                  {Number(entry.caloriesBurned || 0).toLocaleString()} cal
                </span>
                <button type="button" className="danger" onClick={() => handleRemove(entry.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

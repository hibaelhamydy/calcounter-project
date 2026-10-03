import { useEffect, useState } from 'react'
import { CupIcon, DropIcon } from './icons'
import ExercisePanel from './ExercisePanel'
import FastingPanel from './FastingPanel'
import {
  MOOD_LABELS,
  SEVERITY_LABELS,
  SYMPTOMS,
  SYMPTOM_LABELS,
  calculateBMI,
  getBMICategory,
  setMood,
  setSteps,
  setSymptom,
  setSymptomNote,
  setWater,
  setWeight,
  subscribeToWellness,
} from '../lib/wellness'

const WATER_UNIT_LABELS = { glasses: 'glasses', ml: 'ml', l: 'L' }

export default function WellnessPanel({
  uid,
  date,
  enabledTrackers,
  waterGoal,
  waterUnit,
  weightUnit,
  height,
  heightUnit,
  onWaterGoalChange,
  onWaterUnitChange,
  onWeightUnitChange,
}) {
  const trackers = new Set(enabledTrackers)
  const [wellness, setWellnessState] = useState({})
  const [weightInput, setWeightInput] = useState('')
  const [waterInput, setWaterInput] = useState('')
  const [stepsInput, setStepsInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToWellness(uid, date, (data) => {
      setWellnessState(data)
      setWeightInput(data.weight != null ? String(data.weight) : '')
      setWaterInput(data.water != null ? String(data.water) : '')
      setStepsInput(data.steps != null ? String(data.steps) : '')
      setNoteInput(data.symptomNote || '')
    })
    return unsubscribe
  }, [uid, date])

  async function handleWeightBlur() {
    if (weightInput === '') {
      await setWeight(uid, date, null)
      return
    }
    const value = Number(weightInput)
    if (Number.isNaN(value) || value < 0) return
    await setWeight(uid, date, value)
  }

  async function handleWaterTap(count) {
    const next = wellness.water === count ? count - 1 : count
    await setWater(uid, date, Math.max(0, next))
  }

  async function handleWaterInputBlur() {
    if (waterInput === '') {
      await setWater(uid, date, 0)
      return
    }
    const value = Number(waterInput)
    if (Number.isNaN(value) || value < 0) return
    await setWater(uid, date, value)
  }

  async function handleStepsBlur() {
    if (stepsInput === '') {
      await setSteps(uid, date, null)
      return
    }
    const value = Number(stepsInput)
    if (Number.isNaN(value) || value < 0) return
    await setSteps(uid, date, value)
  }

  async function handleMoodTap(level) {
    await setMood(uid, date, wellness.mood === level ? null : level)
  }

  async function handleSymptomTap(key, severity) {
    const current = wellness.symptoms?.[key] ?? 0
    await setSymptom(uid, date, key, current === severity ? 0 : severity)
  }

  async function handleNoteBlur() {
    await setSymptomNote(uid, date, noteInput.trim())
  }

  const water = wellness.water || 0
  const goal = waterGoal || 8
  const unit = waterUnit || 'glasses'
  const unitLabel = WATER_UNIT_LABELS[unit]
  const cupCount = unit === 'glasses' ? Math.max(goal, water) : 0

  if (trackers.size === 0) {
    return (
      <div className="empty-state">
        No trackers turned on. You can turn them back on any time from Settings.
      </div>
    )
  }

  return (
    <div className="wellness-grid">
      {trackers.has('weight') && (
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Weight</h2>
          </div>
          <div className="weight-row">
            <input
              type="number"
              min="0"
              step="0.1"
              value={weightInput}
              placeholder="e.g. 68.5"
              onChange={(e) => setWeightInput(e.target.value)}
              onBlur={handleWeightBlur}
            />
            <div className="unit-toggle">
              <button type="button" className={weightUnit === 'kg' ? 'active' : ''} onClick={() => onWeightUnitChange('kg')}>
                kg
              </button>
              <button type="button" className={weightUnit === 'lb' ? 'active' : ''} onClick={() => onWeightUnitChange('lb')}>
                lb
              </button>
            </div>
          </div>
          {height && weightInput && (() => {
            const bmi = calculateBMI(Number(weightInput), Number(height), weightUnit, heightUnit)
            const category = getBMICategory(bmi)
            return (
              <div className="bmi-display">
                <div className="bmi-value">
                  <span className="bmi-number">{bmi}</span>
                  <span className="bmi-label">BMI</span>
                </div>
                <div className="bmi-category">
                  <span className={`category-badge category-${category?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {category}
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {trackers.has('water') && (
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Water</h2>
            <div className="unit-toggle">
              {Object.keys(WATER_UNIT_LABELS).map((u) => (
                <button key={u} type="button" className={unit === u ? 'active' : ''} onClick={() => onWaterUnitChange(u)}>
                  {WATER_UNIT_LABELS[u]}
                </button>
              ))}
            </div>
          </div>

          {unit === 'glasses' ? (
            <>
              <div className="water-cups">
                {Array.from({ length: cupCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`water-cup${i < water ? ' filled' : ''}`}
                    onClick={() => handleWaterTap(i + 1)}
                    aria-label={`Set water intake to ${i + 1} glasses`}
                    aria-pressed={i < water}
                  >
                    <CupIcon filled={i < water} />
                  </button>
                ))}
              </div>
              <p className="water-count">
                {water} / {goal} glasses
              </p>
              <label className="water-goal-label">
                Goal
                <input
                  type="number"
                  min="1"
                  className="water-goal-input"
                  value={goal}
                  onChange={(e) => onWaterGoalChange(Number(e.target.value) || 1)}
                />
                glasses
              </label>
            </>
          ) : (
            <div className="water-amount-row">
              <DropIcon className="water-drop-icon" />
              <label>
                Today ({unitLabel})
                <input
                  type="number"
                  min="0"
                  value={waterInput}
                  placeholder="0"
                  onChange={(e) => setWaterInput(e.target.value)}
                  onBlur={handleWaterInputBlur}
                />
              </label>
              <label>
                Goal ({unitLabel})
                <input
                  type="number"
                  min="1"
                  value={goal}
                  onChange={(e) => onWaterGoalChange(Number(e.target.value) || 1)}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {trackers.has('mood') && (
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Mood</h2>
          </div>
          <div className="severity-pills">
            {MOOD_LABELS.map((label, level) => (
              <button
                key={label}
                type="button"
                className={`severity-pill${wellness.mood === level ? ' active sev-0' : ''}`}
                onClick={() => handleMoodTap(level)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {trackers.has('steps') && (
        <div className="stats-card">
          <div className="stats-card-header">
            <h2>Steps</h2>
          </div>
          <label>
            Today
            <input
              type="number"
              min="0"
              value={stepsInput}
              placeholder="e.g. 6500"
              onChange={(e) => setStepsInput(e.target.value)}
              onBlur={handleStepsBlur}
            />
          </label>
        </div>
      )}

      {trackers.has('exercise') && (
        <ExercisePanel uid={uid} date={date} weightKg={weightInput === '' ? null : (weightUnit === 'lb' ? Number(weightInput) / 2.20462 : Number(weightInput))} />
      )}

      {trackers.has('fasting') && <FastingPanel uid={uid} date={date} />}

      {trackers.has('symptoms') && (
        <div className="stats-card wellness-symptoms">
          <div className="stats-card-header">
            <h2>Symptoms</h2>
          </div>
          {SYMPTOMS.map((key) => (
            <div className="symptom-row" key={key}>
              <span className="symptom-label">{SYMPTOM_LABELS[key]}</span>
              <div className="severity-pills">
                {SEVERITY_LABELS.map((label, severity) => (
                  <button
                    key={label}
                    type="button"
                    className={`severity-pill sev-${severity}${(wellness.symptoms?.[key] ?? 0) === severity ? ' active' : ''}`}
                    onClick={() => handleSymptomTap(key, severity)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <label className="symptom-note-label">
            Notes
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Anything else worth remembering about today?"
            />
          </label>
        </div>
      )}
    </div>
  )
}

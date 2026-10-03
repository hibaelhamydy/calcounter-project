import { useEffect, useState } from 'react'
import { setFasting, subscribeToWellness } from '../lib/wellness'

function formatHour(hour) {
  const h = Number(hour)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display} ${period}`
}

function calculateFastingProgress(startHour, endHour) {
  if (startHour === null || endHour === null) return null

  const now = new Date()
  const currentHour = now.getHours()

  let isFasting = false
  let hoursRemaining = 0
  let hoursFasted = 0
  let totalDuration = 0

  if (startHour <= endHour) {
    isFasting = currentHour >= startHour && currentHour < endHour
    totalDuration = endHour - startHour
    if (isFasting) {
      hoursFasted = currentHour - startHour + now.getMinutes() / 60
      hoursRemaining = endHour - currentHour - now.getMinutes() / 60
    } else if (currentHour >= endHour) {
      hoursFasted = 0
      hoursRemaining = totalDuration
    } else {
      hoursFasted = 0
      hoursRemaining = startHour - currentHour
    }
  } else {
    isFasting = currentHour >= startHour || currentHour < endHour
    totalDuration = 24 - startHour + endHour
    if (isFasting) {
      if (currentHour >= startHour) {
        hoursFasted = currentHour - startHour + now.getMinutes() / 60
        hoursRemaining = 24 - currentHour + endHour
      } else {
        hoursFasted = 24 - startHour + currentHour + now.getMinutes() / 60
        hoursRemaining = endHour - currentHour
      }
    } else {
      hoursFasted = 0
      hoursRemaining = startHour - currentHour
    }
  }

  return {
    isFasting,
    hoursFasted: Math.round(hoursFasted * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    totalDuration,
  }
}

export default function FastingPanel({ uid, date }) {
  const [wellness, setWellnessState] = useState({})
  const [startHour, setStartHour] = useState('')
  const [endHour, setEndHour] = useState('')
  const [goalHours, setGoalHours] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToWellness(uid, date, (data) => {
      setWellnessState(data)
      if (data.fasting) {
        setStartHour(String(data.fasting.startHour ?? ''))
        setEndHour(String(data.fasting.endHour ?? ''))
        setGoalHours(String(data.fasting.goalHours ?? ''))
      }
    })
    return unsubscribe
  }, [uid, date])

  async function handleSave() {
    const start = Number(startHour)
    const end = Number(endHour)
    const goal = Number(goalHours)

    if (
      startHour === '' ||
      endHour === '' ||
      goalHours === '' ||
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      Number.isNaN(goal) ||
      start < 0 ||
      start > 23 ||
      end < 0 ||
      end > 23 ||
      start === end ||
      goal <= 0 ||
      goal > 23
    ) {
      return
    }

    await setFasting(uid, date, {
      startHour: start,
      endHour: end,
      goalHours: goal,
    })
  }

  const start = Number(startHour)
  const end = Number(endHour)
  const fasting = wellness.fasting
  const progress = fasting ? calculateFastingProgress(fasting.startHour, fasting.endHour) : null

  const allFieldsFilled = startHour !== '' && endHour !== '' && goalHours !== ''

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>🕐 Fasting Window</h2>
        {fasting && <span className="calorie-badge">{fasting.goalHours}h goal</span>}
      </div>

      <div className="fasting-setup">
        <label>
          Fasting starts
          <select value={startHour} onChange={(e) => setStartHour(e.target.value)}>
            <option value="">Select time</option>
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>
                {formatHour(i)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fasting ends
          <select value={endHour} onChange={(e) => setEndHour(e.target.value)}>
            <option value="">Select time</option>
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>
                {formatHour(i)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Goal duration (hours)
          <input type="number" min="1" max="23" value={goalHours} onChange={(e) => setGoalHours(e.target.value)} placeholder="e.g. 16" />
        </label>

        <button type="button" onClick={handleSave} disabled={!allFieldsFilled}>
          Save
        </button>
      </div>

      {progress && (
        <div className="fasting-progress">
          <div className={`fasting-status ${progress.isFasting ? 'active' : 'inactive'}`}>
            <div className="status-icon">{progress.isFasting ? '✨' : '🌙'}</div>
            <div className="status-text">
              <span className="status-label">{progress.isFasting ? 'Currently Fasting' : 'Fasting Not Active'}</span>
              <span className="status-time">
                {progress.isFasting ? `${progress.hoursFasted}h fasted • ${progress.hoursRemaining}h left` : `Next fasting starts ${formatHour(fasting.startHour)}`}
              </span>
            </div>
          </div>

          <div className="fasting-bar">
            <div
              className="fasting-bar-fill"
              style={{
                width: `${Math.min(100, (progress.hoursFasted / fasting.goalHours) * 100)}%`,
              }}
            />
          </div>

          <div className="fasting-details">
            <span>
              <strong>{progress.hoursFasted}h</strong> / {fasting.goalHours}h
            </span>
            <span>
              {formatHour(fasting.startHour)} → {formatHour(fasting.endHour)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

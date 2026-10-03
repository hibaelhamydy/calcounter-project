import { useMemo } from 'react'

// r=86 in a 200x200 box, stroke 19.
const R = 86
const CIRC = 2 * Math.PI * R

const CATEGORY_VAR = {
  breakfast: 'var(--chart-breakfast)',
  lunch: 'var(--chart-lunch)',
  dinner: 'var(--chart-dinner)',
  dessert: 'var(--chart-dessert)',
}

function categoryColor(category) {
  return CATEGORY_VAR[String(category || '').toLowerCase()] || 'var(--chart-other)'
}

export default function CalorieRing({ total, goal, entries = [] }) {
  const goalNumber = Number(goal) || 0
  const pct = goalNumber > 0 ? Math.min(1, total / goalNumber) : 0
  const over = goalNumber > 0 && total > goalNumber
  const remaining = Math.max(0, goalNumber - total)

  const byCategory = useMemo(() => {
    const map = new Map()
    entries.forEach((entry) => {
      const key = entry.category || 'other'
      const cals = Number(entry.calories || 0) * Number(entry.servings || 1)
      map.set(key, (map.get(key) || 0) + cals)
    })
    return [...map.entries()]
      .filter(([, cals]) => cals > 0)
      .sort((a, b) => b[1] - a[1])
  }, [entries])

  return (
    <div className="calorie-ring-card">
      <div className="calorie-ring" role="img" aria-label={ringLabel(total, goalNumber, over)}>
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle className="calorie-ring-track" cx="100" cy="100" r={R} />
          <circle
            className={`calorie-ring-value${over ? ' over' : ''}`}
            cx="100"
            cy="100"
            r={R}
            strokeDasharray={`${(pct * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`}
          />
        </svg>
        <div className="calorie-ring-centre">
          {goalNumber > 0 ? (
            <>
              <strong>{over ? (total - goalNumber).toLocaleString() : remaining.toLocaleString()}</strong>
              <span className="calorie-ring-unit">{over ? 'cal over' : 'cal left'}</span>
              <span className="calorie-ring-sub">
                {total.toLocaleString()} of {goalNumber.toLocaleString()}
              </span>
            </>
          ) : (
            <>
              <strong>{total.toLocaleString()}</strong>
              <span className="calorie-ring-unit">cal logged</span>
              <span className="calorie-ring-sub">Set a goal to see the ring fill</span>
            </>
          )}
        </div>
      </div>

      {byCategory.length > 0 && (
        <ul className="calorie-ring-legend">
          {byCategory.map(([category, cals]) => (
            <li key={category}>
              <span className="calorie-ring-dot" style={{ background: categoryColor(category) }} />
              <span className="calorie-ring-legend-value">{Math.round(cals).toLocaleString()}</span>
              <span className="calorie-ring-legend-label">{category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ringLabel(total, goal, over) {
  if (goal <= 0) return `${total} calories logged today`
  return over
    ? `${total} of ${goal} calories, ${total - goal} over goal`
    : `${total} of ${goal} calories, ${goal - total} remaining`
}

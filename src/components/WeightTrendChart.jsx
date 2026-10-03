import { useState } from 'react'
import { formatDateLabel } from '../lib/dateFormat'

export default function WeightTrendChart({ points, unit }) {
  const [active, setActive] = useState(null)

  if (points.length < 2) {
    return (
      <div className="stats-card">
        <div className="stats-card-header">
          <h2>Weight trend</h2>
        </div>
        <div className="empty-state">Log your weight on at least two days to see a trend here.</div>
      </div>
    )
  }

  const values = points.map((p) => p.weight)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.2, 0.5)
  const lo = min - pad
  const hi = max + pad
  const range = hi - lo || 1

  const coords = points.map((p, i) => ({
    ...p,
    x: (i / (points.length - 1)) * 100,
    y: 100 - ((p.weight - lo) / range) * 100,
  }))

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>Weight trend</h2>
      </div>
      <div className="line-chart-plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="line-chart-svg">
          <path d={pathD} className="line-chart-path" vectorEffect="non-scaling-stroke" />
        </svg>
        {coords.map((c, i) => (
          <div
            key={c.date}
            className="line-chart-point"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            tabIndex={0}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            {active === i && (
              <div className="bar-tooltip line-chart-tooltip">
                <strong>
                  {c.weight} {unit}
                </strong>
                <span>{formatDateLabel(c.date)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="line-chart-axis">
        <span>{formatDateLabel(coords[0].date)}</span>
        <span>{formatDateLabel(coords[coords.length - 1].date)}</span>
      </div>
    </div>
  )
}

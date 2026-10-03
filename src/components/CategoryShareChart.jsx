import { useState } from 'react'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'

const ORDER = [...CATEGORIES, 'other', 'workouts']
const OTHER_LABEL = 'Other'

export default function CategoryShareChart({ totals }) {
  const [activeCat, setActiveCat] = useState(null)
  const [showTable, setShowTable] = useState(false)

  const sum = Object.values(totals).reduce((a, b) => a + b, 0)
  const segments = ORDER.filter((cat) => totals[cat] > 0).map((cat) => ({
    cat,
    value: totals[cat],
    pct: sum ? (totals[cat] / sum) * 100 : 0,
  }))

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>Where your calories come from</h2>
        {sum > 0 && (
          <button type="button" className="secondary table-toggle" onClick={() => setShowTable((s) => !s)}>
            {showTable ? 'Show chart' : 'View as table'}
          </button>
        )}
      </div>

      {sum === 0 ? (
        <div className="empty-state">No meals logged in this period yet.</div>
      ) : showTable ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Meal type</th>
                <th>Calories</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => (
                <tr key={seg.cat}>
                  <td>{CATEGORY_LABELS[seg.cat] || OTHER_LABEL}</td>
                  <td>{Math.round(seg.value).toLocaleString()}</td>
                  <td>{Math.round(seg.pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="category-bar">
            {segments.map((seg) => (
              <div
                key={seg.cat}
                className={`category-segment cat-seg-${seg.cat}`}
                style={{ width: `${seg.pct}%` }}
                tabIndex={0}
                onMouseEnter={() => setActiveCat(seg.cat)}
                onMouseLeave={() => setActiveCat(null)}
                onFocus={() => setActiveCat(seg.cat)}
                onBlur={() => setActiveCat(null)}
              >
                {seg.pct >= 14 && <span className="category-segment-label">{Math.round(seg.pct)}%</span>}
                {activeCat === seg.cat && (
                  <div className="bar-tooltip category-tooltip">
                    <strong>{Math.round(seg.value).toLocaleString()} cal</strong>
                    <span>
                      {CATEGORY_LABELS[seg.cat] || OTHER_LABEL} · {Math.round(seg.pct)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="legend">
            {segments.map((seg) => (
              <div className="legend-item" key={seg.cat}>
                <span className={`legend-swatch cat-seg-${seg.cat}`} />
                <span>{CATEGORY_LABELS[seg.cat] || OTHER_LABEL}</span>
                <span className="legend-value">{Math.round(seg.pct)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

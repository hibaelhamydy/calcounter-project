import { useState } from 'react'
import { formatDateLabel } from '../lib/dateFormat'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function niceCeil(value) {
  if (value <= 0) return 100
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / 10 ** exponent
  let niceFraction
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10
  return niceFraction * 10 ** exponent
}

export default function ExerciseTrendChart({ days }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const [showTable, setShowTable] = useState(false)

  const maxValue = Math.max(1, ...days.map((d) => d.caloriesBurned || 0))
  const axisMax = niceCeil(maxValue * 1.15)
  const midTick = Math.round(axisMax / 2)
  const labelStep = days.length <= 10 ? 1 : Math.ceil(days.length / 8)
  const shouldShowLabel = (i) => i % labelStep === 0 || i === days.length - 1

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>Calories burned per day</h2>
        <button type="button" className="secondary table-toggle" onClick={() => setShowTable((s) => !s)}>
          {showTable ? 'Show chart' : 'View as table'}
        </button>
      </div>

      {!showTable ? (
        <>
          <div className="bar-chart-plot">
            <div className="chart-gridline" style={{ bottom: '0%' }}>
              <span>0</span>
            </div>
            <div className="chart-gridline" style={{ bottom: '50%' }}>
              <span>{midTick.toLocaleString()}</span>
            </div>
            <div className="chart-gridline" style={{ bottom: '100%' }}>
              <span>{axisMax.toLocaleString()}</span>
            </div>
            <div className="bar-chart-bars">
              {days.map((day, i) => {
                const cal = day.caloriesBurned || 0
                const pct = Math.max(cal > 0 ? 2 : 0, (cal / axisMax) * 100)
                return (
                  <div
                    key={day.date}
                    className="bar-col"
                    tabIndex={0}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(i)}
                    onBlur={() => setActiveIndex(null)}
                  >
                    {activeIndex === i && (
                      <div className="bar-tooltip">
                        <strong>{cal.toLocaleString()} cal burned</strong>
                        <span>{formatDateLabel(day.date)}</span>
                      </div>
                    )}
                    <div className={`bar-fill${i === days.length - 1 ? ' today' : ''}`} style={{ height: `${pct}%` }} />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bar-chart-axis">
            {days.map((day, i) => (
              <span key={day.date}>{shouldShowLabel(i) ? shortLabel(day.date, days.length) : ''}</span>
            ))}
          </div>
        </>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Calories Burned</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <td>{formatDateLabel(day.date)}</td>
                  <td>{(day.caloriesBurned || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function shortLabel(dateKey, count) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return count <= 10 ? WEEKDAY[date.getDay()] : String(date.getDate())
}

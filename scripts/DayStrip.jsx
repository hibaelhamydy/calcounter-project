import { useRef } from 'react'
import { dateKeysBack, todayKey } from '../lib/calorieLog'

// Seven days ending today, plus a calendar button that opens the native
// date picker — so the strip is a shortcut, never a cage. Swipe left/right
// anywhere on the strip moves a day at a time.
const SWIPE_THRESHOLD = 45

export default function DayStrip({ date, onChange, loggedDates = new Set() }) {
  const today = todayKey()
  const days = dateKeysBack(7)
  const touchStart = useRef(null)

  function shift(offset) {
    const [y, m, d] = date.split('-').map(Number)
    const next = new Date(y, m - 1, d)
    next.setDate(next.getDate() + offset)
    const key = next.toLocaleDateString('en-CA')
    if (key > today) return
    onChange(key)
  }

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStart.current == null) return
    const delta = e.changedTouches[0].clientX - touchStart.current
    touchStart.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    shift(delta < 0 ? 1 : -1)
  }

  return (
    <div className="day-strip-wrap">
      <div
        className="day-strip"
        role="group"
        aria-label="Pick a day"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {days.map((key) => {
          const [, , dayNum] = key.split('-')
          const weekday = new Date(...key.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
            .toLocaleDateString(undefined, { weekday: 'short' })
            .slice(0, 2)
          const selected = key === date
          return (
            <button
              type="button"
              key={key}
              className={`day-cell${selected ? ' selected' : ''}${key === today ? ' today' : ''}`}
              onClick={() => onChange(key)}
              aria-pressed={selected}
              aria-label={key === today ? 'Today' : key}
            >
              <span className="day-cell-dow">{weekday}</span>
              <span className="day-cell-num">{Number(dayNum)}</span>
              <span className={`day-cell-dot${loggedDates.has(key) ? ' logged' : ''}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <label className="day-strip-picker">
        <span className="sr-only">Pick any date</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4.5 6.5h15v13h-15zM8 3.5v4M16 3.5v4M4.5 11h15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <input type="date" value={date} max={today} onChange={(e) => e.target.value && onChange(e.target.value)} />
      </label>
    </div>
  )
}

import { describePattern, findSymptomPatterns } from '../lib/patterns'

export default function SymptomPatterns({ days, wellness, range }) {
  const result = findSymptomPatterns(days, wellness)

  if (!result.ready) {
    return (
      <div className="stats-card">
        <div className="stats-card-header">
          <h2>What lines up with flare days</h2>
        </div>
        <div className="empty-state">
          <p>
            {result.loggedDays === 0
              ? 'Log a few days of food and symptoms and patterns will show up here.'
              : `${result.needed} more logged ${result.needed === 1 ? 'day' : 'days'} and this will start finding patterns.`}
          </p>
        </div>
      </div>
    )
  }

  if (result.flareDays === 0) {
    return (
      <div className="stats-card">
        <div className="stats-card-header">
          <h2>What lines up with flare days</h2>
        </div>
        <div className="empty-state">
          <p>No moderate-or-worse symptoms in the last {range} days. Nothing to correlate — good news.</p>
        </div>
      </div>
    )
  }

  if (result.patterns.length === 0) {
    return (
      <div className="stats-card">
        <div className="stats-card-header">
          <h2>What lines up with flare days</h2>
        </div>
        <div className="empty-state">
          <p>
            Nothing stands out yet across {result.loggedDays} logged days. Foods need to show up on at least three
            days before they can be compared.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h2>What lines up with flare days</h2>
        <span className="pattern-window">
          {result.flareDays} flare {result.flareDays === 1 ? 'day' : 'days'} in {result.loggedDays}
        </span>
      </div>

      <ul className="pattern-list">
        {result.patterns.map((pattern) => (
          <li key={pattern.key} className="pattern-row">
            <div className="pattern-head">
              <span className={`pattern-strength ${pattern.tone}`}>{pattern.strength}</span>
              <span className="pattern-food">{pattern.label}</span>
            </div>
            <div className="pattern-bar" aria-hidden="true">
              <div
                className={`pattern-bar-fill ${pattern.tone}`}
                style={{ width: `${Math.min(100, Math.abs(pattern.lift) * 100)}%` }}
              />
            </div>
            <p className="pattern-note">{describePattern(pattern)}</p>
          </li>
        ))}
      </ul>

      <p className="pattern-disclaimer">
        These are correlations from your own log over a small sample, not medical advice. Useful to show a dietitian —
        not worth changing your diet over on their own.
      </p>
    </div>
  )
}

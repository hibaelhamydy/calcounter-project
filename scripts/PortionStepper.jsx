// A thumb-sized replacement for the servings <input type="number">.
// Keeps a real input behind it so keyboards and screen readers still work.
export default function PortionStepper({ value, onChange, step = 0.5, min = 0.25, max = 10, label = 'Servings' }) {
  const current = Number(value) || 1

  function shift(delta) {
    const next = Math.min(max, Math.max(min, Math.round((current + delta) * 100) / 100))
    onChange(next)
  }

  return (
    <div className="portion-stepper">
      <span className="portion-stepper-label">{label}</span>
      <button type="button" onClick={() => shift(-step)} disabled={current <= min} aria-label={`Decrease ${label}`}>
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value) || min)}
        aria-label={label}
      />
      <button type="button" onClick={() => shift(step)} disabled={current >= max} aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  )
}

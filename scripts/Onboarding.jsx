import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { setDailyCalorieGoal, setOnboarded, setTrackers } from '../lib/calorieLog'

const TRACKERS = ['Water', 'Weight', 'Symptoms']

export default function Onboarding({ onDone }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(1500)
  const [tracking, setTracking] = useState(TRACKERS)
  const [saving, setSaving] = useState(false)

  function toggle(name) {
    setTracking((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]))
  }

  async function next() {
    if (step < 2) {
      setStep(step + 1)
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        setDailyCalorieGoal(user.uid, goal),
        setTrackers(user.uid, tracking),
        setOnboarded(user.uid),
      ])
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding-brand">
        <span className="navbar-logo">C</span>
        <span>Calorie Tracker</span>
      </div>

      <div className="onboarding-body">
        {step === 0 && (
          <div className="onboarding-step">
            <div className="onboarding-hero">
              <strong>{goal.toLocaleString()}</strong>
              <span>kcal a day</span>
            </div>
            <h1>Food, water, weight and how you felt — in one place.</h1>
            <p>Log a meal in two taps, then tell us how your gut is doing. We find the overlap for you.</p>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <h1>What&rsquo;s your daily target?</h1>
            <p>You can change it any day from the tracker.</p>
            <div className="onboarding-stepper">
              <button type="button" onClick={() => setGoal((g) => Math.max(1000, g - 50))} aria-label="Lower goal">
                −
              </button>
              <span>
                <strong>{goal.toLocaleString()}</strong>
                <small>kcal</small>
              </span>
              <button type="button" onClick={() => setGoal((g) => Math.min(4000, g + 50))} aria-label="Raise goal">
                +
              </button>
            </div>
            <p className="onboarding-hint">
              Most people land between 1,400 and 2,200. A target you can actually hit beats a perfect one.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h1>What should we keep an eye on?</h1>
            <p>Unpicked trackers stay hidden, so your day stays short.</p>
            <div className="onboarding-chips">
              {TRACKERS.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={tracking.includes(name) ? 'onboarding-chip active' : 'onboarding-chip'}
                  onClick={() => toggle(name)}
                  aria-pressed={tracking.includes(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === step ? 'active' : ''} />
          ))}
        </div>
        <button type="button" className="onboarding-cta" onClick={next} disabled={saving}>
          {step === 0 ? 'Get started' : step === 1 ? 'Looks right' : saving ? 'Saving…' : 'Start logging'}
        </button>
      </div>
    </div>
  )
}

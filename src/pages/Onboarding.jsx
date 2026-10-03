import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEFAULT_TRACKERS } from '../lib/calorieLog'

const TRACKER_OPTIONS = [
  { key: 'water', label: 'Water' },
  { key: 'weight', label: 'Weight' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'mood', label: 'Mood' },
  { key: 'steps', label: 'Steps' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'fasting', label: 'Fasting' },
]

const GOAL_STEP = 50
const MIN_GOAL = 800
const MAX_GOAL = 4000

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState(1500)
  const [trackers, setTrackers] = useState(() => new Set(DEFAULT_TRACKERS))

  function toggleTracker(key) {
    setTrackers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleStartLogging() {
    navigate('/signup', {
      state: { dailyCalorieGoal: goal, enabledTrackers: [...trackers] },
    })
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-brand">
        <span className="navbar-logo">C</span>
        <span>Calcount</span>
      </div>

      <div className="onboarding-content">
        {step === 0 && (
          <>
            <div className="onboarding-ring-badge">
              <strong>{goal.toLocaleString()}</strong>
              <span>kcal a day</span>
            </div>
            <h1 className="onboarding-headline">Food, water, weight and how you felt — in one place.</h1>
            <p className="onboarding-subtext">
              Log a meal in two taps, then tell Calcount how your gut is doing. It finds the overlap for you.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="onboarding-headline">What's your daily target?</h1>
            <p className="onboarding-subtext">You can change it any day from Settings.</p>
            <div className="onboarding-stepper">
              <button
                type="button"
                className="onboarding-stepper-btn"
                onClick={() => setGoal((g) => Math.max(MIN_GOAL, g - GOAL_STEP))}
                aria-label="Decrease daily target"
              >
                −
              </button>
              <div className="onboarding-stepper-value">
                <strong>{goal.toLocaleString()}</strong>
                <span>kcal</span>
              </div>
              <button
                type="button"
                className="onboarding-stepper-btn"
                onClick={() => setGoal((g) => Math.min(MAX_GOAL, g + GOAL_STEP))}
                aria-label="Increase daily target"
              >
                +
              </button>
            </div>
            <div className="onboarding-tip">
              Most people land between 1,400 and 2,200. A target you can actually hit beats a perfect one.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onboarding-headline">What should we keep an eye on?</h1>
            <p className="onboarding-subtext">Unpicked trackers stay hidden, so Today stays short.</p>
            <div className="onboarding-tracker-pills">
              {TRACKER_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`onboarding-pill${trackers.has(key) ? ' active' : ''}`}
                  onClick={() => toggleTracker(key)}
                  aria-pressed={trackers.has(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`onboarding-dot${i === step ? ' active' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <button type="button" onClick={() => setStep(1)}>
            Get started
          </button>
        )}
        {step === 1 && (
          <button type="button" onClick={() => setStep(2)}>
            Looks right
          </button>
        )}
        {step === 2 && (
          <>
            <button type="button" onClick={handleStartLogging}>
              Start logging
            </button>
            <Link to="/login" className="onboarding-existing-link">
              I already have an account
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

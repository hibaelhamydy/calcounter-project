import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ALL_TRACKERS, DEFAULT_TRACKERS, setDailyCalorieGoal, setHeight, setHeightUnit, setWaterUnit, setWeightUnit, setEnabledTrackers, subscribeToProfile } from '../lib/calorieLog'

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [goalDraft, setGoalDraft] = useState('')
  const [heightDraft, setHeightDraft] = useState('')
  const [heightUnit, setHeightUnitState] = useState('cm')
  const [weightUnit, setWeightUnitState] = useState('kg')
  const [waterUnit, setWaterUnitState] = useState('glasses')
  const [enabledTrackers, setEnabledTrackersState] = useState(DEFAULT_TRACKERS)
  const [savedAt, setSavedAt] = useState({})

  useEffect(() => {
    if (!user) return
    return subscribeToProfile(user.uid, (data) => {
      setProfile(data)
      setGoalDraft(String(data?.dailyCalorieGoal ?? ''))
      setHeightDraft(String(data?.height ?? ''))
      setHeightUnitState(data?.heightUnit ?? 'cm')
      setWeightUnitState(data?.weightUnit ?? 'kg')
      setWaterUnitState(data?.waterUnit ?? 'glasses')
      setEnabledTrackersState(data?.enabledTrackers ?? DEFAULT_TRACKERS)
    })
  }, [user?.uid])

  async function commitGoal() {
    const next = Number(goalDraft)
    if (!goalDraft || Number.isNaN(next) || next <= 0) {
      setGoalDraft(String(profile?.dailyCalorieGoal ?? ''))
      return
    }
    if (next === profile?.dailyCalorieGoal) return
    await setDailyCalorieGoal(user.uid, next)
    setSavedAt({ ...savedAt, goal: Date.now() })
  }

  async function commitHeight() {
    const next = Number(heightDraft)
    if (!heightDraft || Number.isNaN(next) || next <= 0) {
      setHeightDraft(String(profile?.height ?? ''))
      return
    }
    if (next === profile?.height) return
    await setHeight(user.uid, next)
    setSavedAt({ ...savedAt, height: Date.now() })
  }

  async function handleHeightUnitChange(unit) {
    setHeightUnitState(unit)
    await setHeightUnit(user.uid, unit)
    setSavedAt({ ...savedAt, heightUnit: Date.now() })
  }

  async function handleWeightUnitChange(unit) {
    setWeightUnitState(unit)
    await setWeightUnit(user.uid, unit)
    setSavedAt({ ...savedAt, weightUnit: Date.now() })
  }

  async function handleWaterUnitChange(unit) {
    setWaterUnitState(unit)
    await setWaterUnit(user.uid, unit)
    setSavedAt({ ...savedAt, waterUnit: Date.now() })
  }

  async function toggleTracker(key) {
    const next = new Set(enabledTrackers)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const trackerList = [...next]
    setEnabledTrackersState(trackerList)
    await setEnabledTrackers(user.uid, trackerList)
    setSavedAt({ ...savedAt, trackers: Date.now() })
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const name = user?.displayName || 'You'
  const initial = (user?.displayName || user?.email || 'Y').charAt(0)
  const trackersSet = new Set(enabledTrackers)

  return (
    <div className="page">
      <div className="page-header">
        <h1>You</h1>
      </div>

      <div className="profile-identity">
        <span className="profile-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="profile-identity-text">
          <strong>{name}</strong>
          <small>{user?.email}</small>
        </span>
      </div>

      <span className="settings-group-label">Goals</span>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row-text">
            <strong>Daily calorie goal</strong>
            <small>{savedAt.goal ? 'Saved' : 'Applies from today onward'}</small>
          </span>
          <input
            type="number"
            min="0"
            step="50"
            value={goalDraft}
            placeholder="e.g. 1800"
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={commitGoal}
            aria-label="Daily calorie goal"
          />
        </div>
      </div>

      <span className="settings-group-label">Trackers</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        {ALL_TRACKERS.map((tracker) => (
          <button
            key={tracker}
            type="button"
            className={`onboarding-pill${trackersSet.has(tracker) ? ' active' : ''}`}
            onClick={() => toggleTracker(tracker)}
            aria-pressed={trackersSet.has(tracker)}
          >
            {tracker.charAt(0).toUpperCase() + tracker.slice(1)}
          </button>
        ))}
      </div>

      <span className="settings-group-label">Units & Measurements</span>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row-text">
            <strong>Weight unit</strong>
            <small>For tracking weight</small>
          </span>
          <div className="unit-toggle-inline">
            <button
              type="button"
              className={weightUnit === 'kg' ? 'active' : ''}
              onClick={() => handleWeightUnitChange('kg')}
            >
              kg
            </button>
            <button
              type="button"
              className={weightUnit === 'lb' ? 'active' : ''}
              onClick={() => handleWeightUnitChange('lb')}
            >
              lb
            </button>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-text">
            <strong>Water unit</strong>
            <small>For tracking water intake</small>
          </span>
          <div className="unit-toggle-inline">
            <button
              type="button"
              className={waterUnit === 'glasses' ? 'active' : ''}
              onClick={() => handleWaterUnitChange('glasses')}
            >
              Glasses
            </button>
            <button
              type="button"
              className={waterUnit === 'ml' ? 'active' : ''}
              onClick={() => handleWaterUnitChange('ml')}
            >
              ml
            </button>
            <button
              type="button"
              className={waterUnit === 'l' ? 'active' : ''}
              onClick={() => handleWaterUnitChange('l')}
            >
              L
            </button>
          </div>
        </div>
      </div>

      <span className="settings-group-label">BMI Tracker</span>
      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row-text">
            <strong>Height</strong>
            <small>{savedAt.height ? 'Saved' : 'Used for BMI calculation on Tracker'}</small>
          </span>
          <div className="height-input-group">
            <input
              type="number"
              min="0"
              step="0.1"
              value={heightDraft}
              placeholder={heightUnit === 'cm' ? 'e.g. 170' : 'e.g. 67'}
              onChange={(e) => setHeightDraft(e.target.value)}
              onBlur={commitHeight}
              aria-label="Height"
            />
            <div className="height-unit-toggle">
              <button
                type="button"
                className={heightUnit === 'cm' ? 'active' : ''}
                onClick={() => handleHeightUnitChange('cm')}
              >
                cm
              </button>
              <button
                type="button"
                className={heightUnit === 'in' ? 'active' : ''}
                onClick={() => handleHeightUnitChange('in')}
              >
                in
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-note">
        <strong>BMI appears on Tracker</strong>
        <p>
          Set your height here, then go to the Tracker and enter your weight. Your BMI will calculate automatically with a health category.
        </p>
      </div>

      <div className="settings-note">
        <strong>Photos never leave your phone</strong>
        <p>
          Meal recognition runs on your device. Your log syncs to your account; the pictures stay in your camera
          roll.
        </p>
      </div>

      <button type="button" className="secondary settings-logout" onClick={handleLogout}>
        Log out
      </button>
    </div>
  )
}

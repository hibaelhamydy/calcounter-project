import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setDailyCalorieGoal, subscribeToProfile } from '../lib/calorieLog'

// Your app had no settings page — the goal input lived on the tracker and
// everything else was implicit. This is the prototype's "You" screen: one
// identity card, grouped rows, and the logout that used to sit in the navbar
// (which the tab bar now hides on mobile).
export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [goalDraft, setGoalDraft] = useState('')
  const [savedAt, setSavedAt] = useState(0)

  useEffect(() => {
    if (!user) return
    return subscribeToProfile(user.uid, (data) => {
      setProfile(data)
      setGoalDraft(String(data?.dailyCalorieGoal ?? ''))
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
    setSavedAt(Date.now())
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const name = user?.displayName || 'You'
  const initial = (user?.displayName || user?.email || 'Y').charAt(0)
  const trackers = profile?.trackers?.length ? profile.trackers.join(', ') : 'Water, Weight, Symptoms'

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
            <small>{savedAt ? 'Saved' : 'Applies from today onward'}</small>
          </span>
          <input
            type="number"
            min="0"
            step="50"
            value={goalDraft}
            onChange={(e) => setGoalDraft(e.target.value)}
            onBlur={commitGoal}
            aria-label="Daily calorie goal"
          />
        </div>
        <div className="settings-row">
          <span className="settings-row-text">
            <strong>Tracking</strong>
            <small>Chosen when you signed up</small>
          </span>
          <span className="settings-row-value">{trackers}</span>
        </div>
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

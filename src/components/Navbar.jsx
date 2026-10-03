import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">C</span>
        <span>Calcount</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>
          Recipes
        </NavLink>
        <NavLink to="/tracker">Tracker</NavLink>
        <NavLink to="/scan">AI Meal Scan</NavLink>
        <NavLink to="/stats">Stats</NavLink>
        <NavLink to="/community">Community</NavLink>
      </div>
      <div className="navbar-user">
        <span className="navbar-avatar">{(user.displayName || user.email || '?').charAt(0).toUpperCase()}</span>
        <span>{user.displayName || user.email}</span>
        <NavLink to="/settings" className="secondary">
          Settings
        </NavLink>
      </div>
    </nav>
  )
}

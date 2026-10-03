import { NavLink } from 'react-router-dom'

// The four destinations, in thumb order. The centre gap is where the
// add button sits — see .mobile-tabbar-spacer.
const TABS = [
  { to: '/tracker', label: 'Today', icon: HomeIcon },
  { to: '/', label: 'Recipes', icon: BookIcon, end: true },
  { to: '/stats', label: 'Trends', icon: ChartIcon },
  { to: '/community', label: 'People', icon: PeopleIcon },
]

export default function MobileTabBar({ onAdd }) {
  return (
    <nav className="mobile-tabbar" aria-label="Main">
      <div className="mobile-tabbar-inner">
        {TABS.slice(0, 2).map(renderTab)}
        <span className="mobile-tabbar-spacer" aria-hidden="true" />
        {TABS.slice(2).map(renderTab)}
      </div>
      <button type="button" className="mobile-tabbar-add" onClick={onAdd} aria-label="Log something">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
    </nav>
  )
}

function renderTab({ to, label, icon: Icon, end }) {
  return (
    <NavLink key={to} to={to} end={end} className="mobile-tab">
      <Icon />
      <span>{label}</span>
    </NavLink>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5M5 9.4V21h14V9.4" {...stroke} />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 7.5v13M3 4.5h5.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 3.5-3.5H21v13h-5.5A3.5 3.5 0 0 0 12 21a3.5 3.5 0 0 0-3.5-3.5H3z"
        {...stroke}
      />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20v-9M10 20V4.5M16 20v-6.5M2.5 20h19" {...stroke} />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9.5" cy="8" r="3.4" {...stroke} />
      <path d="M3.5 20c0-3.2 2.7-5 6-5s6 1.8 6 5M16 5a3.4 3.4 0 0 1 0 6.6M18.5 15.4c1.8.7 2.5 2.2 2.5 4.6" {...stroke} />
    </svg>
  )
}

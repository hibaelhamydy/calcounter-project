// Small inline SVG icons, used instead of emoji throughout the app.

export function CupIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M5 3h11l-1.15 13.2A3 3 0 0 1 11.86 19H9.14a3 3 0 0 1-2.99-2.8L5 3Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16.3 6.2h1a2.5 2.5 0 1 1 0 5h-1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function DropIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={className}>
      <path d="M12 2.5C12 2.5 5.5 11 5.5 15.5a6.5 6.5 0 0 0 13 0C18.5 11 12 2.5 12 2.5Z" fill="currentColor" />
    </svg>
  )
}

export function DumbbellIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={className}>
      <rect x="3" y="9" width="2" height="6" fill="currentColor" />
      <rect x="19" y="9" width="2" height="6" fill="currentColor" />
      <rect x="6" y="10" width="12" height="4" fill="currentColor" />
      <rect x="5" y="11" width="2" height="2" fill="currentColor" />
      <rect x="17" y="11" width="2" height="2" fill="currentColor" />
    </svg>
  )
}

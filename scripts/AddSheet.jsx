import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addLogEntry } from '../lib/calorieLog'
import { CATEGORY_LABELS } from '../lib/categories'

// The single sheet behind the + button. It does not reimplement logging —
// it routes to what already exists: the recipe list, /scan, and QuickAddModal
// (in barcode or manual mode).
export default function AddSheet({ uid, date, recipes, remaining, onClose, onQuickAdd, onRepeatYesterday, onLogged }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('choose')
  const [busyId, setBusyId] = useState(null)

  async function logRecipe(recipe) {
    setBusyId(recipe.id)
    try {
      await addLogEntry(uid, date, {
        recipeId: recipe.id,
        title: recipe.title,
        calories: recipe.calories,
        category: recipe.category,
        servings: 1,
        source: 'recipe',
      })
      onLogged(recipe.title)
    } finally {
      setBusyId(null)
    }
  }

  const options = [
    {
      key: 'recipes',
      label: 'My recipes',
      sub: 'Two taps, calories already worked out',
      icon: <path d="M3 11h18a9 9 0 0 1-18 0zM9 7.5c0-1.5 1.2-2 1.2-3.5M14 7.5c0-2 1.5-2.5 1.5-4.5" />,
      run: () => setMode('recipes'),
    },
    {
      key: 'scan',
      label: 'Photo scan',
      sub: 'On-device, nothing uploaded',
      icon: <><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" /><circle cx="12" cy="13.5" r="3.4" /></>,
      run: () => {
        onClose()
        navigate('/scan')
      },
    },
    {
      key: 'barcode',
      label: 'Barcode',
      sub: 'For packs and pots',
      icon: <path d="M4 5v14M8 5v14M12 5v10M16 5v14M20 5v14" />,
      run: () => onQuickAdd({ autoScan: true }),
    },
    {
      key: 'manual',
      label: 'Type it in',
      sub: 'When you just know the number',
      icon: <><rect x="2.5" y="6" width="19" height="12" rx="3" /><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8" /></>,
      run: () => onQuickAdd({ autoScan: false }),
    },
  ]

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <span className="sheet-grab" aria-hidden="true" />

        {mode === 'choose' ? (
          <>
            <h2 className="sheet-title">Add to today</h2>
            <p className="sheet-sub">
              {remaining > 0 ? `${remaining.toLocaleString()} cal left today.` : 'You are over your goal for today.'}
            </p>

            <div className="sheet-options">
              {options.map((option) => (
                <button type="button" key={option.key} className="sheet-option" onClick={option.run}>
                  <span className="sheet-option-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {option.icon}
                    </svg>
                  </span>
                  <span className="sheet-option-label">{option.label}</span>
                  <span className="sheet-option-sub">{option.sub}</span>
                </button>
              ))}
            </div>

            <div className="sheet-repeat">
              <span>Same breakfast as always? Copy yesterday's entries.</span>
              <button type="button" onClick={onRepeatYesterday}>
                Repeat
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="sheet-title">From your recipes</h2>
            {recipes.length === 0 && <div className="empty-state">No recipes saved yet.</div>}
            <ul className="sheet-recipe-list">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <span className={`sheet-recipe-swatch cat-${recipe.category || 'other'}`} aria-hidden="true" />
                  <span className="sheet-recipe-text">
                    <strong>{recipe.title}</strong>
                    <small>
                      {CATEGORY_LABELS[recipe.category] || 'Other'} · {recipe.calories} cal
                    </small>
                  </span>
                  <button type="button" onClick={() => logRecipe(recipe)} disabled={busyId === recipe.id}>
                    {busyId === recipe.id ? '…' : 'Log'}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="secondary sheet-back" onClick={() => setMode('choose')}>
              ← Other ways to add
            </button>
          </>
        )}
      </div>
    </div>
  )
}

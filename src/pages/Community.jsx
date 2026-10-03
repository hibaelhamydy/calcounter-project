import { useEffect, useMemo, useState } from 'react'
import CommunityRecipeCard from '../components/CommunityRecipeCard'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'
import { addRecipe, subscribeToCommunityRecipes, toOwnRecipeFields } from '../lib/recipes'
import { STARTER_RECIPES } from '../lib/starterRecipes'

export default function Community() {
  const { user } = useAuth()
  const [communityRecipes, setCommunityRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [savingId, setSavingId] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    return subscribeToCommunityRecipes(
      (data) => {
        setCommunityRecipes(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
  }, [])

  const allRecipes = useMemo(() => [...STARTER_RECIPES, ...communityRecipes], [communityRecipes])

  const filtered = useMemo(
    () => (activeCategory === 'all' ? allRecipes : allRecipes.filter((r) => r.category === activeCategory)),
    [allRecipes, activeCategory],
  )

  async function handleSave(recipe) {
    setSavingId(recipe.id)
    try {
      await addRecipe(user.uid, toOwnRecipeFields(recipe), user.displayName || user.email)
      setToast(`Saved "${recipe.title}" to your recipes.`)
      setTimeout(() => setToast(''), 3000)
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Community Recipes</h1>
      </div>
      <p className="page-subtitle">
        Browse recipes shared by other members, or save any of these to your own collection. Mark
        one of your own recipes public from its edit page to share it here.
      </p>

      {toast && <div className="toast">{toast}</div>}

      <div className="tabs">
        <button
          type="button"
          className={activeCategory === 'all' ? 'tab active' : 'tab'}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === activeCategory ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory(c)}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading && <p>Loading community recipes...</p>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <p>No {activeCategory === 'all' ? '' : `${CATEGORY_LABELS[activeCategory].toLowerCase()} `}recipes here yet.</p>
        </div>
      )}

      <div className="recipe-grid">
        {filtered.map((recipe) => (
          <CommunityRecipeCard
            key={recipe.id}
            recipe={recipe}
            isOwner={!recipe.isStarter && recipe.authorId === user.uid}
            onSave={handleSave}
            saving={savingId === recipe.id}
          />
        ))}
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import RecipeCard from '../components/RecipeCard'
import { useAuth } from '../context/AuthContext'
import { addLogEntry, todayKey } from '../lib/calorieLog'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'
import { deleteRecipe, subscribeToRecipes } from '../lib/recipes'

export default function Recipes() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('breakfast')
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeToRecipes(
      user.uid,
      (data) => {
        setRecipes(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [user.uid])

  const filteredRecipes = useMemo(
    () => recipes.filter((r) => r.category === activeCategory),
    [recipes, activeCategory],
  )

  async function handleLog(recipe) {
    await addLogEntry(user.uid, todayKey(), {
      recipeId: recipe.id,
      title: recipe.title,
      calories: recipe.calories,
      category: recipe.category,
      servings: 1,
    })
    setToast(`Logged "${recipe.title}" to today's tracker.`)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleDelete(recipe) {
    if (window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) {
      await deleteRecipe(user.uid, recipe.id)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Recipes</h1>
        <button type="button" onClick={() => navigate('/recipes/new')}>
          + Add recipe
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="tabs">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={category === activeCategory ? 'tab active' : 'tab'}
            onClick={() => setActiveCategory(category)}
          >
            {CATEGORY_LABELS[category]}
            <span className="tab-count">
              {recipes.filter((r) => r.category === category).length}
            </span>
          </button>
        ))}
      </div>

      {loading && <p>Loading recipes...</p>}

      {!loading && filteredRecipes.length === 0 && (
        <div className="empty-state">
          <p>No {CATEGORY_LABELS[activeCategory].toLowerCase()} recipes yet.</p>
          <Link to="/recipes/new">Add your first one</Link>
        </div>
      )}

      <div className="recipe-grid">
        {filteredRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onLog={handleLog}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  )
}

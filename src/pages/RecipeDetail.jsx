import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RecipeView from '../components/RecipeView'
import { useAuth } from '../context/AuthContext'
import { addLogEntry, todayKey } from '../lib/calorieLog'
import { deleteRecipe, subscribeToRecipe } from '../lib/recipes'

export default function RecipeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeToRecipe(
      user.uid,
      id,
      (data) => {
        setRecipe(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [user.uid, id])

  async function handleLog() {
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

  async function handleDelete() {
    if (window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) {
      await deleteRecipe(user.uid, recipe.id)
      navigate('/')
    }
  }

  if (loading) return <div className="page">Loading recipe...</div>
  if (!recipe) {
    return (
      <div className="page">
        <p>Recipe not found.</p>
        <Link to="/">Back to recipes</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        &larr; Back to recipes
      </Link>

      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <h1>{recipe.title}</h1>
        <div className="form-actions">
          <button type="button" onClick={handleLog}>
            Log to today
          </button>
          <Link to={`/recipes/${recipe.id}/edit`}>
            <button type="button" className="secondary">
              Edit
            </button>
          </Link>
          <button type="button" className="danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {recipe.isPublic && <p className="recipe-author">Shared to the Community library</p>}

      <RecipeView recipe={recipe} />
    </div>
  )
}

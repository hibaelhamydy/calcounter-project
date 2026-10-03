import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import RecipeView from '../components/RecipeView'
import { useAuth } from '../context/AuthContext'
import { addRecipe, subscribeToCommunityRecipe, toOwnRecipeFields } from '../lib/recipes'
import { STARTER_RECIPES } from '../lib/starterRecipes'

export default function CommunityRecipeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const starterRecipe = STARTER_RECIPES.find((r) => r.id === id)
  const [recipe, setRecipe] = useState(starterRecipe || null)
  const [loading, setLoading] = useState(!starterRecipe)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (starterRecipe) return undefined
    const unsubscribe = subscribeToCommunityRecipe(
      id,
      (data) => {
        setRecipe(data)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsubscribe
  }, [id, starterRecipe])

  async function handleSave() {
    setSaving(true)
    try {
      const docRef = await addRecipe(user.uid, toOwnRecipeFields(recipe), user.displayName || user.email)
      setToast('Saved to your recipes!')
      setTimeout(() => navigate(`/recipes/${docRef.id}`), 900)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page">Loading recipe...</div>
  if (!recipe) {
    return (
      <div className="page">
        <p>Recipe not found.</p>
        <Link to="/community">Back to community</Link>
      </div>
    )
  }

  const isOwner = !recipe.isStarter && recipe.authorId === user.uid

  return (
    <div className="page">
      <Link to="/community" className="back-link">
        &larr; Back to community
      </Link>

      {toast && <div className="toast">{toast}</div>}

      <div className="page-header">
        <h1>{recipe.title}</h1>
        <div className="form-actions">
          {isOwner ? (
            <Link to={`/recipes/${recipe.id}/edit`}>
              <button type="button" className="secondary">
                Edit
              </button>
            </Link>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save to my recipes'}
            </button>
          )}
        </div>
      </div>

      <p className="recipe-author">
        {recipe.isStarter ? 'Starter recipe' : `Shared by ${recipe.authorName || 'a member'}`}
      </p>

      <RecipeView recipe={recipe} />
    </div>
  )
}

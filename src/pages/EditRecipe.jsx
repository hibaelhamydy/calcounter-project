import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import { useAuth } from '../context/AuthContext'
import { subscribeToRecipe, updateRecipe } from '../lib/recipes'

export default function EditRecipe() {
  const { id } = useParams()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
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

  async function handleSubmit(updated) {
    await updateRecipe(user.uid, id, updated, user.displayName || user.email)
    navigate(`/recipes/${id}`)
  }

  if (loading) return <div className="page">Loading recipe...</div>
  if (!recipe) return <div className="page">Recipe not found.</div>

  return (
    <div className="page">
      <h1>Edit recipe</h1>
      <RecipeForm
        initialRecipe={recipe}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        submitLabel="Save changes"
      />
    </div>
  )
}

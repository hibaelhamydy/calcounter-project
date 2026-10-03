import { useNavigate } from 'react-router-dom'
import RecipeForm from '../components/RecipeForm'
import { useAuth } from '../context/AuthContext'
import { addRecipe } from '../lib/recipes'

export default function NewRecipe() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(recipe) {
    const docRef = await addRecipe(user.uid, recipe, user.displayName || user.email)
    navigate(`/recipes/${docRef.id}`)
  }

  return (
    <div className="page">
      <h1>Add a recipe</h1>
      <RecipeForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} submitLabel="Add recipe" />
    </div>
  )
}

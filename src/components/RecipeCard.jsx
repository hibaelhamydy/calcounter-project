import { Link } from 'react-router-dom'
import { CATEGORY_LABELS } from '../lib/categories'

export default function RecipeCard({ recipe, onLog, onDelete }) {
  return (
    <div className="recipe-card">
      <Link to={`/recipes/${recipe.id}`} className="recipe-card-media">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} loading="lazy" />
        ) : (
          <div className={`recipe-card-placeholder cat-${recipe.category}`}>
            <span>{CATEGORY_LABELS[recipe.category] || 'Recipe'}</span>
          </div>
        )}
        <span className="calorie-badge calorie-badge-floating">{recipe.calories} cal</span>
      </Link>
      <div className="recipe-card-body">
        <div className="recipe-card-header">
          <h3>
            <Link to={`/recipes/${recipe.id}`}>{recipe.title}</Link>
          </h3>
        </div>
        {recipe.isPublic && <p className="recipe-author">Shared to community</p>}
        {recipe.notes && <p className="recipe-notes">{recipe.notes}</p>}
        <div className="recipe-card-actions">
          {onLog && (
            <button type="button" onClick={() => onLog(recipe)}>
              Log to today
            </button>
          )}
          <Link to={`/recipes/${recipe.id}/edit`}>Edit</Link>
          {onDelete && (
            <button type="button" className="danger" onClick={() => onDelete(recipe)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

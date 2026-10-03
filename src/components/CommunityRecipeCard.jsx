import { Link } from 'react-router-dom'
import { CATEGORY_LABELS } from '../lib/categories'

export default function CommunityRecipeCard({ recipe, isOwner, onSave, saving }) {
  return (
    <div className="recipe-card">
      <Link to={`/community/${recipe.id}`} className="recipe-card-media">
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
            <Link to={`/community/${recipe.id}`}>{recipe.title}</Link>
          </h3>
        </div>
        <p className="recipe-author">
          {recipe.isStarter ? 'Starter recipe' : `Shared by ${recipe.authorName || 'a member'}`}
        </p>
        {recipe.notes && <p className="recipe-notes">{recipe.notes}</p>}
        <div className="recipe-card-actions">
          {isOwner ? (
            <Link to={`/recipes/${recipe.id}/edit`}>Edit</Link>
          ) : (
            <button type="button" onClick={() => onSave(recipe)} disabled={saving}>
              {saving ? 'Saving...' : 'Save to my recipes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { CATEGORY_LABELS } from '../lib/categories'

// The read-only body of a recipe (hero photo, meta row, notes/ingredients/
// instructions) — shared between the owner's recipe detail page and the
// read-only community recipe detail page.
export default function RecipeView({ recipe }) {
  return (
    <>
      {recipe.image ? (
        <div className="recipe-hero">
          <img src={recipe.image} alt={recipe.title} />
        </div>
      ) : (
        <div className={`recipe-hero recipe-hero-placeholder cat-${recipe.category}`}>
          <span>{CATEGORY_LABELS[recipe.category] || 'Recipe'}</span>
        </div>
      )}

      <div className="recipe-meta">
        <span className="calorie-badge">{recipe.calories} cal / serving</span>
        <span>{CATEGORY_LABELS[recipe.category]}</span>
        <span>{recipe.servings} serving(s)</span>
      </div>

      {recipe.notes && (
        <div className="recipe-section">
          <h2>Notes</h2>
          <p>{recipe.notes}</p>
        </div>
      )}

      {recipe.ingredients && (
        <div className="recipe-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.split('\n').filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions && (
        <div className="recipe-section">
          <h2>Instructions</h2>
          <ol>
            {recipe.instructions.split('\n').filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

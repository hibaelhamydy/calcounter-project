import { useEffect, useRef, useState } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { preloadBarcodeScanner } from '../lib/barcodeScannerLoader'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'
import { fileToCompressedDataUrl } from '../lib/imageUtils'
import { getProductByBarcode, isBarcodeScanningSupported } from '../lib/openFoodFacts'

const emptyRecipe = {
  title: '',
  category: 'breakfast',
  calories: '',
  servings: 1,
  ingredients: '',
  instructions: '',
  notes: '',
  image: '',
  isPublic: false,
}

export default function RecipeForm({ initialRecipe, onSubmit, onCancel, submitLabel = 'Save recipe' }) {
  const [recipe, setRecipe] = useState({ ...emptyRecipe, ...initialRecipe })
  const [submitting, setSubmitting] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const scanSupported = isBarcodeScanningSupported()
  const [scanningIngredient, setScanningIngredient] = useState(false)
  const [ingredientLookupNote, setIngredientLookupNote] = useState('')
  const [ingredientLookupLoading, setIngredientLookupLoading] = useState(false)

  useEffect(() => {
    if (scanSupported) preloadBarcodeScanner()
  }, [scanSupported])

  function update(field, value) {
    setRecipe((prev) => ({ ...prev, [field]: value }))
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setImageLoading(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      update('image', dataUrl)
    } catch (err) {
      setError(err.message || 'Could not use that image.')
    } finally {
      setImageLoading(false)
    }
  }

  function handleRemoveImage() {
    update('image', '')
  }

  async function handleIngredientBarcodeDetected(code) {
    setScanningIngredient(false)
    setIngredientLookupLoading(true)
    setIngredientLookupNote('')
    try {
      const product = await getProductByBarcode(code)
      if (!product) {
        setIngredientLookupNote(`No match found for barcode ${code}. Add the ingredient manually.`)
        return
      }
      const name = product.brand ? `${product.brand} ${product.name}` : product.name
      const calorieNote =
        product.caloriesPerServing != null
          ? ` (${product.caloriesPerServing} cal${product.usedPer100g ? '/100g' : '/serving'})`
          : ''
      const line = `${name}${calorieNote}`
      setRecipe((prev) => ({
        ...prev,
        ingredients: prev.ingredients ? `${prev.ingredients}\n${line}` : line,
      }))
      setIngredientLookupNote(`Added "${name}" to ingredients. Scan another or continue below.`)
    } catch (err) {
      setIngredientLookupNote(err.message || 'Could not look up that barcode.')
    } finally {
      setIngredientLookupLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!recipe.title.trim()) {
      setError('Please give the recipe a title.')
      return
    }
    const calories = Number(recipe.calories)
    if (!recipe.calories || Number.isNaN(calories) || calories < 0) {
      setError('Please enter the calories per serving as a positive number.')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        ...recipe,
        title: recipe.title.trim(),
        calories,
        servings: Number(recipe.servings) || 1,
        ingredients: recipe.ingredients.trim(),
        instructions: recipe.instructions.trim(),
        notes: recipe.notes.trim(),
        image: recipe.image || '',
        isPublic: !!recipe.isPublic,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}

      <label>
        Photo (optional)
        <div className="image-picker">
          {recipe.image ? (
            <div className="image-preview">
              <img src={recipe.image} alt="Recipe preview" />
              <button type="button" className="image-remove" onClick={handleRemoveImage} aria-label="Remove photo">
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="image-dropzone"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
            >
              <span>{imageLoading ? 'Processing photo...' : 'Add a photo'}</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
          {recipe.image && (
            <button
              type="button"
              className="secondary image-replace"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
            >
              {imageLoading ? 'Processing...' : 'Replace photo'}
            </button>
          )}
        </div>
      </label>

      <label>
        Title
        <input
          type="text"
          required
          value={recipe.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. Maple Pecan Overnight Oats"
        />
      </label>

      <div className="form-row">
        <label>
          Meal type
          <select value={recipe.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Calories per serving
          <input
            type="number"
            min="0"
            required
            value={recipe.calories}
            onChange={(e) => update('calories', e.target.value)}
          />
        </label>

        <label>
          Servings
          <input
            type="number"
            min="1"
            value={recipe.servings}
            onChange={(e) => update('servings', e.target.value)}
          />
        </label>
      </div>

      <label>
        <div className="ingredients-label-row">
          <span>Ingredients</span>
          {scanSupported && (
            <button
              type="button"
              className="secondary ingredient-scan-button"
              onClick={() => setScanningIngredient(true)}
              disabled={ingredientLookupLoading}
            >
              Scan ingredient barcode
            </button>
          )}
        </div>
        <textarea
          rows={5}
          value={recipe.ingredients}
          onChange={(e) => update('ingredients', e.target.value)}
          placeholder={'One ingredient per line, e.g.\n1 cup lactose-free milk\n1/2 cup rolled oats'}
        />
      </label>
      {ingredientLookupLoading && <p className="quick-add-hint">Looking up that barcode...</p>}
      {ingredientLookupNote && <div className="toast">{ingredientLookupNote}</div>}

      {scanningIngredient && (
        <div className="modal-overlay" onClick={() => setScanningIngredient(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <BarcodeScanner
              onDetected={handleIngredientBarcodeDetected}
              onClose={() => setScanningIngredient(false)}
            />
          </div>
        </div>
      )}

      <label>
        Instructions
        <textarea
          rows={5}
          value={recipe.instructions}
          onChange={(e) => update('instructions', e.target.value)}
          placeholder="Step by step instructions"
        />
      </label>

      <label>
        Notes (optional)
        <textarea
          rows={2}
          value={recipe.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="e.g. Great for meal prep, freezes well, double the recipe for leftovers"
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={!!recipe.isPublic}
          onChange={(e) => update('isPublic', e.target.checked)}
        />
        <span>
          Share to the Community library
          <small>Anyone signed in can see and save a copy of this recipe.</small>
        </span>
      </label>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={submitting || imageLoading}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

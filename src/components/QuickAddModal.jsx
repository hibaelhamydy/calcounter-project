import { useEffect, useState } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { addLogEntry } from '../lib/calorieLog'
import { preloadBarcodeScanner } from '../lib/barcodeScannerLoader'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'
import {
  ERROR_MESSAGES,
  MIN_SERVINGS,
  TOAST_DURATION_MS,
} from '../lib/constants'
import { getProductByBarcode, isBarcodeScanningSupported } from '../lib/openFoodFacts'
import { addRecipe } from '../lib/recipes'

const CATEGORY_OPTIONS = [...CATEGORIES, 'other']
const EMPTY_FORM = { title: '', category: 'other', calories: '', servings: 1 }

export default function QuickAddModal({ uid, date, authorName, onClose, onLogged }) {
  const scanSupported = isBarcodeScanningSupported()
  useEffect(() => {
    if (scanSupported) preloadBarcodeScanner()
  }, [scanSupported])
  const [scanning, setScanning] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupNote, setLookupNote] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saveAsRecipe, setSaveAsRecipe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleDetected(code) {
    setScanning(false)
    setLookingUp(true)
    setError('')
    setLookupNote('')
    try {
      const product = await getProductByBarcode(code)
      if (!product) {
        setLookupNote(ERROR_MESSAGES.NO_RECIPE_MATCH_FOUND(code))
        return
      }
      setForm((prev) => ({
        ...prev,
        title: product.brand ? `${product.brand} ${product.name}` : product.name,
        calories: product.caloriesPerServing ?? prev.calories,
      }))
      setLookupNote(
        product.usedPer100g
          ? `Matched "${product.name}". Calories shown are per 100g — adjust for your actual portion.`
          : `Matched "${product.name}". Calories are per labeled serving${product.servingSize ? ` (${product.servingSize})` : ''} — adjust servings below.`,
      )
    } catch (err) {
      setError(err.message || 'Could not look up that barcode.')
    } finally {
      setLookingUp(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError(ERROR_MESSAGES.FOOD_NAME_REQUIRED)
      return
    }
    const calories = Number(form.calories)
    if (!form.calories || Number.isNaN(calories) || calories < 0) {
      setError(ERROR_MESSAGES.CALORIES_REQUIRED)
      return
    }
    const servings = Number(form.servings) || 1
    setSubmitting(true)
    try {
      await addLogEntry(uid, date, {
        title: form.title.trim(),
        calories,
        servings,
        category: form.category,
        source: 'quickadd',
      })
      if (saveAsRecipe && CATEGORIES.includes(form.category)) {
        await addRecipe(
          uid,
          {
            title: form.title.trim(),
            category: form.category,
            calories,
            servings,
            ingredients: '',
            instructions: '',
            notes: '',
            image: '',
            isPublic: false,
          },
          authorName,
        )
      }
      onLogged(form.title.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="stats-card-header">
          <h2>Quick add food</h2>
          <button type="button" className="secondary table-toggle" onClick={onClose}>
            Close
          </button>
        </div>

        {scanning ? (
          <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
        ) : (
          <>
            {scanSupported ? (
              <button
                type="button"
                className="secondary scan-button"
                onClick={() => setScanning(true)}
                disabled={lookingUp}
              >
                Scan a barcode
              </button>
            ) : (
              <p className="quick-add-hint">Barcode scanning isn't supported in this browser.</p>
            )}
            {lookingUp && <p className="quick-add-hint">Looking up that barcode...</p>}
            {lookupNote && <div className="toast">{lookupNote}</div>}
            {error && <div className="auth-error">{error}</div>}

            <form className="recipe-form quick-add-form" onSubmit={handleSubmit}>
              <label>
                Food name
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. Rice cakes"
                />
              </label>

              <div className="form-row">
                <label>
                  Meal type
                  <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => (
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
                    value={form.calories}
                    onChange={(e) => update('calories', e.target.value)}
                  />
                </label>
                <label>
                  Servings
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={form.servings}
                    onChange={(e) => update('servings', e.target.value)}
                  />
                </label>
              </div>

              {CATEGORIES.includes(form.category) && (
                <label className="checkbox-row">
                  <input type="checkbox" checked={saveAsRecipe} onChange={(e) => setSaveAsRecipe(e.target.checked)} />
                  <span>Also save this as a recipe for next time</span>
                </label>
              )}

              <div className="form-actions">
                <button type="button" className="secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Logging...' : 'Log to today'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

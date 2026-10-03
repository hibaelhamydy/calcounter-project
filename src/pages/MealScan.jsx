import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addLogEntry, todayKey } from '../lib/calorieLog'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories'
import { classifyFoodImage, loadImageFromFile } from '../lib/foodClassifier'
import { addRecipe } from '../lib/recipes'

const CATEGORY_OPTIONS = [...CATEGORIES, 'other']
const emptyForm = { title: '', category: 'other', calories: '', servings: 1 }

export default function MealScan() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [date, setDate] = useState(todayKey())
  const [previewUrl, setPreviewUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanLabel, setScanLabel] = useState('')
  const [result, setResult] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saveAsRecipe, setSaveAsRecipe] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetScan() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setResult(null)
    setForm(emptyForm)
    setSaveAsRecipe(false)
    setError('')
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    resetScan()
    setError('')
    setScanning(true)
    setScanLabel('Loading the recognition model (first scan only)...')
    try {
      const img = await loadImageFromFile(file)
      setPreviewUrl(img.src)
      setScanLabel('Recognizing your photo...')
      const found = await classifyFoodImage(img)
      if (!found) {
        setError(
          "Couldn't confidently recognize a common food in that photo. Try a clearer photo of a single item, or enter the details manually below.",
        )
        setForm(emptyForm)
        return
      }
      setResult(found)
      setForm((prev) => ({ ...prev, title: found.label, calories: found.caloriesPerServing }))
    } catch (err) {
      setError(err.message || 'Could not analyze that photo.')
    } finally {
      setScanning(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) {
      setError('Give this food a name.')
      return
    }
    const calories = Number(form.calories)
    if (!form.calories || Number.isNaN(calories) || calories < 0) {
      setError('Enter the calories as a positive number.')
      return
    }
    const servings = Number(form.servings) || 1
    setSubmitting(true)
    try {
      await addLogEntry(user.uid, date, {
        title: form.title.trim(),
        calories,
        servings,
        category: form.category,
        source: 'ai-scan',
      })
      if (saveAsRecipe && CATEGORIES.includes(form.category)) {
        await addRecipe(
          user.uid,
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
          user.displayName || user.email,
        )
      }
      setToast(`Logged "${form.title.trim()}" to ${date === todayKey() ? "today's" : date} tracker.`)
      setTimeout(() => setToast(''), 3000)
      resetScan()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>AI Meal Scan</h1>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <p className="page-subtitle">
        Snap a photo of a single food item and get an instant calorie estimate. Recognition runs entirely on your
        device — nothing is uploaded
      </p>

      {toast && <div className="toast">{toast}</div>}

      <div className="stats-card">
        {previewUrl ? (
          <div className="meal-scan-preview">
            <img src={previewUrl} alt="Selected meal" />
            <button
              type="button"
              className="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              Try another photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="image-dropzone meal-scan-dropzone"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
          >
            <span>{scanning ? scanLabel : 'Take or choose a photo'}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handlePhotoSelected}
        />

        {scanning && previewUrl && <p className="quick-add-hint">{scanLabel}</p>}
        {error && <div className="auth-error">{error}</div>}

        {result && (
          <div className="toast">
            Recognized "{result.label}" ({result.confidencePct}% confidence). Calories are a rough estimate for{' '}
            {result.servingHint} — review and adjust below before logging.
          </div>
        )}

        {(result || error) && (
          <form className="recipe-form quick-add-form" onSubmit={handleSubmit}>
            <label>
              Food name
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Grilled chicken bowl"
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
              <button type="button" className="secondary" onClick={resetScan}>
                Start over
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Logging...' : 'Log this meal'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

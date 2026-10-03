# Implementing the prototype in Calcounter

Five files to add, four to edit. Nothing here rewrites logging — the sheet
routes to `QuickAddModal`, `BarcodeScanner` and `MealScan`, which already work.

Everything uses your existing tokens (`--accent`, `--accent-bg`, `--danger`,
`--chart-*`, `--radius-*`, `--shadow-*`), so dark mode and your
CVD-validated chart palette keep working untouched.

## Files to copy

| From here | To |
| --- | --- |
| `CalorieRing.jsx` | `src/components/CalorieRing.jsx` |
| `MobileTabBar.jsx` | `src/components/MobileTabBar.jsx` |
| `AddSheet.jsx` | `src/components/AddSheet.jsx` |
| `DayStrip.jsx` | `src/components/DayStrip.jsx` |
| `Onboarding.jsx` | `src/components/Onboarding.jsx` |
| `SymptomPatterns.jsx` | `src/components/SymptomPatterns.jsx` |
| `PortionStepper.jsx` | `src/components/PortionStepper.jsx` |
| `patterns.js` | `src/lib/patterns.js` |
| `Settings.jsx` | `src/pages/Settings.jsx` |
| `theme.css` | insert into `src/index.css` **after the `:root` block** (see step 9) |
| `calorie-ring.css` | append to `src/index.css` |
| `mobile.css` | append to `src/index.css` (after `calorie-ring.css`) |
| `mobile-extras.css` | append to `src/index.css` (after `mobile.css`) |
| `screens.css` | append to `src/index.css` (after `mobile-extras.css`) |
| `scan.css` | append to `src/index.css` (last) |

Suggested order: **step 1 → 13**. Each step works on its own, so you can stop
after any of them and still have a shippable app. Steps 9–13 are the visual
swap, the remaining screens, and the two camera flows.

---

## Step 1 — The ring (`src/pages/Tracker.jsx`)

Replaces the `.progress-bar` block. `percent` becomes unused; delete it.

```diff
+import CalorieRing from '../components/CalorieRing'

-      {goalNumber > 0 && (
-        <div className="progress-bar">
-          <div
-            className={`progress-bar-fill${totalCalories > goalNumber ? ' over' : ''}`}
-            style={{ width: `${percent}%` }}
-          />
-        </div>
-      )}
+      <CalorieRing total={totalCalories} goal={goalNumber} entries={entries} />
```

The ring renders with `goal = 0` too — it shows the running total and a
prompt instead of an empty circle, so new users don't meet a dead ring.
The legend is built from `entry.category` using your `--chart-*` palette.

---

## Step 2 — Bars + goal line (`src/components/CalorieTrendChart.jsx`)

This component is already ~90% of the prototype. One change:

```diff
-<div className={`bar-fill${over ? ' over' : ''}`} style={{ height: `${pct}%` }} />
+<div
+  className={`bar-fill${over ? ' over' : ''}${i === days.length - 1 ? ' today' : ''}`}
+  style={{ height: `${pct}%` }}
+/>
```

Rounder caps and the warmer over-goal colour are pure CSS, already in
`calorie-ring.css`. I moved over-goal from red to `--accent-2 → --danger`:
being over goal isn't an error, and red on a food log reads as failure.

Your existing structure — bars in `.bar-chart-plot`, labels in a separate
`.bar-chart-axis` — is the right one. Keep it. (The prototype originally
nested the labels inside the plot and the baselines drifted apart; your
code never had that bug.)

---

## Step 3 — Tab bar (`App.jsx`, `Navbar.jsx`)

The tab bar needs the add sheet, and the sheet needs Tracker's state
(`date`, `recipes`, `entries`). Simplest correct wiring: mount the tab bar
in `App`, and have it navigate to `/tracker` with a flag when `+` is tapped.

**`src/App.jsx`**

```diff
-import { Navigate, Route, Routes } from 'react-router-dom'
+import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
 import Navbar from './components/Navbar'
+import MobileTabBar from './components/MobileTabBar'
+import { useAuth } from './context/AuthContext'
```

`App` itself can't call `useAuth` — it renders `AuthProvider`. Pull the
chrome into a child:

```jsx
function Chrome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  if (!user) return null
  return (
    <MobileTabBar
      onAdd={() => navigate('/tracker', { state: { openAdd: Date.now() } })}
    />
  )
}
```

Then inside `AuthProvider`, after `<Routes>`:

```diff
       </Routes>
+      <Chrome />
     </AuthProvider>
```

**`src/components/Navbar.jsx`** — no JS change. `mobile.css` hides
`.navbar-links` under 860px; the brand and the account/logout row stay.

---

## Step 4 — The add sheet (`src/pages/Tracker.jsx`)

**a. A one-shot read for "repeat yesterday".** Add to `src/lib/calorieLog.js`:

```diff
 import {
   addDoc,
   collection,
   deleteDoc,
   doc,
+  getDocs,
   onSnapshot,
   orderBy,
   query,
   serverTimestamp,
   setDoc,
 } from 'firebase/firestore'
```

```js
// One-shot read, for copying a previous day into today.
export async function getLogEntriesOnce(uid, date) {
  const snapshot = await getDocs(entriesCollection(uid, date))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function shiftDateKey(dateKey, days) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}
```

**b. Wire the sheet into Tracker.**

```diff
+import { useLocation } from 'react-router-dom'
+import AddSheet from '../components/AddSheet'
 import {
   addLogEntry,
   deleteLogEntry,
+  getLogEntriesOnce,
+  shiftDateKey,
   ...
 } from '../lib/calorieLog'
```

```diff
   const [showQuickAdd, setShowQuickAdd] = useState(false)
+  const [showAddSheet, setShowAddSheet] = useState(false)
+  const [quickAddAutoScan, setQuickAddAutoScan] = useState(false)
+  const location = useLocation()
+
+  // The + button in the tab bar navigates here with a timestamp in state.
+  useEffect(() => {
+    if (location.state?.openAdd) setShowAddSheet(true)
+  }, [location.state?.openAdd])
```

```jsx
async function handleRepeatYesterday() {
  const yesterday = shiftDateKey(date, -1)
  const previous = await getLogEntriesOnce(user.uid, yesterday)
  if (previous.length === 0) {
    setToast('Nothing logged yesterday to copy.')
    setTimeout(() => setToast(''), 3000)
    return
  }
  await Promise.all(
    previous.map(({ id, loggedAt, ...entry }) => addLogEntry(user.uid, date, entry)),
  )
  setShowAddSheet(false)
  setToast(`Copied ${previous.length} entries from yesterday.`)
  setTimeout(() => setToast(''), 3000)
}
```

Render it next to the existing `QuickAddModal`:

```jsx
{showAddSheet && (
  <AddSheet
    uid={user.uid}
    date={date}
    recipes={recipes}
    remaining={Math.max(0, goalNumber - totalCalories)}
    onClose={() => setShowAddSheet(false)}
    onQuickAdd={({ autoScan }) => {
      setQuickAddAutoScan(autoScan)
      setShowAddSheet(false)
      setShowQuickAdd(true)
    }}
    onRepeatYesterday={handleRepeatYesterday}
    onLogged={(title) => {
      setShowAddSheet(false)
      handleQuickAdded(title)
    }}
  />
)}
```

**c. Barcode opens scanning directly.** Three lines in `QuickAddModal.jsx`:

```diff
-export default function QuickAddModal({ uid, date, authorName, onClose, onLogged }) {
+export default function QuickAddModal({ uid, date, authorName, autoScan = false, onClose, onLogged }) {
   const scanSupported = isBarcodeScanningSupported()
-  const [scanning, setScanning] = useState(false)
+  const [scanning, setScanning] = useState(autoScan && scanSupported)
```

and pass it at the call site: `<QuickAddModal … autoScan={quickAddAutoScan} />`.

**d. Optional.** The two buttons in `.quick-add` ("Add to log" / "Scan
barcode") are now reachable from the sheet. Keeping them costs nothing on
desktop; hide them under 860px if you want the mobile screen cleaner.

---

## Step 5 — Day strip (`src/pages/Tracker.jsx`)

The strip is a shortcut, not a replacement: the calendar button on its right
opens the same native picker, so arbitrary dates stay one tap away. Swiping
left/right on the strip moves a day; it never goes past today.

```diff
+import DayStrip from '../components/DayStrip'

       <div className="page-header">
         <h1>Calorie Tracker</h1>
-        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
       </div>
+
+      <DayStrip date={date} onChange={setDate} loggedDates={loggedDates} />
```

`loggedDates` is the dot under each day. It's optional — pass nothing and the
dots stay hidden. To light them up, subscribe to the week's totals:

```jsx
const weekDates = useMemo(() => dateKeysBack(7), [])
const [loggedDates, setLoggedDates] = useState(new Set())

useEffect(() => {
  return subscribeToDailyTotals(user.uid, weekDates, (totals) => {
    setLoggedDates(new Set(Object.keys(totals).filter((d) => totals[d].total > 0)))
  })
}, [user.uid, weekDates])
```

(Add `dateKeysBack` and `subscribeToDailyTotals` to the existing import from
`../lib/calorieLog`.)

---

## Step 6 — Onboarding

Two new profile fields. In `src/lib/calorieLog.js`:

```js
export function setOnboarded(uid) {
  return setDoc(profileDoc(uid), { onboardedAt: new Date().toISOString() }, { merge: true })
}

export function setTrackers(uid, trackers) {
  return setDoc(profileDoc(uid), { trackers }, { merge: true })
}
```

Gate it in `PrivateRoute` so it covers every route, not just one page:

```jsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Onboarding from './Onboarding'
import { useAuth } from '../context/AuthContext'
import { subscribeToProfile } from '../lib/calorieLog'

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) return
    return subscribeToProfile(user.uid, setProfile)
  }, [user?.uid])

  if (loading) return <p className="page-loading">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (profile === null) return <p className="page-loading">Loading…</p>
  if (!profile.onboardedAt) return <Onboarding onDone={() => {}} />

  return children
}
```

`onDone` can stay empty — `setOnboarded` writes the profile, the snapshot
fires, and the gate falls away on its own. Keep whatever your current
`PrivateRoute` does for `loading`; the shape above is the pattern, not a
verbatim replacement.

One caution: this now blocks every route on a profile read. If that read
fails, users are stuck — treat an error from `subscribeToProfile` as
"already onboarded" rather than showing onboarding forever.

---

## Step 7 — Pattern cards (`src/pages/Stats.jsx`)

**a. Keep food names per day.** `subscribeToDailyTotals` currently throws
titles away. One line added:

```diff
     return onSnapshot(entriesCollection(uid, date), (snapshot) => {
       let total = 0
       const byCategory = {}
+      const titles = []
       snapshot.docs.forEach((d) => {
         const data = d.data()
         const amount = Number(data.calories || 0) * Number(data.servings || 1)
         total += amount
         const category = data.category || 'other'
         byCategory[category] = (byCategory[category] || 0) + amount
+        if (data.title) titles.push(data.title)
       })
-      totals[date] = { total, byCategory }
+      totals[date] = { total, byCategory, titles }
```

Also update `emptyDay` in Stats: `{ total: 0, byCategory: {}, titles: [] }`.

**b. Render it** after `<WeightTrendChart …>`:

```diff
+import SymptomPatterns from '../components/SymptomPatterns'

               <WeightTrendChart points={weightPoints} unit={weightUnit} />
+              <SymptomPatterns days={currentDays} wellness={wellness} range={range} />
```

**How the maths works** (`src/lib/patterns.js`, worth reading before you
ship it): for each food, it compares the flare rate on days you ate it
against the flare rate on days you didn't. That difference is the `lift`.
It refuses to report anything unless the food appears on ≥3 logged days,
is absent on ≥2, the window has ≥6 logged days, and the lift is ≥0.25.
Below those floors it says "keep logging" rather than inventing a finding.

Negative lift is surfaced too, as a **Calm** card — the foods that track
with good days. That's the half of this feature people actually act on.

The disclaimer at the bottom of the card is not decoration. This is a
correlation over a handful of days on one person; the card has to say so.

---

## Step 8 — Portion stepper (`src/components/QuickAddModal.jsx`)

```diff
+import PortionStepper from './PortionStepper'

-                <label>
-                  Servings
-                  <input
-                    type="number"
-                    min="0.25"
-                    step="0.25"
-                    value={form.servings}
-                    onChange={(e) => update('servings', e.target.value)}
-                  />
-                </label>
+                <PortionStepper value={form.servings} onChange={(v) => update('servings', v)} />
```

The stepper keeps a real `<input type="number">` between the − and + so
typing, keyboards and screen readers all still work — it just adds 44px
targets for thumbs.

Worth doing on the barcode result specifically: after a lookup you almost
always adjust the portion, and that's the one moment the keyboard is most
in the way.

---

## Notes on what I changed in your design, and why

- **Over-goal bars moved from red to `--accent-2 → --danger`.** Being over
  goal isn't an error; red on a food log reads as failure.
- **The ring renders at `goal = 0`.** It shows the running total and a
  prompt, so a new user doesn't meet a dead circle.
- **`.navbar-links` is hidden under 860px, not the whole navbar.** The brand
  and the logout control stay reachable.
- **The day strip keeps the native date input** behind a calendar button.
  Your `<input type="date">` handles "three weeks ago" in one tap; the strip
  only wins for the last few days.

---

# Part B — the visual swap

## Step 9 — Organic theme (`theme.css`)

This one is **not** appended at the end. Paste it immediately **after** your
`:root` block and before `.navbar` — they're token overrides, so they have to
land before the rules that read them. Your original `:root` stays; this wins
on source order.

What it does:

- **Cream ground** (`#f5ead8`), warm card (`#fbf7ef`), warm borders.
- **Your green kept** as `--accent`, exactly as you asked. Organic's
  terracotta drops to second voice — over-goal, symptoms, warnings.
- **Caprasimo everywhere**, Figtree for body.
- **Radii up** to 12 / 20 / 28, small controls fully pill. This is most of
  what makes Organic read as Organic.
- **Dark mode neutralised.** Leave your existing
  `@media (prefers-color-scheme: dark)` block where it is — `theme.css`
  contains a later block that resets those tokens to the light values. To
  bring dark back later, delete that one rule.

Two things to know about Caprasimo before you ship it:

1. **It has one weight (400) and no italic.** Your CSS asks for `600` on
   headings; against a single-weight face the browser synthesises a fake
   bold that looks like a printing fault. `theme.css` pins weight to 400
   everywhere it applies the face — don't reintroduce a weight.
2. **It runs large and wide for its point size.** `h1` drops 30px → 27px and
   the negative letter-spacing your Fraunces headings used is removed.

I left dense controls (form labels, severity pills, inputs, the long
`recipe-card-actions` links) in Figtree. Caprasimo at 11–13px turns to mud,
and the prototype doesn't use it there either.

**Check after pasting:** the goal input, the severity pills, and the tab
counts — those three sit at the small end of the scale and are where a
display face shows strain first.

---

## Step 10 — Recipes and community (`screens.css` + two small diffs)

Most of this is CSS — your cards already have the right bones. One JSX
change each.

**a. Community author gets a face.** In `CommunityRecipeCard.jsx`:

```diff
-        <p className="recipe-author">
-          {recipe.isStarter ? 'Starter recipe' : `Shared by ${recipe.authorName || 'a member'}`}
-        </p>
+        {recipe.isStarter ? (
+          <p className="recipe-author">Starter recipe</p>
+        ) : (
+          <div className="recipe-author-row">
+            <span className="recipe-author-avatar" aria-hidden="true">
+              {(recipe.authorName || 'M').charAt(0)}
+            </span>
+            <span className="recipe-author">{recipe.authorName || 'a member'}</span>
+          </div>
+        )}
```

**b. Saved state stops looking pressable.** Same file:

```diff
-            <button type="button" onClick={() => onSave(recipe)} disabled={saving}>
-              {saving ? 'Saving...' : 'Save to my recipes'}
-            </button>
+            <button
+              type="button"
+              className={saved ? 'saved' : undefined}
+              onClick={() => onSave(recipe)}
+              disabled={saving || saved}
+            >
+              {saving ? 'Saving…' : saved ? 'Saved to my recipes' : 'Save to my recipes'}
+            </button>
```

That needs a `saved` prop. In `Community.jsx`, track what's been saved this
session and pass it down:

```diff
+  const [savedIds, setSavedIds] = useState(new Set())

       await addRecipe(user.uid, toOwnRecipeFields(recipe), user.displayName || user.email)
+      setSavedIds((prev) => new Set(prev).add(recipe.id))

           <CommunityRecipeCard
             key={recipe.id}
+            saved={savedIds.has(recipe.id)}
```

The CSS also drops the recipe grid to **one column under 860px**. Two
150px-wide cards is worse than one good one.

---

## Step 11 — Recipe detail and settings

**a. Hero image** — `RecipeDetail.jsx`, above the `page-header`:

```jsx
<div className="recipe-detail-hero">
  {recipe.image ? (
    <img src={recipe.image} alt={recipe.title} />
  ) : (
    <div className={`recipe-card-placeholder cat-${recipe.category}`}>
      <span>{CATEGORY_LABELS[recipe.category] || 'Recipe'}</span>
    </div>
  )}
</div>
```

**b. Sticky actions on mobile** — wrap the existing `.form-actions` div in
the page header with `className="recipe-detail-actions"` instead. The CSS
pins it above the tab bar on a phone so "Log to today" is never scrolled
away on a long recipe.

**c. Macro bars** — in `RecipeView.jsx`, if you have protein/carbs/fat:

```jsx
<ul className="macro-list">
  {macros.map(({ label, grams, max }) => (
    <li className="macro-row" key={label}>
      <div className="macro-row-head">
        <span>{label}</span>
        <strong>{grams} g</strong>
      </div>
      <div className="macro-bar" aria-hidden="true">
        <div className="macro-bar-fill" style={{ width: `${Math.round((grams / max) * 100)}%` }} />
      </div>
    </li>
  ))}
</ul>
```

Where `max` is the largest of the three. Bars show proportion; three numbers
in a row don't, and proportion is the whole question with macros. **Skip this
if your recipes only store total calories** — don't invent macro data.

**d. Ingredient rows** — three columns so the calories form a scannable
column instead of trailing each name:

```jsx
<li className="ingredient-row" key={item.name}>
  <span className="ingredient-row-name">{item.name}</span>
  <span className="ingredient-row-qty">{item.quantity}</span>
  <span className="ingredient-row-cal">{item.calories}</span>
</li>
```

**e. Settings — this page does not exist in your app.** The goal input lives
on the tracker and logout lives in the navbar; there's no `Profile.jsx`. So
this is a new page, not a restyle: copy `Settings.jsx` to `src/pages/`, then

```diff
+import Settings from './pages/Settings'

+        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
```

It reads `subscribeToProfile` and writes through `setDailyCalorieGoal` — both
already in your `calorieLog.js`. The goal saves on blur rather than behind a
Save button, which is why the row can be a plain input.

The **Tracking** row is read-only — it displays `profile.trackers` from
onboarding (step 6). If you skipped step 6 it falls back to a sensible
default string. Make it editable only once step 6 is in.

Logout moved here because `mobile.css` hides `.navbar-links` under 860px.
Check that your `useAuth()` exposes `logout` under that name — if it's
`signOut`, rename it in `Settings.jsx`.

---

## Step 12 — Barcode scanner (`scan.css`)

Pure CSS, no JSX change. Your `BarcodeScanner.jsx` already renders
`.barcode-video-wrap` and `.barcode-hint`; the stylesheet adds the dark
camera well, the reticle and the sweep line as `::before` / `::after`
overlays on the wrapper.

They're decorative overlays with `pointer-events: none`, sitting above the
`<video>` html5-qrcode injects — they can't interfere with the decode loop.
The sweep respects `prefers-reduced-motion`.

Combined with step 4c (barcode opens scanning directly) and step 8 (portion
stepper), that's the barcode flow matching the prototype end to end.

---

## Step 13 — AI meal scan

You have this twice: `pages/MealScan.jsx` (the `/scan` route) and
`components/MealScan.jsx` (the modal). Same markup inside — apply both
changes to **both files**.

**a. The dropzone** is CSS only. `scan.css` gives it a 4:3 well, a camera
glyph, and a pulsing state while the model loads — which matters, because
the first scan downloads the classifier and currently shows nothing but a
line of text.

**b. The result should be a card, not a toast.** Your markup reuses
`.toast` for the recognition result. A toast is a transient notification;
this is a persistent thing you act on. One class, and pull the confidence
out as a badge:

```diff
         {result && (
-          <div className="toast">
-            Recognized "{result.label}" ({result.confidencePct}% confidence). Calories are a rough estimate for{' '}
-            {result.servingHint} — review and adjust below before logging.
-          </div>
+          <div className="scan-result">
+            <span>
+              <strong>{result.label}</strong>
+              Rough estimate for {result.servingHint} — check the numbers below before logging.
+            </span>
+            <span className="scan-result-confidence">{result.confidencePct}% sure</span>
+          </div>
         )}
```

**c. The three-up form row stacks on mobile.** CSS only — "meal type /
calories / servings" side by side is unusable at 390px.

One thing I did **not** change: the copy. "Calories are a rough estimate"
and the explicit "nothing is uploaded" are doing real work — the first sets
expectations on a model that will sometimes be wrong, the second is the
reason people will point a camera at their dinner. Keep both.

---

## Still not ported, deliberately

- **Recipe editing** (`RecipeForm.jsx`). It's a form; it inherits the theme
  for free from step 9 and needs nothing specific.
- **Login / signup pages.** Same — `.auth-card` already picks up the new
  radius and cream ground.
- **The prototype's community "save" animation.** Cosmetic.

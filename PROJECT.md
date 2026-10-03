# Calcounter - Project Documentation

A full-stack calorie tracking app with AI meal scanning, recipe management, and community sharing, built with React + Firebase.

## Architecture

### Frontend (React + Vite)
- **src/pages/** - Route-level components (Tracker, Stats, Community, etc.)
- **src/components/** - Reusable UI components with clear separation of concerns
- **src/hooks/** - Custom React hooks for state management and side effects
- **src/context/** - React Context for global state (Auth)
- **src/lib/** - Business logic, API integrations, and utilities
  - `calorieLog.js` - Meal entry CRUD and daily totals
  - `mealScan.js` - Cloud Function integration for AI meal analysis
  - `firebase.js` - Firebase initialization
  - `constants.js` - Application-wide constants and config
  - Other specialized utilities (exercises, wellness, recipes, etc.)

### Data Model (Firestore)
```
users/{uid}/
  recipes/{recipeId}              # User-created recipes
  logs/{yyyy-mm-dd}/entries/{id}  # Daily meal entries
  wellness/{yyyy-mm-dd}           # Weight, water, symptoms
  profile/settings                # User preferences (goals, units)

communityRecipes/{recipeId}       # Public recipe mirror
```

## Key Technologies
- **React 19** - UI framework with hooks
- **Firebase Auth** - Email/password authentication
- **Firestore** - Real-time database with security rules
- **Vite** - Build tool and dev server
- **TensorFlow.js + MobileNet** - Free on-device meal recognition
- **Cloud Functions** - Optional: AI-powered meal analysis
- **React Router v7** - Client-side routing with private routes

## Code Standards

### Naming Conventions
- React components: PascalCase (e.g., `QuickAddModal.jsx`)
- Files: kebab-case or PascalCase matching content
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- CSS classes: kebab-case

### Documentation
- JSDoc comments on exported functions and hooks (function signature, params, return, @remarks)
- Comments explain WHY, not WHAT (code is self-documenting via names)
- Error messages centralized in `src/lib/constants.js` (ERROR_MESSAGES)

### State Management
- Use `useState` for component-local state
- Extract related state into custom hooks (e.g., `useTrackerProfile`)
- Use `useMemo` for expensive computations
- Firestore subscriptions via `onSnapshot` with cleanup

### Error Handling
- Firebase error codes handled explicitly (map to user-friendly messages)
- Validation at form submission, not on every keystroke
- Errors displayed inline or via toast notifications

### Async Patterns
- `async/await` for database operations
- Always provide loading and error states to UI
- Disable submit buttons during submission

## Feature Highlights

### Meal Logging (src/pages/Tracker.jsx + src/components/QuickAddModal.jsx)
Three entry methods:
1. **Manual Entry** - Type food name, calories, servings
2. **Barcode Scan** - Quick lookup via Open Food Facts API
3. **Photo Scan** - AI meal estimation (on-device or Cloud Function)

### Recipe Management (src/pages/Recipes.jsx)
- Save recipes under categories (Breakfast, Lunch, Dinner, Dessert)
- Reuse recipes in daily logs
- Optional photo for each recipe
- Public/private sharing

### Trends & Stats (src/pages/Stats.jsx)
- 7-day and 30-day trends
- Calorie vs. goal chart
- Meal category breakdown
- Weight tracking

### Wellness Trackers (src/components/WellnessPanel.jsx)
- Water intake with unit conversion (glasses/ml/liters)
- Weight logging
- Symptoms and mood tracking
- Custom unit preferences

## Development Workflow

### Setup
```bash
cp .env.example .env
# Fill in Firebase config values
npm install
npm run dev
```

### Scripts
- `npm run dev` - Start dev server (hot reload)
- `npm run build` - Production build
- `npm run lint` - Run oxlint (fast linter)
- `npm run preview` - Preview production build locally

### Environment Variables
Required (set in `.env`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Common Tasks

### Adding a New Feature
1. Create page component in `src/pages/` if route-level
2. Create reusable components in `src/components/`
3. Add database functions to `src/lib/calorieLog.js` or create new lib file
4. Add route in `src/App.jsx`
5. Wrap in `<PrivateRoute>` if authentication required

### Database Operations
```javascript
import { addLogEntry, subscribeToLogEntries } from '../lib/calorieLog'

// Write
await addLogEntry(uid, date, { title, calories, servings })

// Subscribe (real-time)
const unsubscribe = subscribeToLogEntries(uid, date, (entries) => {
  setEntries(entries)
})
return unsubscribe // cleanup
```

### Error Handling Pattern
```javascript
try {
  const result = await someAsyncOperation()
} catch (err) {
  if (err.code === FIREBASE_ERROR_CODES.UNAUTHENTICATED) {
    setError(ERROR_MESSAGES.SIGN_IN_REQUIRED)
  } else {
    setError(err.message || 'Something went wrong')
  }
}
```

## Testing Notes
- Vitest + React Testing Library cover the pure logic in `src/lib/` (date
  formatting, auth error mapping, Open Food Facts normalization, food-label
  keyword matching) and Firestore aggregation in `calorieLog.js` (Firebase
  SDK mocked), plus `CalorieRing` and `ErrorBoundary` as components. Run with
  `npm run test`. CI runs lint + test + build on every push/PR via GitHub
  Actions (`.github/workflows/ci.yml`).
- Not covered yet: Firestore security rules, end-to-end UI flows.
- Manual testing covers:
  - CRUD operations on log entries, recipes, profile
  - Real-time sync across tabs/devices
  - Offline behavior (PWA cache)
  - Mobile responsiveness

## Performance Considerations
- Firestore queries indexed on `(uid, date, loggedAt)` for fast lookups
- On-device ML (TensorFlow.js) avoids API calls for meal photos
- PWA cache strategy for offline usage
- Toast notifications auto-dismiss after 3 seconds

## Security
- Firestore security rules restrict data access to authenticated users
- Each user can only read/write their own data
- Community recipes are read-only for non-owners
- No sensitive data stored client-side (passwords handled by Firebase Auth)

## Future Enhancements
- Firestore security rules tests (`@firebase/rules-unit-testing` + emulator)
- End-to-end tests through the UI
- Social features (follow friends, compare stats)
- Export data (CSV, PDF reports)
- Meal suggestions based on history

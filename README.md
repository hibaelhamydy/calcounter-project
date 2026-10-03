# Calcounter - Recipe & Calorie Tracker

[![CI](https://github.com/hibaelhamydy/calcounter/actions/workflows/ci.yml/badge.svg)](https://github.com/hibaelhamydy/calcounter/actions/workflows/ci.yml)

A full-stack web application for tracking daily nutrition and recipes with AI-powered meal scanning. Built with modern React, Firebase, and TensorFlow.js for real-time cloud synchronization and offline-first PWA support.

## Key Features

- 📖 **Recipe Management** - Save recipes organized by meal type (Breakfast, Lunch, Dinner, Dessert) with photos and nutritional info
- 📊 **Daily Tracking** - Log meals in real-time with visual calorie goal progress and meal category breakdowns
- 🔍 **Smart Meal Entry** - Three ways to log food:
  - **Manual entry** for quick one-off items
  - **Barcode scanning** via Open Food Facts API
  - **Photo scanning** with on-device ML (TensorFlow.js/MobileNet) for instant calorie estimates
- 🏥 **Wellness Dashboard** - Track weight, water intake, symptoms, mood, and exercise alongside calories
- 📈 **Analytics** - View 7-day and 30-day trends, calories vs. goals, and meal category analytics
- 👥 **Community** - Browse and share recipes publicly; like and use recipes from other users
- 📱 **Installable PWA** - Full offline support; install to home screen on any device for a native-like experience
- 🔐 **Private & Secure** - All data is per-user, encrypted in transit, and protected by Firestore security rules

## Tech Stack

### Frontend
- **[React 19](https://react.dev/)** - Modern UI framework with concurrent features
- **[Vite 8](https://vite.dev/)** - Lightning-fast build tool and dev server
- **[React Router v7](https://reactrouter.com/)** - Client-side routing with private route guards
- **[TensorFlow.js](https://www.tensorflow.org/js) + MobileNet** - Free, on-device image classification for meal recognition

### Backend & Cloud
- **[Firebase Auth](https://firebase.google.com/docs/auth)** - Email/password authentication
- **[Firestore](https://firebase.google.com/docs/firestore)** - Real-time NoSQL database with security rules
- **[Cloud Functions](https://firebase.google.com/docs/functions)** - Optional serverless backend for AI meal analysis

### Integrations
- **[Open Food Facts API](https://world.openfoodfacts.org/)** - Free nutrition database for barcode lookups

### PWA & Offline
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** - Installable app + offline-first caching strategy

## Setup

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project.
2. Under **Build > Authentication**, enable the **Email/Password** sign-in provider.
3. Under **Build > Firestore Database**, create a database (production mode is fine — this repo ships its own security rules).
4. Under **Project settings > General**, add a Web app and copy the config values.

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values from your Firebase web app config:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Deploy Firestore security rules

Rules in `firestore.rules` restrict every document under `users/{uid}` so only that
signed-in user can read or write their own data, and allow any signed-in user to read
(and only the owner to write) the shared `communityRecipes` collection. Deploy them with the
[Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open the printed local URL, sign up for an account, and start adding recipes.

### 5. (Optional) Enable the higher-accuracy AI meal scan

The free, on-device meal photo scanner (MobileNet) works out of the box with no setup.
For a more accurate photo-based estimate, see `functions/index.js` — it requires
upgrading the Firebase project to the Blaze plan and configuring appropriate API
credentials, then `firebase deploy --only functions`.

### 6. Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Open the hosted `https://` URL on your phone and use "Install app" (Android/Chrome) or
"Add to Home Screen" (iOS/Safari) to install it as a standalone app.

## Data model

```
users/{uid}/recipes/{recipeId}
  title, category (breakfast|lunch|dinner|dessert), calories, servings,
  ingredients, instructions, notes, image, isPublic, createdAt

users/{uid}/logs/{yyyy-mm-dd}/entries/{entryId}
  recipeId, title, calories, category, servings, loggedAt

users/{uid}/wellness/{yyyy-mm-dd}
  weight, water, symptoms, symptomNote

users/{uid}/profile/settings
  dailyCalorieGoal, waterGoal, weightUnit

communityRecipes/{recipeId}
  a public mirror of any recipe its owner has marked shareable (isPublic: true)
```

## Available scripts

- `npm run dev` – start the local dev server
- `npm run build` – production build to `dist/`
- `npm run preview` – preview the production build locally
- `npm run lint` – run oxlint
- `npm run test` – run the Vitest unit/component test suite once
- `npm run test:watch` – run tests in watch mode while developing
- `node scripts/generate-icons.mjs` – regenerate PWA/favicon PNGs from `icon-source.svg`

## Testing

Unit tests cover the pure business logic in `src/lib/` (date formatting, auth
error mapping, Open Food Facts response normalization, the MobileNet
keyword-matching table, and Firestore aggregation logic in `calorieLog.js`,
with the Firebase SDK mocked). Component tests use React Testing Library for
`CalorieRing` and `ErrorBoundary`.

```bash
npm run test
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint, tests, and
a production build on every push and pull request against `main`.

Not yet covered: Firestore security rules (would need
`@firebase/rules-unit-testing` against the emulator) and end-to-end flows
through the UI. Good next additions if you keep building on this.

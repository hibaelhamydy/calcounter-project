import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import Community from './pages/Community'
import CommunityRecipeDetail from './pages/CommunityRecipeDetail'
import EditRecipe from './pages/EditRecipe'
import Login from './pages/Login'
import MealScan from './pages/MealScan'
import NewRecipe from './pages/NewRecipe'
import Onboarding from './pages/Onboarding'
import RecipeDetail from './pages/RecipeDetail'
import Recipes from './pages/Recipes'
import Settings from './pages/Settings'
import Signup from './pages/Signup'
import Stats from './pages/Stats'
import Tracker from './pages/Tracker'

// Signed-out visitors land on the onboarding flow instead of being bounced
// straight to the login form; signed-in users see the normal home page.
function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading">Loading...</div>
  return user ? <Recipes /> : <Onboarding />
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<HomeRoute />} />
        <Route
          path="/recipes/new"
          element={
            <PrivateRoute>
              <NewRecipe />
            </PrivateRoute>
          }
        />
        <Route
          path="/recipes/:id"
          element={
            <PrivateRoute>
              <RecipeDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/recipes/:id/edit"
          element={
            <PrivateRoute>
              <EditRecipe />
            </PrivateRoute>
          }
        />
        <Route
          path="/tracker"
          element={
            <PrivateRoute>
              <Tracker />
            </PrivateRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <PrivateRoute>
              <Stats />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/scan"
          element={
            <PrivateRoute>
              <MealScan />
            </PrivateRoute>
          }
        />
        <Route
          path="/community"
          element={
            <PrivateRoute>
              <Community />
            </PrivateRoute>
          }
        />
        <Route
          path="/community/:id"
          element={
            <PrivateRoute>
              <CommunityRecipeDetail />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

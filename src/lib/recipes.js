import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Recipe management for user-created and community recipes.
 *
 * User recipes are stored in users/{uid}/recipes. Community recipes are
 * published to a public communityRecipes collection when isPublic is set.
 */

const recipesCollection = (uid) => collection(db, 'users', uid, 'recipes')
const communityCollection = () => collection(db, 'communityRecipes')
const communityDoc = (recipeId) => doc(db, 'communityRecipes', recipeId)

/**
 * Extracts public fields from a recipe for community sharing.
 * Ensures no private data is exposed.
 *
 * @private
 */
function communityFields(uid, authorName, recipe) {
  return {
    title: recipe.title,
    category: recipe.category,
    calories: recipe.calories,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.notes,
    image: recipe.image || '',
    authorId: uid,
    authorName: authorName || 'A member',
  }
}

/**
 * Subscribes to all recipes for a user, ordered by newest first.
 *
 * @param {string} uid - The user's UID
 * @param {Function} onChange - Called with array of recipes on updates
 * @param {Function} onError - Called if subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRecipes(uid, onChange, onError) {
  const q = query(recipesCollection(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => {
      const recipes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      onChange(recipes)
    },
    onError,
  )
}

/**
 * Subscribes to a single recipe by ID.
 *
 * @param {string} uid - The user's UID
 * @param {string} recipeId - The recipe document ID
 * @param {Function} onChange - Called with recipe object or null if not found
 * @param {Function} onError - Called if subscription fails
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRecipe(uid, recipeId, onChange, onError) {
  return onSnapshot(
    doc(db, 'users', uid, 'recipes', recipeId),
    (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  )
}

// Community library: a top-level mirror of any recipe its owner has marked
// public, keyed by the same id as the private recipe so edits/deletes stay
// in sync and a shared copy still links back to /recipes/:id/edit for its owner.
export function subscribeToCommunityRecipes(onChange, onError) {
  const q = query(communityCollection(), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

export function subscribeToCommunityRecipe(recipeId, onChange, onError) {
  return onSnapshot(
    communityDoc(recipeId),
    (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError,
  )
}

export async function addRecipe(uid, recipe, authorName) {
  const ref = doc(recipesCollection(uid))
  await setDoc(ref, { ...recipe, createdAt: serverTimestamp() })
  if (recipe.isPublic) {
    await setDoc(communityDoc(ref.id), {
      ...communityFields(uid, authorName, recipe),
      createdAt: serverTimestamp(),
    })
  }
  return ref
}

export async function updateRecipe(uid, recipeId, recipe, authorName) {
  await updateDoc(doc(db, 'users', uid, 'recipes', recipeId), recipe)
  const ref = communityDoc(recipeId)
  if (recipe.isPublic) {
    const existing = await getDoc(ref)
    const payload = { ...communityFields(uid, authorName, recipe), updatedAt: serverTimestamp() }
    if (!existing.exists()) payload.createdAt = serverTimestamp()
    await setDoc(ref, payload, { merge: true })
  } else {
    await deleteDoc(ref).catch(() => {})
  }
}

// Picks just the editable recipe fields off a starter/community recipe so it
// can be copied into a user's own collection via addRecipe, dropping
// ownership/meta fields like id, authorId, isStarter, createdAt.
export function toOwnRecipeFields(recipe) {
  const { title, category, calories, servings, ingredients, instructions, notes, image } = recipe
  // Firestore rejects `undefined` field values outright, and starter recipes
  // in particular don't define an `image` field at all - default every
  // optional string field so this never throws regardless of the source.
  return {
    title,
    category,
    calories,
    servings,
    ingredients: ingredients || '',
    instructions: instructions || '',
    notes: notes || '',
    image: image || '',
    isPublic: false,
  }
}

export async function deleteRecipe(uid, recipeId) {
  await deleteDoc(doc(db, 'users', uid, 'recipes', recipeId))
  await deleteDoc(communityDoc(recipeId)).catch(() => {})
}

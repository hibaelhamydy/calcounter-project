// Free, fully client-side meal recognition: MobileNet (pretrained on ImageNet)
// runs entirely in the browser via TensorFlow.js - no server, no API key, no
// per-scan cost, and the photo never leaves the device. Both libraries are
// dynamically imported so their ~1MB+ weight only loads for users who
// actually use the scan feature, not on every app load.
//
// Trade-off vs. a vision-LLM: MobileNet classifies into ImageNet's 1000
// general categories rather than a food-specific dataset, so it only
// recognizes a few dozen common single-food items well and does not attempt
// to interpret mixed plates. Calories come from a small hardcoded lookup
// table below (rough, per-typical-serving figures), not real nutrition data.

let modelPromise = null

function loadModel() {
  if (!modelPromise) {
    modelPromise = Promise.all([import('@tensorflow/tfjs'), import('@tensorflow-models/mobilenet')]).then(
      ([, mobilenet]) => mobilenet.load({ version: 2, alpha: 1.0 }),
    )
  }
  return modelPromise
}

// Keyword -> rough calorie estimate for a typical single serving. Matched as
// a case-insensitive substring against MobileNet's ImageNet class names
// (which are themselves comma-separated synonym lists, e.g.
// "hotdog, hot dog, red hot"), so exact label punctuation doesn't matter.
const FOOD_TABLE = [
  { keyword: 'cheeseburger', label: 'Cheeseburger', calories: 300, serving: '1 burger' },
  { keyword: 'hotdog', label: 'Hot dog', calories: 150, serving: '1 hot dog' },
  { keyword: 'hot dog', label: 'Hot dog', calories: 150, serving: '1 hot dog' },
  { keyword: 'pizza', label: 'Pizza', calories: 285, serving: '1 slice' },
  { keyword: 'guacamole', label: 'Guacamole', calories: 50, serving: '2 tbsp' },
  { keyword: 'pretzel', label: 'Pretzel', calories: 380, serving: '1 soft pretzel' },
  { keyword: 'bagel', label: 'Bagel', calories: 250, serving: '1 bagel' },
  { keyword: 'french loaf', label: 'French bread', calories: 80, serving: '1 slice' },
  { keyword: 'mashed potato', label: 'Mashed potato', calories: 215, serving: '1 cup' },
  { keyword: 'ice cream', label: 'Ice cream', calories: 137, serving: '1 scoop' },
  { keyword: 'ice lolly', label: 'Ice lolly / popsicle', calories: 60, serving: '1 pop' },
  { keyword: 'trifle', label: 'Trifle', calories: 300, serving: '1 cup' },
  { keyword: 'burrito', label: 'Burrito', calories: 450, serving: '1 burrito' },
  { keyword: 'meat loaf', label: 'Meatloaf', calories: 280, serving: '1 slice' },
  { keyword: 'meatloaf', label: 'Meatloaf', calories: 280, serving: '1 slice' },
  { keyword: 'potpie', label: 'Pot pie', calories: 500, serving: '1 pie' },
  { keyword: 'espresso', label: 'Espresso', calories: 3, serving: '1 shot' },
  { keyword: 'eggnog', label: 'Eggnog', calories: 343, serving: '1 cup' },
  { keyword: 'red wine', label: 'Red wine', calories: 125, serving: '5 oz glass' },
  { keyword: 'consomme', label: 'Consomme', calories: 30, serving: '1 cup' },
  { keyword: 'carbonara', label: 'Carbonara', calories: 380, serving: '1 cup' },
  { keyword: 'chocolate sauce', label: 'Chocolate sauce', calories: 100, serving: '2 tbsp' },
  { keyword: 'broccoli', label: 'Broccoli', calories: 55, serving: '1 cup' },
  { keyword: 'cauliflower', label: 'Cauliflower', calories: 25, serving: '1 cup' },
  { keyword: 'head cabbage', label: 'Cabbage', calories: 22, serving: '1 cup' },
  { keyword: 'mushroom', label: 'Mushrooms', calories: 15, serving: '1 cup' },
  { keyword: 'zucchini', label: 'Zucchini', calories: 20, serving: '1 cup' },
  { keyword: 'cucumber', label: 'Cucumber', calories: 16, serving: '1 cup' },
  { keyword: 'bell pepper', label: 'Bell pepper', calories: 24, serving: '1 medium' },
  { keyword: 'artichoke', label: 'Artichoke', calories: 60, serving: '1 medium' },
  { keyword: 'granny smith', label: 'Apple', calories: 95, serving: '1 medium' },
  { keyword: 'banana', label: 'Banana', calories: 105, serving: '1 medium' },
  { keyword: 'strawberry', label: 'Strawberries', calories: 50, serving: '1 cup' },
  { keyword: 'orange', label: 'Orange', calories: 62, serving: '1 medium' },
  { keyword: 'lemon', label: 'Lemon', calories: 17, serving: '1 medium' },
  { keyword: 'fig', label: 'Fig', calories: 37, serving: '1 medium' },
  { keyword: 'pineapple', label: 'Pineapple', calories: 82, serving: '1 cup' },
  { keyword: 'pomegranate', label: 'Pomegranate', calories: 105, serving: '1 medium' },
  { keyword: 'jackfruit', label: 'Jackfruit', calories: 155, serving: '1 cup' },
  { keyword: 'custard apple', label: 'Custard apple', calories: 101, serving: '1 medium' },
]

// Pulled out of classifyFoodImage so the keyword-matching rules can be unit
// tested directly against MobileNet-shaped prediction objects, without
// loading TensorFlow or a real model in the test environment.
export function matchPrediction(prediction) {
  const className = prediction.className.toLowerCase()
  const match = FOOD_TABLE.find((entry) => className.includes(entry.keyword))
  if (!match) return null
  return {
    label: match.label,
    caloriesPerServing: match.calories,
    servingHint: match.serving,
    confidencePct: Math.round(prediction.probability * 100),
  }
}

export async function classifyFoodImage(imgElement) {
  const model = await loadModel()
  const predictions = await model.classify(imgElement, 5)

  for (const prediction of predictions) {
    const match = matchPrediction(prediction)
    if (match) return match
  }
  return null
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read that image.'))
    img.src = URL.createObjectURL(file)
  })
}

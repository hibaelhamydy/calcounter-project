import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { z } from 'zod'

initializeApp()

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

// Keeps a runaway client bug (or abuse) from turning into a surprise bill -
// each scan costs real money against the Anthropic API.
const DAILY_SCAN_LIMIT = 15
const MAX_IMAGE_BASE64_LENGTH = 2_000_000 // ~1.5MB decoded; well above what the client sends

const MealEstimateSchema = z.object({
  foodName: z.string().describe('A short, human-readable name for the food or meal shown in the photo'),
  caloriesPerServing: z.number().describe('Best-guess calories for a single serving of what is shown'),
  confidence: z.enum(['low', 'medium', 'high']).describe('How confident this estimate is'),
  notes: z
    .string()
    .describe('One short sentence explaining what drove the estimate, or its main source of uncertainty'),
})

export const estimateMealCalories = onCall({ secrets: [anthropicApiKey], cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to use meal scanning.')
  }

  const imageBase64 = request.data?.image
  const mediaType = request.data?.mediaType || 'image/jpeg'
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new HttpsError('invalid-argument', 'No image provided.')
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    throw new HttpsError('invalid-argument', 'Image is too large.')
  }

  await enforceDailyLimit(request.auth.uid)

  const client = new Anthropic({ apiKey: anthropicApiKey.value() })

  let response
  try {
    // Structured outputs (.parse()) are a beta surface as of @anthropic-ai/sdk
    // 0.70.x - client.beta.messages.parse(), not the stable client.messages.
    response = await client.beta.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            {
              type: 'text',
              text: 'Identify the food or meal in this photo and estimate its calories for a single serving. Give your best estimate even if you are not fully certain, and reflect your uncertainty honestly in "confidence" and "notes".',
            },
          ],
        },
      ],
      output_format: betaZodOutputFormat(MealEstimateSchema),
    })
  } catch (err) {
    console.error('Anthropic API error', err)
    throw new HttpsError('internal', 'Could not analyze that photo. Try again.')
  }

  if (!response.parsed) {
    throw new HttpsError('internal', 'Could not parse an estimate from that photo.')
  }

  return response.parsed
})

async function enforceDailyLimit(uid) {
  const db = getFirestore()
  const ref = db.doc(`users/${uid}/profile/settings`)
  const today = new Date().toLocaleDateString('en-CA')

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.data() || {}
    const count = data.aiScanDate === today ? data.aiScanCount || 0 : 0
    if (count >= DAILY_SCAN_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        `You've reached today's limit of ${DAILY_SCAN_LIMIT} AI meal scans. Try again tomorrow.`,
      )
    }
    tx.set(ref, { aiScanDate: today, aiScanCount: count + 1 }, { merge: true })
  })
}

// Correlates logged foods against flare days (any symptom at moderate+).
//
// This is deliberately conservative. It reports a pattern only when there is
// enough contrast to mean anything: the food must appear on at least
// `minDays` logged days AND be absent on at least two, and the whole window
// needs at least `minWindow` logged days. Below that it returns `ready:false`
// so the UI can say "keep logging" instead of inventing a finding.
//
// It is a correlation over one person's small sample — never a diagnosis.
// The UI must say so.

const MIN_DAYS = 3
const MIN_WINDOW = 6
const STRONG_LIFT = 0.5
const POSSIBLE_LIFT = 0.25

export function isFlareDay(wellnessForDate) {
  const symptoms = wellnessForDate?.symptoms
  return !!symptoms && Object.values(symptoms).some((severity) => severity >= 2)
}

function normalise(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findSymptomPatterns(days, wellness, options = {}) {
  const minDays = options.minDays ?? MIN_DAYS
  const minWindow = options.minWindow ?? MIN_WINDOW
  const topN = options.topN ?? 3

  const logged = days.filter((day) => (day.titles || []).length > 0)

  if (logged.length < minWindow) {
    return { ready: false, loggedDays: logged.length, needed: minWindow - logged.length, patterns: [] }
  }

  const flareDays = logged.filter((day) => isFlareDay(wellness[day.date]))
  if (flareDays.length === 0) {
    return { ready: true, loggedDays: logged.length, flareDays: 0, patterns: [] }
  }

  // food key -> { label, days, flares }
  const index = new Map()
  logged.forEach((day) => {
    const flare = isFlareDay(wellness[day.date])
    const seen = new Set()
    day.titles.forEach((title) => {
      const key = normalise(title)
      if (!key || seen.has(key)) return
      seen.add(key)
      const record = index.get(key) || { label: title, days: 0, flares: 0 }
      record.days += 1
      if (flare) record.flares += 1
      index.set(key, record)
    })
  })

  const totalFlares = flareDays.length
  const patterns = []

  index.forEach((record, key) => {
    const without = logged.length - record.days
    if (record.days < minDays || without < 2) return

    const withRate = record.flares / record.days
    const withoutRate = (totalFlares - record.flares) / without
    const lift = withRate - withoutRate
    const magnitude = Math.abs(lift)
    if (magnitude < POSSIBLE_LIFT) return

    patterns.push({
      key,
      label: record.label,
      days: record.days,
      flares: record.flares,
      withRate,
      withoutRate,
      lift,
      tone: lift > 0 ? 'warn' : 'calm',
      strength:
        lift < 0 ? 'Calm' : magnitude >= STRONG_LIFT && record.days >= 4 ? 'Strong' : 'Possible',
    })
  })

  patterns.sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift))

  return {
    ready: true,
    loggedDays: logged.length,
    flareDays: totalFlares,
    patterns: patterns.slice(0, topN),
  }
}

export function describePattern(pattern) {
  const dayWord = pattern.days === 1 ? 'day' : 'days'
  if (pattern.tone === 'calm') {
    return `No moderate symptoms on ${pattern.days - pattern.flares} of the ${pattern.days} ${dayWord} this appeared. Worth keeping in rotation.`
  }
  return `Symptoms hit moderate or worse on ${pattern.flares} of the ${pattern.days} ${dayWord} you ate this, against ${Math.round(pattern.withoutRate * 100)}% of other days.`
}

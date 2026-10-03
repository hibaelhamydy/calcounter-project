import { useEffect, useMemo, useState } from 'react'
import CalorieTrendChart from '../components/CalorieTrendChart'
import CategoryShareChart from '../components/CategoryShareChart'
import WeightTrendChart from '../components/WeightTrendChart'
import ExerciseTrendChart from '../components/ExerciseTrendChart'
import { useAuth } from '../context/AuthContext'
import { dateKeysBack, subscribeToDailyTotals, subscribeToProfile } from '../lib/calorieLog'
import { subscribeToWellnessRange } from '../lib/wellness'
import { subscribeToExerciseTotals } from '../lib/exerciseLog'

const RANGES = [
  { key: 7, label: '7 days' },
  { key: 30, label: '30 days' },
]

const WATER_UNIT_LABELS = { glasses: 'glasses', ml: 'ml', l: 'L' }

function emptyDay(entry) {
  return entry || { total: 0, byCategory: {} }
}

export default function Stats() {
  const { user } = useAuth()
  const [range, setRange] = useState(7)
  const [dailyTotals, setDailyTotals] = useState({})
  const [wellness, setWellness] = useState({})
  const [exerciseTotals, setExerciseTotals] = useState({})
  const [goal, setGoal] = useState(0)
  const [waterGoal, setWaterGoalState] = useState(8)
  const [waterUnit, setWaterUnitState] = useState('glasses')
  const [weightUnit, setWeightUnitState] = useState('kg')
  const [loading, setLoading] = useState(true)

  const dates = useMemo(() => dateKeysBack(range * 2), [range])

  useEffect(() => {
    const unsubscribe = subscribeToDailyTotals(user.uid, dates, (totals) => {
      setDailyTotals(totals)
      setLoading(false)
    })
    return unsubscribe
  }, [user.uid, dates])

  useEffect(() => {
    return subscribeToWellnessRange(user.uid, dates, setWellness)
  }, [user.uid, dates])

  useEffect(() => {
    return subscribeToExerciseTotals(user.uid, dates, setExerciseTotals)
  }, [user.uid, dates])

  useEffect(() => {
    return subscribeToProfile(user.uid, (profile) => {
      setGoal(Number(profile.dailyCalorieGoal) || 0)
      setWaterGoalState(Number(profile.waterGoal) || 8)
      setWaterUnitState(profile.waterUnit || 'glasses')
      setWeightUnitState(profile.weightUnit || 'kg')
    })
  }, [user.uid])

  const previousDates = dates.slice(0, range)
  const currentDates = dates.slice(range)

  const currentDays = currentDates.map((date) => ({ date, ...emptyDay(dailyTotals[date]) }))
  const currentTotals = currentDays.map((d) => d.total)
  const previousTotals = previousDates.map((date) => emptyDay(dailyTotals[date]).total)

  const daysLogged = currentTotals.filter((t) => t > 0).length
  const avgCurrent = daysLogged ? Math.round(currentTotals.reduce((a, b) => a + b, 0) / daysLogged) : 0

  const daysLoggedPrev = previousTotals.filter((t) => t > 0).length
  const avgPrevious = daysLoggedPrev ? Math.round(previousTotals.reduce((a, b) => a + b, 0) / daysLoggedPrev) : 0
  const avgDelta = daysLogged && daysLoggedPrev ? avgCurrent - avgPrevious : null

  let streak = 0
  if (goal > 0) {
    for (let i = currentDays.length - 1; i >= 0; i--) {
      const total = currentDays[i].total
      if (total > 0 && total <= goal) streak++
      else break
    }
  }

  const categoryTotals = {}
  currentDays.forEach(({ byCategory }) => {
    Object.entries(byCategory).forEach(([cat, amount]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount
    })
  })

  const totalExerciseCalories = Object.values(exerciseTotals).reduce((sum, e) => sum + e.caloriesBurned, 0)
  if (totalExerciseCalories > 0) {
    categoryTotals.workouts = totalExerciseCalories
  }

  const hasCalorieData = currentTotals.some((t) => t > 0)

  const weightPoints = currentDates
    .filter((date) => wellness[date]?.weight != null)
    .map((date) => ({ date, weight: wellness[date].weight }))

  const waterValues = currentDates.map((date) => Number(wellness[date]?.water) || 0)
  const waterDaysLogged = waterValues.filter((w) => w > 0).length
  const avgWater = waterDaysLogged ? Math.round((waterValues.reduce((a, b) => a + b, 0) / waterDaysLogged) * 10) / 10 : 0

  const flareDays = currentDates.filter((date) => {
    const symptoms = wellness[date]?.symptoms
    return symptoms && Object.values(symptoms).some((severity) => severity >= 2)
  }).length

  const hasWellnessData = weightPoints.length > 0 || waterDaysLogged > 0 || flareDays > 0

  const moodDaysLogged = currentDates.filter((date) => wellness[date]?.mood != null).length
  const moodAvg = moodDaysLogged ? Math.round((currentDates.reduce((sum, date) => sum + (wellness[date]?.mood ?? 0), 0) / moodDaysLogged) * 10) / 10 : null

  const correlations = useMemo(() => {
    const corrs = []

    if (daysLogged >= 3 && waterDaysLogged >= 3) {
      const waterToCalRatio = Math.round((waterValues.reduce((a, b) => a + b, 0) / waterDaysLogged) / (currentTotals.reduce((a, b) => a + b, 0) / daysLogged || 1) * 100)
      if (waterToCalRatio < 80) corrs.push({ type: 'water-cal', insight: 'Low water intake relative to calories — try staying more hydrated on high-cal days.' })
      if (waterToCalRatio > 120) corrs.push({ type: 'water-cal', insight: 'High water intake relative to calories — keep it up!' })
    }

    if (flareDays >= 2 && daysLogged >= 5) {
      const flareAvgCal = Math.round(
        currentDates
          .filter((date) => wellness[date]?.symptoms && Object.values(wellness[date].symptoms).some((s) => s >= 2))
          .reduce((sum, date) => sum + (dailyTotals[date]?.total ?? 0), 0) / Math.max(1, flareDays),
      )
      const nonFlareAvgCal = Math.round(
        currentDates
          .filter((date) => !wellness[date]?.symptoms || !Object.values(wellness[date].symptoms).some((s) => s >= 2))
          .reduce((sum, date) => sum + (dailyTotals[date]?.total ?? 0), 0) / Math.max(1, daysLogged - flareDays),
      )
      if (flareAvgCal > nonFlareAvgCal * 1.1) {
        corrs.push({ type: 'cal-flare', insight: `Flare days average ${flareAvgCal} cal vs ${nonFlareAvgCal} cal otherwise — food volume may be a trigger.` })
      }
    }

    if (moodDaysLogged >= 3 && daysLogged >= 3) {
      const moodToWaterCorr = currentDates.slice(0, 3).every((date) => (wellness[date]?.mood ?? 0) > 2 && waterValues[currentDates.indexOf(date)] > (waterGoal * 0.8))
      if (moodToWaterCorr) corrs.push({ type: 'mood-water', insight: 'Your best moods align with good hydration — water intake matters for how you feel.' })
    }

    if (weightPoints.length >= 4) {
      const recentAvgCal = Math.round(currentTotals.slice(-3).reduce((a, b) => a + b, 0) / 3)
      const priorAvgCal = Math.round(currentTotals.slice(0, 3).reduce((a, b) => a + b, 0) / 3)
      const recentWeight = weightPoints[weightPoints.length - 1].weight
      const priorWeight = weightPoints[0].weight
      const weightDelta = Math.round((recentWeight - priorWeight) * 10) / 10
      if (Math.abs(weightDelta) > 0.5) {
        const trend = recentAvgCal > priorAvgCal ? 'increased' : 'decreased'
        const direction = weightDelta > 0 ? 'up' : 'down'
        corrs.push({ type: 'cal-weight', insight: `Calories ${trend} and weight went ${direction} — the trend is tracking.` })
      }
    }

    return corrs
  }, [daysLogged, waterDaysLogged, waterValues, waterGoal, flareDays, currentDates, currentTotals, wellness, dailyTotals, moodDaysLogged, weightPoints])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stats</h1>
        <div className="tabs">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={r.key === range ? 'tab active' : 'tab'}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading stats...</p>}

      {!loading && !hasCalorieData && (
        <div className="empty-state">
          <p>No calories logged in the last {range} days yet.</p>
          <p>Log a meal from your recipes or the tracker to see your trends here.</p>
        </div>
      )}

      {!loading && hasCalorieData && (
        <>
          <div className="stat-tile-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Avg. daily calories</span>
              <span className="stat-tile-value">{avgCurrent.toLocaleString()}</span>
              {avgDelta != null && avgDelta !== 0 && (
                <span className={avgDelta > 0 ? 'stat-tile-delta up' : 'stat-tile-delta down'}>
                  {avgDelta > 0 ? '▲' : '▼'} {Math.abs(avgDelta).toLocaleString()} vs previous {range} days
                </span>
              )}
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Days logged</span>
              <span className="stat-tile-value">
                {daysLogged}
                <span className="stat-tile-value-sub">/{range}</span>
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Goal streak</span>
              <span className="stat-tile-value">
                {goal > 0 ? streak : '—'}
                {goal > 0 && <span className="stat-tile-value-sub"> day{streak === 1 ? '' : 's'}</span>}
              </span>
              {goal === 0 && <span className="stat-tile-delta">Set a daily goal in Tracker to track this</span>}
            </div>
          </div>

          <CalorieTrendChart days={currentDays} goal={goal} />
          <CategoryShareChart totals={categoryTotals} />
        </>
      )}

      {!loading && (
        <>
          <h2 className="stats-section-title">Progress</h2>
          {!hasWellnessData ? (
            <div className="empty-state">
              <p>No weight, water, or symptoms logged in the last {range} days yet.</p>
              <p>Track them from the Calorie Tracker page to see your progress here.</p>
            </div>
          ) : (
            <>
              <div className="stat-tile-row">
                <div className="stat-tile">
                  <span className="stat-tile-label">Latest weight</span>
                  <span className="stat-tile-value">
                    {weightPoints.length ? weightPoints[weightPoints.length - 1].weight : '—'}
                    {weightPoints.length > 0 && <span className="stat-tile-value-sub"> {weightUnit}</span>}
                  </span>
                  {weightPoints.length >= 2 && (
                    <span
                      className={
                        weightPoints[weightPoints.length - 1].weight - weightPoints[0].weight > 0
                          ? 'stat-tile-delta up'
                          : 'stat-tile-delta down'
                      }
                    >
                      {weightPoints[weightPoints.length - 1].weight - weightPoints[0].weight > 0 ? '▲' : '▼'}{' '}
                      {Math.abs(
                        Math.round((weightPoints[weightPoints.length - 1].weight - weightPoints[0].weight) * 10) / 10,
                      )}{' '}
                      {weightUnit} over {range} days
                    </span>
                  )}
                </div>
                <div className="stat-tile">
                  <span className="stat-tile-label">Avg. daily water</span>
                  <span className="stat-tile-value">
                    {avgWater || '—'}
                    {avgWater > 0 && (
                      <span className="stat-tile-value-sub">
                        /{waterGoal} {WATER_UNIT_LABELS[waterUnit]}
                      </span>
                    )}
                  </span>
                </div>
                <div className="stat-tile">
                  <span className="stat-tile-label">Flare days</span>
                  <span className="stat-tile-value">
                    {flareDays}
                    <span className="stat-tile-value-sub">/{range}</span>
                  </span>
                  <span className="stat-tile-delta">Days with moderate+ symptoms</span>
                </div>
              </div>

              <WeightTrendChart points={weightPoints} unit={weightUnit} />
            </>
          )}
        </>
      )}

      {!loading && (
        <>
          <h2 className="stats-section-title">Exercise</h2>
          {Object.values(exerciseTotals).every((e) => e.count === 0) ? (
            <div className="empty-state">
              <p>No workouts logged in the last {range} days yet.</p>
              <p>Track them from the Calorie Tracker page to see your progress here.</p>
            </div>
          ) : (
            <>
              <div className="stat-tile-row">
                <div className="stat-tile">
                  <span className="stat-tile-label">Workouts logged</span>
                  <span className="stat-tile-value">
                    {Object.values(exerciseTotals).reduce((sum, e) => sum + e.count, 0)}
                    <span className="stat-tile-value-sub">/{range}</span>
                  </span>
                </div>
                <div className="stat-tile">
                  <span className="stat-tile-label">Total calories burned</span>
                  <span className="stat-tile-value">
                    {Object.values(exerciseTotals)
                      .reduce((sum, e) => sum + e.caloriesBurned, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="stat-tile">
                  <span className="stat-tile-label">Total minutes</span>
                  <span className="stat-tile-value">
                    {Object.values(exerciseTotals).reduce((sum, e) => sum + e.minutes, 0)}
                  </span>
                </div>
              </div>
              <ExerciseTrendChart
                days={currentDates.map((date) => ({
                  date,
                  caloriesBurned: exerciseTotals[date]?.caloriesBurned || 0,
                }))}
              />
            </>
          )}
        </>
      )}

      {!loading && correlations.length > 0 && (
        <>
          <h2 className="stats-section-title">Patterns</h2>
          <div className="correlations-grid">
            {correlations.map((corr, i) => (
              <div key={i} className="correlation-card">
                <div className="correlation-icon">
                  {corr.type === 'water-cal' && '💧'}
                  {corr.type === 'cal-flare' && '🔥'}
                  {corr.type === 'mood-water' && '😊'}
                  {corr.type === 'cal-weight' && '⚖️'}
                </div>
                <p>{corr.insight}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

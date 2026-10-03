import { useEffect, useState } from 'react'
import {
  DEFAULT_TRACKERS,
  setDailyCalorieGoal,
  setWaterGoal,
  setWaterUnit,
  setWeightUnit,
  subscribeToProfile,
} from '../lib/calorieLog'

const DEFAULT_WATER_GOALS = { glasses: 8, ml: 2000, l: 2 }

/**
 * Custom hook for managing tracker profile and user preferences.
 * Subscribes to profile changes and handles updates to goals and units.
 *
 * @param {string} uid - The user ID
 * @returns {Object} Profile state and update functions
 * @returns {string} profile.goal - Daily calorie goal
 * @returns {number} profile.waterGoal - Water intake goal
 * @returns {string} profile.waterUnit - Water measurement unit
 * @returns {string} profile.weightUnit - Weight measurement unit
 * @returns {number|null} profile.height - User's height
 * @returns {string} profile.heightUnit - Height measurement unit
 * @returns {Object} profile.enabledTrackers - Enabled tracker types
 * @returns {Function} updateGoal - Update daily calorie goal
 * @returns {Function} updateWaterGoal - Update water goal and unit
 * @returns {Function} updateWeightUnit - Update weight unit
 */
export function useTrackerProfile(uid) {
  const [goal, setGoal] = useState('')
  const [waterGoal, setWaterGoalState] = useState(8)
  const [waterUnit, setWaterUnitState] = useState('glasses')
  const [weightUnit, setWeightUnitState] = useState('kg')
  const [height, setHeight] = useState(null)
  const [heightUnit, setHeightUnitState] = useState('cm')
  const [enabledTrackers, setEnabledTrackersState] = useState(DEFAULT_TRACKERS)

  useEffect(() => {
    const unsubscribe = subscribeToProfile(uid, (profile) => {
      setGoal(profile.dailyCalorieGoal ?? '')
      const unit = profile.waterUnit ?? 'glasses'
      setWaterUnitState(unit)
      setWaterGoalState(profile.waterGoal ?? DEFAULT_WATER_GOALS[unit])
      setWeightUnitState(profile.weightUnit ?? 'kg')
      setHeight(profile.height ?? null)
      setHeightUnitState(profile.heightUnit ?? 'cm')
      setEnabledTrackersState(profile.enabledTrackers ?? DEFAULT_TRACKERS)
    })
    return unsubscribe
  }, [uid])

  const updateGoal = async (value) => {
    const goalNumber = Number(value)
    if (value === '' || Number.isNaN(goalNumber) || goalNumber < 0) return
    setGoal(value)
    await setDailyCalorieGoal(uid, goalNumber)
  }

  const updateWaterGoal = async (value) => {
    setWaterGoalState(value)
    await setWaterGoal(uid, value)
  }

  const updateWaterUnit = async (unit) => {
    setWaterUnitState(unit)
    const nextGoal = DEFAULT_WATER_GOALS[unit]
    setWaterGoalState(nextGoal)
    await Promise.all([setWaterUnit(uid, unit), setWaterGoal(uid, nextGoal)])
  }

  const updateWeightUnit = async (unit) => {
    setWeightUnitState(unit)
    await setWeightUnit(uid, unit)
  }

  return {
    goal,
    waterGoal,
    waterUnit,
    weightUnit,
    height,
    heightUnit,
    enabledTrackers,
    updateGoal,
    updateWaterGoal,
    updateWaterUnit,
    updateWeightUnit,
  }
}

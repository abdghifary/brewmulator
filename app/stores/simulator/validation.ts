import type { PourStep } from './types'
import { MIN_POUR_WATER_GRAMS, MIN_POUR_START_TIME, MIN_TEMP_OVERRIDE, MAX_TEMP_OVERRIDE } from './constants'

export function clampPourStep(step: PourStep): PourStep {
  const clamped = { ...step }
  clamped.waterGrams = Math.max(MIN_POUR_WATER_GRAMS, clamped.waterGrams)
  clamped.startTime = Math.max(MIN_POUR_START_TIME, clamped.startTime)
  if (clamped.isBloom) { // Bloom always starts at t=0, bypasses min
    clamped.startTime = 0
  }
  if (clamped.temperature !== undefined) {
    clamped.temperature = Math.max(MIN_TEMP_OVERRIDE, Math.min(MAX_TEMP_OVERRIDE, clamped.temperature))
  }
  return clamped
}

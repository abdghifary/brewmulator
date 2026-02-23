import { describe, it, expect } from 'vitest'
import { clampPourStep } from '../../app/stores/simulator/validation'
import { MIN_POUR_WATER_GRAMS, MIN_POUR_START_TIME, MIN_TEMP_OVERRIDE, MAX_TEMP_OVERRIDE } from '../../app/stores/simulator/constants'

describe('Pour Schedule Validation', () => {
  describe('clampPourStep', () => {
    it('clamps waterGrams to minimum when zero', () => {
      const result = clampPourStep({ startTime: 0, waterGrams: 0, isBloom: true })
      expect(result.waterGrams).toBe(MIN_POUR_WATER_GRAMS)
    })

    it('clamps waterGrams to minimum when negative', () => {
      const result = clampPourStep({ startTime: 45, waterGrams: -5 })
      expect(result.waterGrams).toBe(MIN_POUR_WATER_GRAMS)
    })

    it('clamps startTime to minimum when negative', () => {
      const result = clampPourStep({ startTime: -10, waterGrams: 60 })
      expect(result.startTime).toBe(MIN_POUR_START_TIME)
    })

    it('forces bloom startTime to 0 regardless of input', () => {
      const result = clampPourStep({ startTime: 30, waterGrams: 60, isBloom: true })
      expect(result.startTime).toBe(0)
    })

    it('clamps temperature below range to minimum', () => {
      const result = clampPourStep({ startTime: 45, waterGrams: 60, temperature: 50 })
      expect(result.temperature).toBe(MIN_TEMP_OVERRIDE)
    })

    it('clamps temperature above range to maximum', () => {
      const result = clampPourStep({ startTime: 45, waterGrams: 60, temperature: 120 })
      expect(result.temperature).toBe(MAX_TEMP_OVERRIDE)
    })

    it('passes through valid values unchanged', () => {
      const input = { startTime: 45, waterGrams: 60, temperature: 93 }
      const result = clampPourStep(input)
      expect(result).toEqual(input)
    })

    it('does not add temperature when not present', () => {
      const result = clampPourStep({ startTime: 45, waterGrams: 60 })
      expect(result.temperature).toBeUndefined()
    })

    it('does not mutate the original step', () => {
      const original = { startTime: -5, waterGrams: 0, isBloom: true, temperature: 50 }
      clampPourStep(original)
      expect(original.startTime).toBe(-5)
      expect(original.waterGrams).toBe(0)
      expect(original.temperature).toBe(50)
    })

    it('preserves label and isBloom properties', () => {
      const result = clampPourStep({ startTime: 0, waterGrams: 60, isBloom: true, label: 'Bloom' })
      expect(result.isBloom).toBe(true)
      expect(result.label).toBe('Bloom')
    })
  })
})

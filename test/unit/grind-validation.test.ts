import { describe, it, expect } from 'vitest'
import { clampGrindSize } from '../../app/stores/simulator/validation'
import { presetDefaults, grindBounds } from '../../app/stores/simulator/constants'
import type { BrewMethod } from '../../app/stores/simulator/types'

describe('clampGrindSize', () => {
  it('clamps below minimum for V60', () => {
    expect(clampGrindSize(100, 'v60')).toBe(300)
  })

  it('clamps above maximum for espresso', () => {
    expect(clampGrindSize(2000, 'espresso')).toBe(400)
  })

  it('passes through in-range values unchanged', () => {
    expect(clampGrindSize(500, 'v60')).toBe(500)
  })

  it('clamps at exact boundary', () => {
    expect(clampGrindSize(300, 'v60')).toBe(300) // min boundary
    expect(clampGrindSize(1000, 'v60')).toBe(1000) // max boundary
  })

  it('each method preset default is within its own grindBounds', () => {
    const methods: BrewMethod[] = ['v60', 'frenchPress', 'espresso', 'aeropress', 'coldBrew']
    for (const method of methods) {
      const defaultGrind = presetDefaults[method].grindSize
      const bounds = grindBounds[method]
      expect(defaultGrind).toBeGreaterThanOrEqual(bounds.min)
      expect(defaultGrind).toBeLessThanOrEqual(bounds.max)
    }
  })
})

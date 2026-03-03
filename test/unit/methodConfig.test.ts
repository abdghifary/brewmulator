import { describe, it, expect } from 'vitest'
import { METHOD_CONFIGS, getMethodConfig } from '../../app/stores/simulator/methodConfig'
import type { BrewMethod } from '../../app/stores/simulator/types'

const ALL_METHODS: BrewMethod[] = ['v60', 'frenchPress', 'espresso', 'aeropress', 'coldBrew']

describe('MethodConfig', () => {
  it('has entries for all 5 brew methods', () => {
    for (const method of ALL_METHODS) {
      expect(METHOD_CONFIGS[method]).toBeDefined()
      expect(METHOD_CONFIGS[method].id).toBe(method)
    }
  })

  it('getMethodConfig returns correct config', () => {
    const config = getMethodConfig('espresso')
    expect(config.id).toBe('espresso')
    expect(config.absorptionRate).toBe(1.2)
  })

  it('sweetSpot thresholds match WASM getExtractionZone', () => {
    // Must exactly match assembly/index.ts:100-113
    expect(METHOD_CONFIGS.v60.sweetSpot).toEqual({ min: 18, max: 22 })
    expect(METHOD_CONFIGS.frenchPress.sweetSpot).toEqual({ min: 18, max: 22 })
    expect(METHOD_CONFIGS.espresso.sweetSpot).toEqual({ min: 17, max: 23 })
    expect(METHOD_CONFIGS.aeropress.sweetSpot).toEqual({ min: 18, max: 22 })
    expect(METHOD_CONFIGS.coldBrew.sweetSpot).toEqual({ min: 16, max: 20 })
  })

  it('all defaults have valid preset data', () => {
    for (const method of ALL_METHODS) {
      const config = METHOD_CONFIGS[method]
      expect(config.defaults.temperature).toBeGreaterThan(0)
      expect(config.defaults.grindSize).toBeGreaterThan(0)
      expect(config.defaults.coffeeGrams).toBeGreaterThan(0)
      expect(config.defaults.waterGrams).toBeGreaterThan(0)
    }
  })

  it('grindBounds contain valid ranges', () => {
    for (const method of ALL_METHODS) {
      const config = METHOD_CONFIGS[method]
      expect(config.grindBounds.min).toBeLessThan(config.grindBounds.max)
      expect(config.grindBounds.step).toBeGreaterThan(0)
    }
  })

  it('preset defaults are within their own grindBounds', () => {
    for (const method of ALL_METHODS) {
      const config = METHOD_CONFIGS[method]
      expect(config.defaults.grindSize).toBeGreaterThanOrEqual(config.grindBounds.min)
      expect(config.defaults.grindSize).toBeLessThanOrEqual(config.grindBounds.max)
    }
  })

  it('only v60 supports pour schedule', () => {
    expect(METHOD_CONFIGS.v60.supportsPourSchedule).toBe(true)
    for (const method of ALL_METHODS.filter(m => m !== 'v60')) {
      expect(METHOD_CONFIGS[method].supportsPourSchedule).toBe(false)
    }
  })

  it('all extension points have safe defaults', () => {
    for (const method of ALL_METHODS) {
      const config = METHOD_CONFIGS[method]
      if (method === 'v60') {
        expect(config.supportsFineFraction).toBe(true)
      } else {
        expect(config.supportsFineFraction).toBe(false)
      }
      expect(config.percolationMultiplier).toBe(1.0)
      expect(config.supportsDripperGeometry).toBe(false)
    }
  })
})

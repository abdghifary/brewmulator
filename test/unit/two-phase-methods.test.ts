import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { METHOD_CONFIGS } from '../../app/stores/simulator/methodConfig'
import { methodToNumber, presetDefaults } from '../../app/stores/simulator/constants'
import { computePiecewiseCurve, generateSyntheticSchedule, type PiecewiseCurveParams } from '../../app/stores/simulator/composables/usePiecewiseExtraction'
import type { BrewMethod, BrewRecipe, WasmModule } from '../../app/stores/simulator/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any

beforeAll(async () => {
  const wasmPath = join(process.cwd(), 'build', 'release.wasm')
  const wasmBuffer = await readFile(wasmPath)
  const wasmInstanceSource = await WebAssembly.instantiate(wasmBuffer)
  wasmModule = wasmInstanceSource.instance.exports
})

function makeMethodParams(method: BrewMethod, overrides: Partial<PiecewiseCurveParams> = {}): PiecewiseCurveParams {
  const defaults = presetDefaults[method]
  const config = METHOD_CONFIGS[method]
  const fastModifierOverride: Partial<PiecewiseCurveParams> = {
    methodModifierFast: config.methodModifierFast
  }
  const slowModifierOverride: Partial<PiecewiseCurveParams> = {
    methodModifierSlow: config.methodModifierSlow
  }

  return {
    pourSchedule: generateSyntheticSchedule({ waterGrams: defaults.waterGrams, coffeeGrams: defaults.coffeeGrams } as BrewRecipe),
    coffeeGrams: defaults.coffeeGrams,
    grindSize: defaults.grindSize,
    roastLevel: 1.0,
    method: methodToNumber(method),
    maxTime: defaults.brewTime,
    numPoints: 101,
    wasmModule: wasmModule as WasmModule,
    globalTemp: defaults.temperature,
    twoPhaseEnabled: true,
    ...fastModifierOverride,
    ...slowModifierOverride,
    ...overrides
  }
}

function getFinalYield(method: BrewMethod, overrides: Partial<PiecewiseCurveParams> = {}): number {
  const curve = computePiecewiseCurve(makeMethodParams(method, overrides))
  return curve[curve.length - 1]!.yield
}

function expectNonDecreasing(method: BrewMethod, overrides: Partial<PiecewiseCurveParams> = {}): void {
  const curve = computePiecewiseCurve(makeMethodParams(method, overrides))

  for (let i = 1; i < curve.length; i++) {
    expect(curve[i].yield).toBeGreaterThanOrEqual(curve[i - 1].yield)
  }
}

describe('Two-phase method config modifiers', () => {
  it('uses french press modifier values from method config', () => {
    expect(METHOD_CONFIGS.frenchPress.methodModifierFast).toBe(0.99)
    expect(METHOD_CONFIGS.frenchPress.methodModifierSlow).toBe(1.30)
  })

  it('uses espresso modifier values from method config', () => {
    expect(METHOD_CONFIGS.espresso.methodModifierFast).toBe(12.0)
    expect(METHOD_CONFIGS.espresso.methodModifierSlow).toBe(4.0)
  })
})

describe('French Press two-phase RED coverage', () => {
  it('keeps final EY in plausible range at default french press conditions', () => {
    const finalEY = getFinalYield('frenchPress')

    expect(finalEY).toBeGreaterThanOrEqual(15)
    expect(finalEY).toBeLessThanOrEqual(19)
  })

  it('increases final EY when french press grind is finer', () => {
    const finer = getFinalYield('frenchPress', { grindSize: presetDefaults.frenchPress.grindSize - 50 })
    const coarser = getFinalYield('frenchPress', { grindSize: presetDefaults.frenchPress.grindSize + 50 })

    expect(finer).toBeGreaterThan(coarser)
  })

  it('produces a monotonically non-decreasing french press curve', () => {
    expectNonDecreasing('frenchPress')
  })

  it('starts french press extraction at zero yield', () => {
    const curve = computePiecewiseCurve(makeMethodParams('frenchPress'))

    expect(curve[0]!.yield).toBe(0)
  })

  it('increases french press EY at higher temperature', () => {
    const cooler = getFinalYield('frenchPress', { globalTemp: 85 })
    const hotter = getFinalYield('frenchPress', { globalTemp: 95 })

    expect(hotter).toBeGreaterThan(cooler)
  })
})

describe('Espresso two-phase RED coverage', () => {
  it('keeps final EY in plausible range at default espresso conditions', () => {
    const finalEY = getFinalYield('espresso')

    expect(finalEY).toBeGreaterThanOrEqual(18)
    expect(finalEY).toBeLessThanOrEqual(22)
  })

  it('increases final EY when espresso grind is finer', () => {
    const finer = getFinalYield('espresso', { grindSize: presetDefaults.espresso.grindSize - 50 })
    const coarser = getFinalYield('espresso', { grindSize: presetDefaults.espresso.grindSize + 50 })

    expect(finer).toBeGreaterThan(coarser)
  })

  it('produces a monotonically non-decreasing espresso curve', () => {
    expectNonDecreasing('espresso')
  })

  it('starts espresso extraction at zero yield', () => {
    const curve = computePiecewiseCurve(makeMethodParams('espresso'))

    expect(curve[0]!.yield).toBe(0)
  })

  it('increases espresso EY at higher temperature', () => {
    const cooler = getFinalYield('espresso', { globalTemp: 85 })
    const hotter = getFinalYield('espresso', { globalTemp: 95 })

    expect(hotter).toBeGreaterThan(cooler)
  })
})

describe('AeroPress two-phase RED coverage', () => {
  it('keeps final EY in plausible range at default aeropress conditions', () => {
    const finalEY = getFinalYield('aeropress')

    expect(finalEY).toBeGreaterThanOrEqual(14)
    expect(finalEY).toBeLessThanOrEqual(18)
  })

  it('increases final EY when aeropress grind is finer', () => {
    const finer = getFinalYield('aeropress', { grindSize: presetDefaults.aeropress.grindSize - 50 })
    const coarser = getFinalYield('aeropress', { grindSize: presetDefaults.aeropress.grindSize + 50 })

    expect(finer).toBeGreaterThan(coarser)
  })

  it('produces a monotonically non-decreasing aeropress curve', () => {
    expectNonDecreasing('aeropress')
  })

  it('starts aeropress extraction at zero yield', () => {
    const curve = computePiecewiseCurve(makeMethodParams('aeropress'))

    expect(curve[0]!.yield).toBe(0)
  })

  it('increases aeropress EY at 95°C versus 85°C', () => {
    const baseline = getFinalYield('aeropress', { globalTemp: 85 })
    const hotter = getFinalYield('aeropress', { globalTemp: 95 })

    expect(hotter).toBeGreaterThan(baseline)
  })
})

describe('Cold brew two-phase RED coverage', () => {
  it('keeps final EY in plausible range at default cold brew conditions', () => {
    const finalEY = getFinalYield('coldBrew', { globalTemp: 20, maxTime: 43200, numPoints: 101 })

    expect(finalEY).toBeGreaterThanOrEqual(14)
    expect(finalEY).toBeLessThanOrEqual(18)
  })

  it('increases final EY when cold brew grind is finer', () => {
    const finer = getFinalYield('coldBrew', { grindSize: presetDefaults.coldBrew.grindSize - 50, globalTemp: 20, maxTime: 43200, numPoints: 101 })
    const coarser = getFinalYield('coldBrew', { grindSize: presetDefaults.coldBrew.grindSize + 50, globalTemp: 20, maxTime: 43200, numPoints: 101 })

    expect(finer).toBeGreaterThan(coarser)
  })

  it('produces a monotonically non-decreasing cold brew curve', () => {
    expectNonDecreasing('coldBrew', { globalTemp: 20, maxTime: 43200, numPoints: 101 })
  })

  it('starts cold brew extraction at zero yield', () => {
    const curve = computePiecewiseCurve(makeMethodParams('coldBrew', { globalTemp: 20, maxTime: 43200, numPoints: 101 }))

    expect(curve[0]!.yield).toBe(0)
  })

  it('relies on globalTemp for cold brew synthetic schedule physics', () => {
    const curve = computePiecewiseCurve(makeMethodParams('coldBrew', { globalTemp: 20, maxTime: 43200, numPoints: 101 }))

    expect(curve).toHaveLength(101)
    expect(curve[curve.length - 1]!.yield).toBeGreaterThan(curve[1]!.yield)
  })
})

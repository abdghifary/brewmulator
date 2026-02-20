import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { WasmModule } from '../../app/stores/simulator/types'
import { computePiecewiseCurve, type PiecewiseCurveParams } from '../../app/stores/simulator/composables/usePiecewiseExtraction'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any

beforeAll(async () => {
  const wasmPath = join(process.cwd(), 'build', 'release.wasm')
  const wasmBuffer = await readFile(wasmPath)
  const wasmInstanceSource = await WebAssembly.instantiate(wasmBuffer)
  wasmModule = wasmInstanceSource.instance.exports
})

function makeParams(overrides: Partial<PiecewiseCurveParams> = {}): PiecewiseCurveParams {
  return {
    pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
    coffeeGrams: 18,
    grindSize: 500,
    roastLevel: 1.0,
    method: 0,
    maxTime: 180,
    numPoints: 101,
    wasmModule: wasmModule as WasmModule,
    ...overrides,
  }
}

describe('Piecewise Extraction Engine', () => {
  it('returns empty array for empty pour schedule', () => {
    const result = computePiecewiseCurve(makeParams({ pourSchedule: [] }))
    expect(result).toEqual([])
  })

  it('single-pour regression matches legacy within 0.5%', () => {
    // Short time window where Newton cooling has negligible impact,
    // isolating the ODE stepper accuracy vs legacy closed-form solution
    const shortTime = 10
    const params = makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: shortTime,
      numPoints: 101,
    })
    const curve = computePiecewiseCurve(params)

    const legacyYield = wasmModule.calculateExtractionYield(shortTime, 93, 500, 1.0, 0, 288, 18)
    const lastPoint = curve[curve.length - 1]

    expect(lastPoint.time).toBeCloseTo(shortTime, 1)
    expect(Math.abs(lastPoint.yield - legacyYield)).toBeLessThan(0.5)

    // Full brew: piecewise with thermal cooling produces lower yield than legacy (no cooling)
    const fullCurve = computePiecewiseCurve(makeParams({ maxTime: 180, numPoints: 101 }))
    const fullLegacy = wasmModule.calculateExtractionYield(180, 93, 500, 1.0, 0, 288, 18)
    const fullLast = fullCurve[fullCurve.length - 1]

    expect(fullLast.yield).toBeGreaterThan(0)
    expect(fullLast.yield).toBeLessThan(fullLegacy)
  })

  it('two-pour has lower yield during bloom than single-shot', () => {
    // Two-pour: bloom 50g at t=0, main 238g at t=45
    const twoPour = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 238, temperature: 93 },
      ],
      maxTime: 180,
      numPoints: 101,
    }))

    // Single-shot: 288g at t=0
    const singleShot = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 180,
      numPoints: 101,
    }))

    // At ~t=30 (mid-bloom), find closest point
    const twoAt30 = twoPour.find(p => Math.abs(p.time - 30) < 2)!
    const singleAt30 = singleShot.find(p => Math.abs(p.time - 30) < 2)!

    expect(twoAt30.yield).toBeLessThan(singleAt30.yield)
  })

  it('bloom flag reduces early extraction rate', () => {
    const withBloom = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 238, temperature: 93 },
      ],
      maxTime: 180,
      numPoints: 101,
    }))

    const withoutBloom = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: false },
        { startTime: 45, waterGrams: 238, temperature: 93 },
      ],
      maxTime: 180,
      numPoints: 101,
    }))

    // At ~t=15, bloom inhibition should reduce yield
    const bloomAt15 = withBloom.find(p => Math.abs(p.time - 15) < 2)!
    const noBloomAt15 = withoutBloom.find(p => Math.abs(p.time - 15) < 2)!

    expect(bloomAt15.yield).toBeLessThan(noBloomAt15.yield)
  })

  it('yield is monotonically non-decreasing', () => {
    // 5-pour Kasuya-style schedule
    const curve = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 60, temperature: 93 },
        { startTime: 90, waterGrams: 60, temperature: 93 },
        { startTime: 135, waterGrams: 60, temperature: 93 },
        { startTime: 180, waterGrams: 60, temperature: 93 },
      ],
      coffeeGrams: 20,
      maxTime: 240,
      numPoints: 121,
    }))

    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].yield).toBeGreaterThanOrEqual(curve[i - 1].yield)
    }
  })

  it('temperature affects extraction yield', () => {
    const hot = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 120,
      numPoints: 61,
    }))

    const cool = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 80 }],
      maxTime: 120,
      numPoints: 61,
    }))

    const hotAt120 = hot[hot.length - 1]
    const coolAt120 = cool[cool.length - 1]

    expect(hotAt120.yield).not.toBeCloseTo(coolAt120.yield, 0)
    expect(hotAt120.yield).toBeGreaterThan(coolAt120.yield)
  })

  it('returns exactly numPoints data points', () => {
    const result = computePiecewiseCurve(makeParams({ numPoints: 101 }))
    expect(result).toHaveLength(101)

    const result2 = computePiecewiseCurve(makeParams({ numPoints: 51 }))
    expect(result2).toHaveLength(51)
  })
})

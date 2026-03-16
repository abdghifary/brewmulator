import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { WasmModule } from '../../app/stores/simulator/types'
import { PHI_SURFACE_REF } from '../../app/stores/simulator/constants'
import { computePiecewiseCurve, computeEffectiveGrindSize, computeSurfaceFraction, type PiecewiseCurveParams } from '../../app/stores/simulator/composables/usePiecewiseExtraction'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any

type PiecewiseCurveParamsWithModifiers = PiecewiseCurveParams & {
  methodModifierFast?: number
  methodModifierSlow?: number
}

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
    ...overrides
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
      twoPhaseEnabled: false,
      maxTime: shortTime,
      numPoints: 101
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
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 101
    }))

    // Single-shot: 288g at t=0
    const singleShot = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 180,
      numPoints: 101
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
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 101
    }))

    const withoutBloom = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: false },
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 101
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
        { startTime: 180, waterGrams: 60, temperature: 93 }
      ],
      coffeeGrams: 20,
      maxTime: 240,
      numPoints: 121
    }))

    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].yield).toBeGreaterThanOrEqual(curve[i - 1].yield)
    }
  })

  it('temperature affects extraction yield', () => {
    const hot = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 120,
      numPoints: 61
    }))

    const cool = computePiecewiseCurve(makeParams({
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 80 }],
      maxTime: 120,
      numPoints: 61
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

describe('Effective Grind Size (Sauter Mean d₃₂)', () => {
  it('φ=0 returns grindSize unchanged', () => {
    expect(computeEffectiveGrindSize(850, 0)).toBe(850)
    expect(computeEffectiveGrindSize(500, 0)).toBe(500)
  })

  it('negative φ returns grindSize unchanged', () => {
    expect(computeEffectiveGrindSize(850, -0.1)).toBe(850)
  })

  it('φ=0.15 (reference) gives d_eff ≈ 400μm at 850μm — calibration preserved', () => {
    const dEff = computeEffectiveGrindSize(850, 0.15)
    expect(dEff).toBeCloseTo(400, 0)
  })

  it('φ=0.20 (Timemore C2) gives d_eff = d₃₂ = 340μm at 850μm', () => {
    const dEff = computeEffectiveGrindSize(850, 0.20)
    const d32 = 1 / ((1 - 0.20) / 850 + 0.20 / 100)
    expect(d32).toBeCloseTo(340, 0)
    expect(dEff).toBeCloseTo(d32, 8)
  })

  it('φ=0.40 (blade grinder) still produces elevated extraction effect', () => {
    const dEff = computeEffectiveGrindSize(850, 0.40)
    expect(dEff).toBeLessThan(850)
    expect(dEff).toBeGreaterThan(200)
  })

  it('d_eff decreases monotonically as φ increases', () => {
    const phis = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
    const dEffs = phis.map(phi => computeEffectiveGrindSize(850, phi))
    for (let i = 1; i < dEffs.length; i++) {
      expect(dEffs[i]).toBeLessThan(dEffs[i - 1])
    }
  })

  it('d_eff equals harmonic mean (d₃₂) for all φ values', () => {
    for (const phi of [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]) {
      const dEff = computeEffectiveGrindSize(850, phi)
      const d32 = 1 / ((1 - phi) / 850 + phi / 100)
      expect(dEff).toBeCloseTo(d32, 8)
    }
  })

  it('finesFraction=0 matches no-finesFraction exactly (backward compat)', () => {
    const withZero = computePiecewiseCurve(makeParams({ finesFraction: 0 }))
    const withUndefined = computePiecewiseCurve(makeParams())
    expect(withZero[withZero.length - 1].yield)
      .toBeCloseTo(withUndefined[withUndefined.length - 1].yield, 10)
  })

  it('finesFraction > 0 produces higher yield at coarse grind', () => {
    const withFines = computePiecewiseCurve(makeParams({ grindSize: 800, finesFraction: 0.15, maxTime: 180 }))
    const withoutFines = computePiecewiseCurve(makeParams({ grindSize: 800, finesFraction: 0, maxTime: 180 }))
    expect(withFines[withFines.length - 1].yield).toBeGreaterThan(withoutFines[withoutFines.length - 1].yield)
  })

  it('higher finesFraction produces higher yield (monotonic)', () => {
    const low = computePiecewiseCurve(makeParams({ grindSize: 800, finesFraction: 0.10 }))
    const high = computePiecewiseCurve(makeParams({ grindSize: 800, finesFraction: 0.25 }))
    expect(high[high.length - 1].yield).toBeGreaterThan(low[low.length - 1].yield)
  })

  it('Kasuya 850μm with 15% fines produces 17-23% EY (secondary plausibility check)', () => {
    const curve = computePiecewiseCurve(makeParams({
      grindSize: 850,
      finesFraction: 0.15,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 60, temperature: 93 },
        { startTime: 90, waterGrams: 60, temperature: 93 },
        { startTime: 135, waterGrams: 60, temperature: 93 },
        { startTime: 180, waterGrams: 60, temperature: 93 }
      ],
      coffeeGrams: 20, maxTime: 210, numPoints: 101
    }))
    const finalEY = curve[curve.length - 1].yield
    expect(finalEY).toBeGreaterThanOrEqual(17)
    expect(finalEY).toBeLessThanOrEqual(23)
  })

  it('Timemore C2 (φ=0.20) at 850μm produces elevated EY (20-25%)', () => {
    const curve = computePiecewiseCurve(makeParams({
      grindSize: 850,
      finesFraction: 0.20,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 60, temperature: 93 },
        { startTime: 90, waterGrams: 60, temperature: 93 },
        { startTime: 135, waterGrams: 60, temperature: 93 },
        { startTime: 180, waterGrams: 60, temperature: 93 }
      ],
      coffeeGrams: 20, maxTime: 210, numPoints: 101
    }))
    const finalEY = curve[curve.length - 1].yield
    expect(finalEY).toBeGreaterThanOrEqual(20)
    expect(finalEY).toBeLessThanOrEqual(25)
  })
})

describe('Two-Phase Extraction Kinetics', () => {
  it('φ_s at reference grind (600μm) equals PHI_SURFACE_REF (0.30)', () => {
    expect(computeSurfaceFraction(600)).toBeCloseTo(PHI_SURFACE_REF, 10)
  })

  it('φ_s at V60 min grind (300μm) equals 0.60', () => {
    expect(computeSurfaceFraction(300)).toBeCloseTo(0.60, 10)
  })

  it('φ_s at V60 max grind (1000μm) equals 0.18', () => {
    expect(computeSurfaceFraction(1000)).toBeCloseTo(0.18, 10)
  })

  it('φ_s is clamped to 1.0 at extreme fine grind (100μm)', () => {
    expect(computeSurfaceFraction(100)).toBe(1.0)
  })

  it('φ_s decreases monotonically as grind size increases', () => {
    const values = [100, 300, 600, 1000].map(grindSize => computeSurfaceFraction(grindSize))

    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1])
    }
  })

  it('twoPhaseEnabled=false produces identical output to default (no flag)', () => {
    const withDefault = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 228, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 101
    }))
    const withFlag = computePiecewiseCurve(makeParams({
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 228, temperature: 93 }
      ],
      twoPhaseEnabled: false,
      maxTime: 180,
      numPoints: 101
    }))

    expect(withFlag).toHaveLength(withDefault.length)

    for (let i = 0; i < withFlag.length; i++) {
      expect(withFlag[i].time).toBeCloseTo(withDefault[i].time, 10)
      expect(withFlag[i].yield).toBeCloseTo(withDefault[i].yield, 10)
    }
  })

  it('two-phase produces higher early EY than single-phase', () => {
    const singlePhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: false,
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 180,
      numPoints: 181
    }))
    const twoPhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      pourSchedule: [{ startTime: 0, waterGrams: 288, temperature: 93 }],
      maxTime: 180,
      numPoints: 181
    }))

    const singleAt15 = singlePhase.find(point => Math.abs(point.time - 15) < 1)!
    const twoAt15 = twoPhase.find(point => Math.abs(point.time - 15) < 1)!

    expect(twoAt15.yield).toBeGreaterThan(singleAt15.yield)
  })

  it('two-phase converges to similar final EY', () => {
    const singlePhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: false,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 228, temperature: 93 }
      ],
      maxTime: 300,
      numPoints: 301
    }))
    const twoPhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 228, temperature: 93 }
      ],
      maxTime: 300,
      numPoints: 301
    }))

    const singleFinal = singlePhase[twoPhase.length - 1]
    const twoFinal = twoPhase[twoPhase.length - 1]
    const diffs = singlePhase.map((point, index) => Math.abs(twoPhase[index].yield - point.yield))
    const finalDiff = diffs[diffs.length - 1]
    const peakEarlierDiff = Math.max(...diffs.slice(0, -1))

    expect(twoFinal.yield).not.toBeCloseTo(singleFinal.yield, 10)
    expect(finalDiff).toBeLessThan(peakEarlierDiff)
  })

  it('two-phase yield is monotonically non-decreasing', () => {
    const singlePhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: false,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 60, temperature: 93 },
        { startTime: 90, waterGrams: 60, temperature: 93 },
        { startTime: 135, waterGrams: 60, temperature: 93 },
        { startTime: 180, waterGrams: 60, temperature: 93 }
      ],
      coffeeGrams: 20,
      maxTime: 240,
      numPoints: 241
    }))
    const twoPhase = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 60, temperature: 93 },
        { startTime: 90, waterGrams: 60, temperature: 93 },
        { startTime: 135, waterGrams: 60, temperature: 93 },
        { startTime: 180, waterGrams: 60, temperature: 93 }
      ],
      coffeeGrams: 20,
      maxTime: 240,
      numPoints: 241
    }))

    const singleAt15 = singlePhase.find(point => Math.abs(point.time - 15) < 1)!
    const twoAt15 = twoPhase.find(point => Math.abs(point.time - 15) < 1)!

    expect(twoAt15.yield).toBeGreaterThan(singleAt15.yield)

    for (let i = 1; i < twoPhase.length; i++) {
      expect(twoPhase[i].yield).toBeGreaterThanOrEqual(twoPhase[i - 1].yield)
    }
  })

  it('bloom inhibition affects two-phase extraction', () => {
    const singlePhaseWithoutBloom = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: false,
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: false },
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 181
    }))
    const withBloom = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 181
    }))
    const withoutBloom = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      pourSchedule: [
        { startTime: 0, waterGrams: 50, temperature: 93, isBloom: false },
        { startTime: 45, waterGrams: 238, temperature: 93 }
      ],
      maxTime: 180,
      numPoints: 181
    }))

    const withBloomAt15 = withBloom.find(point => Math.abs(point.time - 15) < 1)!
    const withoutBloomAt15 = withoutBloom.find(point => Math.abs(point.time - 15) < 1)!
    const singlePhaseWithoutBloomAt15 = singlePhaseWithoutBloom.find(point => Math.abs(point.time - 15) < 1)!

    expect(withBloomAt15.yield).toBeLessThan(withoutBloomAt15.yield)
    expect(withoutBloomAt15.yield).toBeGreaterThan(singlePhaseWithoutBloomAt15.yield)
  })

  it('V60 93°C/500μm/medium/1:16 Hoffmann schedule hits calibration targets', () => {
    const curve = computePiecewiseCurve(makeParams({
      twoPhaseEnabled: true,
      grindSize: 500,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 240, temperature: 93 },
        { startTime: 75, waterGrams: 200, temperature: 93 }
      ],
      coffeeGrams: 30,
      maxTime: 210,
      numPoints: 211
    }))

    const at15 = curve.find(point => Math.abs(point.time - 15) < 1)!
    const at60 = curve.find(point => Math.abs(point.time - 60) < 1)!
    const at180 = curve.find(point => Math.abs(point.time - 180) < 1)!

    expect(at15.yield).toBeGreaterThanOrEqual(6)
    expect(at15.yield).toBeLessThanOrEqual(8)
    expect(at60.yield).toBeGreaterThanOrEqual(13)
    expect(at60.yield).toBeLessThanOrEqual(15)
    expect(at180.yield).toBeGreaterThanOrEqual(20)
    expect(at180.yield).toBeLessThanOrEqual(21)
  })
})

describe('Per-method modifier overrides', () => {
  function makeTwoPhaseHoffmannParams(overrides: Partial<PiecewiseCurveParamsWithModifiers> = {}): PiecewiseCurveParamsWithModifiers {
    return makeParams({
      twoPhaseEnabled: true,
      grindSize: 500,
      pourSchedule: [
        { startTime: 0, waterGrams: 60, temperature: 93, isBloom: true },
        { startTime: 45, waterGrams: 240, temperature: 93 },
        { startTime: 75, waterGrams: 200, temperature: 93 }
      ],
      coffeeGrams: 30,
      maxTime: 210,
      numPoints: 211,
      ...overrides
    })
  }

  function getYieldAt(curve: ReturnType<typeof computePiecewiseCurve>, time: number): number {
    return curve.find(point => Math.abs(point.time - time) < 1)!.yield
  }

  it('explicit identity modifiers preserve V60 Hoffmann calibration and match omitted modifiers', () => {
    const baseline = computePiecewiseCurve(makeTwoPhaseHoffmannParams())
    const withExplicitIdentity = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 1.0,
      methodModifierSlow: 1.0
    }))

    expect(getYieldAt(baseline, 15)).toBeCloseTo(6.49, 2)
    expect(getYieldAt(baseline, 60)).toBeCloseTo(13.35, 2)
    expect(getYieldAt(baseline, 180)).toBeCloseTo(20.46, 2)

    expect(getYieldAt(withExplicitIdentity, 15)).toBeCloseTo(getYieldAt(baseline, 15), 10)
    expect(getYieldAt(withExplicitIdentity, 60)).toBeCloseTo(getYieldAt(baseline, 60), 10)
    expect(getYieldAt(withExplicitIdentity, 180)).toBeCloseTo(getYieldAt(baseline, 180), 10)
  })

  it('higher fast and slow modifiers increase EY at 60 seconds', () => {
    const baseline = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 1.0,
      methodModifierSlow: 1.0
    }))
    const boosted = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 2.0,
      methodModifierSlow: 2.0
    }))

    expect(getYieldAt(boosted, 60)).toBeGreaterThan(getYieldAt(baseline, 60))
  })

  it('lower fast and slow modifiers decrease EY at 60 seconds', () => {
    const baseline = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 1.0,
      methodModifierSlow: 1.0
    }))
    const reduced = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 0.5,
      methodModifierSlow: 0.5
    }))

    expect(getYieldAt(reduced, 60)).toBeLessThan(getYieldAt(baseline, 60))
  })

  it('fast and slow modifiers affect the curve independently', () => {
    const fastHeavy = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 3.0,
      methodModifierSlow: 0.5
    }))
    const slowHeavy = computePiecewiseCurve(makeTwoPhaseHoffmannParams({
      methodModifierFast: 0.5,
      methodModifierSlow: 3.0
    }))

    expect(getYieldAt(fastHeavy, 15)).not.toBeCloseTo(getYieldAt(slowHeavy, 15), 3)
    expect(getYieldAt(fastHeavy, 180)).not.toBeCloseTo(getYieldAt(slowHeavy, 180), 3)
  })
})

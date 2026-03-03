import type { PourSchedule, ExtractionPoint, WasmModule } from '../types'
import {
  T_AMBIENT, H_COOL, K_DEGAS, BLOOM_INHIBITION,
  FINES_GRIND_SIZE
} from '../constants'

export interface PiecewiseCurveParams {
  pourSchedule: PourSchedule
  coffeeGrams: number
  grindSize: number
  roastLevel: number
  method: number
  maxTime: number
  numPoints: number
  wasmModule: WasmModule
  globalTemp?: number
  finesFraction?: number // 0.0-0.40, fraction of mass that is fines
}

/**
 * Compute effective grind size from bimodal PSD using the Sauter mean diameter d₃₂.
 *
 * d₃₂ is the surface-volume mean: the mono-disperse diameter with the same
 * total surface-area-to-volume ratio as the bimodal mixture. When rate scales
 * with surface area per unit volume (∝ 1/d²), d₃₂ is the correct single-size
 * surrogate for a polydisperse bed.
 *
 * For a two-bin mixture (coarse mass fraction X₁, fines mass fraction φ):
 *   d₃₂ = 1 / (φ/d_f + (1-φ)/d_c)
 *
 * References:
 *   Moroney et al. (2015) DOI: 10.1016/j.ces.2015.06.003 — Sauter mean for coffee PSD
 *   Moroney et al. (2016) DOI: 10.1186/s13362-016-0024-6 — d₃₂ in extraction kinetics
 */
export function computeEffectiveGrindSize(
  grindSize: number,
  phi: number
): number {
  if (phi <= 0) return grindSize

  // Sauter mean diameter d₃₂ (Moroney 2015)
  return 1 / (phi / FINES_GRIND_SIZE + (1 - phi) / grindSize)
}

export function computePiecewiseCurve(params: PiecewiseCurveParams): ExtractionPoint[] {
  const { pourSchedule, coffeeGrams, grindSize, roastLevel, method, maxTime, numPoints, wasmModule, globalTemp = 93 } = params

  if (pourSchedule.length === 0) return []

  const results: ExtractionPoint[] = []
  const dtStep = maxTime / (numPoints - 1)

  const sortedPours = [...pourSchedule].sort((a, b) => a.startTime - b.startTime)

  const bloomPour = sortedPours.find(p => p.isBloom)
  const bloomEndTime = bloomPour
    ? (sortedPours[sortedPours.findIndex(p => p.isBloom) + 1]?.startTime ?? maxTime)
    : -1

  let ePrev = 0

  for (let i = 0; i < numPoints; i++) {
    const t = i * dtStep
    const dt = i === 0 ? 0 : dtStep

    const activePours = sortedPours.filter(p => p.startTime <= t)

    if (activePours.length === 0) {
      results.push({ time: t, yield: 0 })
      continue
    }

    const cumulativeWater = activePours.reduce((sum, p) => sum + p.waterGrams, 0)
    const ratio = cumulativeWater / coffeeGrams

    const lastPour = activePours[activePours.length - 1]!
    const lastPourTemp = lastPour.temperature ?? globalTemp
    const currentTemp = T_AMBIENT + (lastPourTemp - T_AMBIENT) * Math.exp(-H_COOL * (t - lastPour.startTime))

    const effectiveGrindSize = computeEffectiveGrindSize(grindSize, params.finesFraction ?? 0)

    let k = wasmModule.calculateRateConstant(currentTemp, effectiveGrindSize, roastLevel, method)

    if (bloomPour && t >= bloomPour.startTime && t < bloomEndTime) {
      const bloomDt = t - bloomPour.startTime
      const fCo2 = 1 - BLOOM_INHIBITION * Math.exp(-K_DEGAS * bloomDt)
      k *= fCo2
    }

    const eMax = wasmModule.E_MAX.value
    const alpha = wasmModule.ALPHA.value
    const yieldEq = eMax / (1 + alpha / ratio)
    const kObs = k * (1 + alpha / ratio)

    const e = i === 0 ? 0 : yieldEq - (yieldEq - ePrev) * Math.exp(-kObs * dt)

    ePrev = e
    results.push({ time: t, yield: Math.max(0, e) })
  }

  return results
}

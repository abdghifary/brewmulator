import type { PourSchedule, ExtractionPoint, WasmModule } from '../types'
import {
  T_AMBIENT, H_COOL, K_DEGAS, BLOOM_INHIBITION,
  FINES_GRIND_SIZE, PHI_REF, PHI_HI, BETA_0, BETA_1, N_COMPRESS
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
  finesFraction?: number // 0.0-0.40, fraction of mass that is fines (Model C: φₑ Compressed Harmonic Mean)
}

/**
 * Compute effective grind size from bimodal PSD using φₑ compression.
 *
 * Below PHI_REF (0.15), the raw harmonic mean is used — no compression.
 * Above PHI_REF, φ is compressed via a saturation curve before the harmonic
 * mean, modeling fines shielding/clogging/exhaustion in a percolation bed.
 *
 * Invariant: φ=0.15 @ 850μm → d_eff=400μm (calibration preserved exactly).
 */
export function computeEffectiveGrindSize(grindSize: number, phi: number): number {
  if (phi <= 0) return grindSize

  let phiE = phi
  if (phi > PHI_REF) {
    const x = Math.min(1, (phi - PHI_REF) / (PHI_HI - PHI_REF))
    const beta = BETA_0 + (BETA_1 - BETA_0) * Math.pow(x, N_COMPRESS)
    phiE = PHI_REF + beta * (phi - PHI_REF)
  }

  return 1 / ((1 - phiE) / grindSize + phiE / FINES_GRIND_SIZE)
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

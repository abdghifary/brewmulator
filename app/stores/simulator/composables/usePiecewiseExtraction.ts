import type { PourSchedule, ExtractionPoint, WasmModule, BrewRecipe, PourStep } from '../types'
import {
  T_AMBIENT, H_COOL, K_DEGAS, BLOOM_INHIBITION,
  FINES_GRIND_SIZE, PHI_SURFACE_REF, D_REF_SURFACE
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
  twoPhaseEnabled?: boolean
  methodModifierFast?: number // multiplied onto kFast after WASM call, default 1.0
  methodModifierSlow?: number // multiplied onto kSlow after WASM call, default 1.0
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

/**
 * Compute surface solubles fraction from grind size.
 *
 * φ_s represents the fraction of total extractable solubles that sit on
 * broken cell surfaces (created during grinding). Finer grinding breaks
 * more cells, exposing more surface solubles.
 *
 * Scaling: φ_s ∝ 1/d — surface-area-to-volume ratio of broken fragments.
 * Clamped to [0, 1] to prevent physically impossible values at extreme grind sizes.
 *
 * Reference: Spiro & Selwood (1984) — φ_s ≈ 0.30 at ~600μm for caffeine.
 *
 * TODO: Scale φ_s by roast level (darker = more brittle = higher φ_s).
 * Dark roasts undergo more cellulose pyrolysis, making cell walls fragile.
 * The same grinder setting shatters more cells on a dark roast, increasing
 * the surface solubles fraction. Approximate scaling: φ_s *= roastFactor
 * where roastFactor ≈ 0.85 (light), 1.0 (medium), 1.15 (dark).
 */
export function computeSurfaceFraction(grindSize: number): number {
   // TODO: accept roastLevel parameter and scale phiS by roast brittleness
   return Math.max(0, Math.min(1, PHI_SURFACE_REF * (D_REF_SURFACE / grindSize)))
}

export function generateSyntheticSchedule(recipe: BrewRecipe): PourStep[] {
  return [{ startTime: 0, waterGrams: recipe.waterGrams }]
}

export function computePiecewiseCurve(params: PiecewiseCurveParams): ExtractionPoint[] {
  const { pourSchedule, coffeeGrams, grindSize, roastLevel, method, maxTime, numPoints, wasmModule, globalTemp = 93, twoPhaseEnabled = false } = params

  if (pourSchedule.length === 0) return []

  const results: ExtractionPoint[] = []
  const dtStep = maxTime / (numPoints - 1)

  const sortedPours = [...pourSchedule].sort((a, b) => a.startTime - b.startTime)

  const bloomPour = sortedPours.find(p => p.isBloom)
  const bloomEndTime = bloomPour
    ? (sortedPours[sortedPours.findIndex(p => p.isBloom) + 1]?.startTime ?? maxTime)
    : -1

  let ePrev = 0
  let eFastPrev = 0
  let eSlowPrev = 0
  const phiS = twoPhaseEnabled ? computeSurfaceFraction(grindSize) : 0

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

    const eMax = wasmModule.E_MAX.value
    const alpha = wasmModule.ALPHA.value
    const yieldEq = eMax / (1 + alpha / ratio)
    const saturationFactor = 1 + alpha / ratio

    let e = 0

    if (twoPhaseEnabled) {
      let kFast = wasmModule.calculateFastRateConstant(currentTemp, effectiveGrindSize, roastLevel, 0)
      let kSlow = wasmModule.calculateRateConstant(currentTemp, effectiveGrindSize, roastLevel, 0)

      if (bloomPour && t >= bloomPour.startTime && t < bloomEndTime) {
        const bloomDt = t - bloomPour.startTime
        const fCo2 = 1 - BLOOM_INHIBITION * Math.exp(-K_DEGAS * bloomDt)
        kFast *= fCo2
        kSlow *= fCo2
      }

      kFast *= (params.methodModifierFast ?? 1.0)
      kSlow *= (params.methodModifierSlow ?? 1.0)

      const kFastObs = kFast * saturationFactor
      const kSlowObs = kSlow * saturationFactor
      const poolFastEq = phiS * yieldEq
      const poolSlowEq = (1 - phiS) * yieldEq
      const eFast = i === 0 ? 0 : poolFastEq - (poolFastEq - eFastPrev) * Math.exp(-kFastObs * dt)
      const eSlow = i === 0 ? 0 : poolSlowEq - (poolSlowEq - eSlowPrev) * Math.exp(-kSlowObs * dt)

      e = eFast + eSlow
      eFastPrev = eFast
      eSlowPrev = eSlow
    } else {
      let k = wasmModule.calculateRateConstant(currentTemp, effectiveGrindSize, roastLevel, 0)

      if (bloomPour && t >= bloomPour.startTime && t < bloomEndTime) {
        const bloomDt = t - bloomPour.startTime
        const fCo2 = 1 - BLOOM_INHIBITION * Math.exp(-K_DEGAS * bloomDt)
        k *= fCo2
      }

      const kObs = k * saturationFactor
      e = i === 0 ? 0 : yieldEq - (yieldEq - ePrev) * Math.exp(-kObs * dt)
      ePrev = e
    }

    results.push({ time: t, yield: Math.max(0, e) })
  }

  return results
}

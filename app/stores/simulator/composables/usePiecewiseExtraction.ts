import type { PourSchedule, ExtractionPoint, WasmModule } from '../types'
import { T_AMBIENT, H_COOL, K_DEGAS, BLOOM_INHIBITION } from '../constants'

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

    let k = wasmModule.calculateRateConstant(currentTemp, grindSize, roastLevel, method)

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

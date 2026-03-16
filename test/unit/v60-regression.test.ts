import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { WasmModule } from '../../app/stores/simulator/types'
import { computePiecewiseCurve, type PiecewiseCurveParams } from '../../app/stores/simulator/composables/usePiecewiseExtraction'
import { v60Templates } from '../../app/stores/simulator/constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any

beforeAll(async () => {
  const wasmPath = join(process.cwd(), 'build', 'release.wasm')
  const wasmBuffer = await readFile(wasmPath)
  const wasmInstanceSource = await WebAssembly.instantiate(wasmBuffer)
  wasmModule = wasmInstanceSource.instance.exports
})

describe('V60 full-curve regression', () => {
  it('V60 Hoffmann: extraction curve matches snapshot within 0.01%', () => {
    const hoffmannTemplate = v60Templates[1]!
    
    expect(hoffmannTemplate.name).toBe('James Hoffmann')
    expect(hoffmannTemplate.coffeeGrams).toBe(30)
    expect(hoffmannTemplate.grindSize).toBe(750)
    expect(hoffmannTemplate.totalWater).toBe(500)
    
    const curve = computePiecewiseCurve({
      pourSchedule: hoffmannTemplate.pourSchedule,
      coffeeGrams: hoffmannTemplate.coffeeGrams,
      grindSize: hoffmannTemplate.grindSize!,
      roastLevel: 1.0,
      method: 0,
      maxTime: 210,
      numPoints: 211,
      wasmModule: wasmModule as WasmModule,
      globalTemp: 93,
      twoPhaseEnabled: true
    })
    
    expect(curve).toHaveLength(211)
    
    const at = (t: number): number => {
      const point = curve.find(p => Math.abs(p.time - t) < 0.01)
      if (!point) throw new Error(`No point found at time ${t}`)
      return point.yield
    }
    
    expect(at(0)).toBeCloseTo(0.000000, 4)
    expect(at(15)).toBeCloseTo(3.648567, 4)
    expect(at(30)).toBeCloseTo(5.204780, 4)
    expect(at(45)).toBeCloseTo(6.228911, 4)
    expect(at(60)).toBeCloseTo(8.368838, 4)
    expect(at(90)).toBeCloseTo(10.379418, 4)
    expect(at(120)).toBeCloseTo(11.774054, 4)
    expect(at(180)).toBeCloseTo(13.857149, 4)
    expect(at(210)).toBeCloseTo(14.669060, 4)
  })
})

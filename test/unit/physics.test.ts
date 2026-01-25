import { describe, it, expect, beforeAll } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'

let wasmModule: any

beforeAll(async () => {
  const wasmPath = join(process.cwd(), 'build', 'release.wasm')
  const wasmBuffer = await readFile(wasmPath)
  const wasmInstanceSource = await WebAssembly.instantiate(wasmBuffer)
  wasmModule = wasmInstanceSource.instance.exports
})

describe('Physics Engine - Extraction Kinetics', () => {
  describe('calculateExtractionYield', () => {
    it('should return ~17-20% yield for V60 at standard conditions', () => {
      const time = 180
      const temp = 93
      const grind = 500
      const roast = 1.0
      const method = 0

      const result = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)

      expect(result).toBeGreaterThanOrEqual(16)
      expect(result).toBeLessThanOrEqual(20)
    })

    it('should return ~18-21% yield for Espresso at standard conditions', () => {
      const time = 25
      const temp = 93
      const grind = 250
      const roast = 1.0
      const method = 2

      const result = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)

      expect(result).toBeGreaterThanOrEqual(18)
      expect(result).toBeLessThanOrEqual(21)
    })

    it('should return ~15-18% yield for Cold Brew at 12 hours', () => {
      const time = 43200
      const temp = 20
      const grind = 1000
      const roast = 1.0
      const method = 4

      const result = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)

      expect(result).toBeGreaterThanOrEqual(14.5)
      expect(result).toBeLessThanOrEqual(18)
    })

    it('should return 0% yield when time is 0', () => {
      const time = 0
      const temp = 93
      const grind = 500
      const roast = 1.0
      const method = 0

      const result = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)

      expect(result).toBe(0)
    })

    it('should approach E_max (~28%) at very long times', () => {
      const time = 86400
      const temp = 93
      const grind = 500
      const roast = 1.0
      const method = 0

      const result = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)

      expect(result).toBeGreaterThanOrEqual(24.5)
      expect(result).toBeLessThanOrEqual(28)
    })

    it('should return higher yield for finer grind', () => {
      const time = 180
      const temp = 93
      const roast = 1.0
      const method = 0

      const coarseResult = wasmModule.calculateExtractionYield(time, temp, 800, roast, method, 288.0, 18.0)
      const fineResult = wasmModule.calculateExtractionYield(time, temp, 400, roast, method, 288.0, 18.0)

      expect(fineResult).toBeGreaterThan(coarseResult)
    })

    it('should return higher yield for higher temperature', () => {
      const time = 180
      const grind = 500
      const roast = 1.0
      const method = 0

      const lowTempResult = wasmModule.calculateExtractionYield(time, 85, grind, roast, method, 288.0, 18.0)
      const highTempResult = wasmModule.calculateExtractionYield(time, 95, grind, roast, method, 288.0, 18.0)

      expect(highTempResult).toBeGreaterThan(lowTempResult)
    })

    it('should return higher yield for darker roast', () => {
      const time = 180
      const temp = 93
      const grind = 500
      const method = 0

      const lightResult = wasmModule.calculateExtractionYield(time, temp, grind, 0.8, method, 288.0, 18.0)
      const darkResult = wasmModule.calculateExtractionYield(time, temp, grind, 1.2, method, 288.0, 18.0)

      expect(darkResult).toBeGreaterThan(lightResult)
    })

    describe('Brew Ratio Effects', () => {
      it('should return higher yield for higher water ratio (dilute)', () => {
        const time = 180
        const temp = 93
        const grind = 500
        const roast = 1.0
        const method = 0

        const baseline = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)
        const dilute = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 400.0, 18.0)

        expect(dilute).toBeGreaterThan(baseline)
      })

      it('should return lower yield for lower water ratio (concentrated)', () => {
        const time = 180
        const temp = 93
        const grind = 500
        const roast = 1.0
        const method = 0

        const baseline = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 288.0, 18.0)
        const concentrated = wasmModule.calculateExtractionYield(time, temp, grind, roast, method, 100.0, 18.0)

        expect(concentrated).toBeLessThan(baseline)
      })
    })
  })

  describe('calculateTDS', () => {
    it('should calculate TDS correctly for V60 at 20% yield', () => {
      const extractionYield = 20.0
      const coffeeGrams = 18.0
      const beverageWeight = 270.0

      const result = wasmModule.calculateTDS(extractionYield, coffeeGrams, beverageWeight)

      expect(result).toBeCloseTo(1.33, 2)
    })

    it('should calculate TDS correctly for Espresso at 20% yield', () => {
      const extractionYield = 20.0
      const coffeeGrams = 18.0
      const beverageWeight = 36.0

      const result = wasmModule.calculateTDS(extractionYield, coffeeGrams, beverageWeight)

      expect(result).toBeCloseTo(10.0, 1)
    })

    it('should return 0 when extraction yield is 0', () => {
      const extractionYield = 0.0
      const coffeeGrams = 18.0
      const beverageWeight = 270.0

      const result = wasmModule.calculateTDS(extractionYield, coffeeGrams, beverageWeight)

      expect(result).toBe(0)
    })
  })

  describe('calculateRateConstant', () => {
    it('should return higher k for higher temperature', () => {
      const grind = 500
      const roast = 1.0
      const method = 0

      const lowTempK = wasmModule.calculateRateConstant(85, grind, roast, method)
      const highTempK = wasmModule.calculateRateConstant(95, grind, roast, method)

      expect(highTempK).toBeGreaterThan(lowTempK)
    })

    it('should return higher k for finer grind', () => {
      const temp = 93
      const roast = 1.0
      const method = 0

      const coarseK = wasmModule.calculateRateConstant(temp, 800, roast, method)
      const fineK = wasmModule.calculateRateConstant(temp, 400, roast, method)

      expect(fineK).toBeGreaterThan(coarseK)
    })

    it('should return higher k for darker roast', () => {
      const temp = 93
      const grind = 500
      const method = 0

      const lightK = wasmModule.calculateRateConstant(temp, grind, 0.8, method)
      const darkK = wasmModule.calculateRateConstant(temp, grind, 1.2, method)

      expect(darkK).toBeGreaterThan(lightK)
    })

    it('should return higher k for espresso method vs drip', () => {
      const temp = 93
      const grind = 500
      const roast = 1.0

      const dripK = wasmModule.calculateRateConstant(temp, grind, roast, 0)
      const espressoK = wasmModule.calculateRateConstant(temp, grind, roast, 2)

      expect(espressoK).toBeGreaterThan(dripK)
    })
  })

  describe('getExtractionZone', () => {
    it('should return 0 (under-extracted) for yield < 18%', () => {
      const extractionYield = 15.0
      const method = 0

      const result = wasmModule.getExtractionZone(extractionYield, method)

      expect(result).toBe(0)
    })

    it('should return 1 (sweet spot) for yield 18-22%', () => {
      const extractionYield = 20.0
      const method = 0

      const result = wasmModule.getExtractionZone(extractionYield, method)

      expect(result).toBe(1)
    })

    it('should return 2 (over-extracted) for yield > 22%', () => {
      const extractionYield = 25.0
      const method = 0

      const result = wasmModule.getExtractionZone(extractionYield, method)

      expect(result).toBe(2)
    })

    it('should return 1 (sweet spot) at 18% boundary', () => {
      const extractionYield = 18.0
      const method = 0

      const result = wasmModule.getExtractionZone(extractionYield, method)

      expect(result).toBe(1)
    })

    it('should return 1 (sweet spot) at 22% boundary', () => {
      const extractionYield = 22.0
      const method = 0

      const result = wasmModule.getExtractionZone(extractionYield, method)

      expect(result).toBe(1)
    })
  })
})

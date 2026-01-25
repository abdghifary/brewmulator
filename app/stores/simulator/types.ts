export type BrewMethod = 'v60' | 'frenchPress' | 'espresso' | 'aeropress' | 'coldBrew'
export type RoastLevel = 'light' | 'medium' | 'dark'

export interface ExtractionPoint {
  time: number
  yield: number
}

export interface BrewRecipe {
  method: BrewMethod
  temperature: number
  grindSize: number
  roastLevel: RoastLevel
  brewTime: number
  coffeeGrams: number
  waterGrams: number
}

export interface BrewPreset {
  temperature: number
  grindSize: number
  roastLevel: RoastLevel
  brewTime: number
  coffeeGrams: number
  waterGrams: number
  maxTime: number
  tempRange: [number, number]
}

export interface WasmModule {
  calculateExtractionYield(
    time: number,
    temperature: number,
    grindSize: number,
    roastLevel: number,
    method: number,
    waterGrams: number,
    coffeeGrams: number
  ): number
  calculateTDS(
    extractionYield: number,
    coffeeGrams: number,
    beverageWeight: number
  ): number
  getExtractionZone(
    extractionYield: number,
    method: number
  ): number
}

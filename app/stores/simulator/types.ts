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
  pourSchedule?: PourSchedule
  finesFraction?: number  // 0.0-0.40, fraction of coffee mass that is fines (bimodal PSD)
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

export interface PourStep {
  startTime: number // seconds from brew start
  waterGrams: number // grams of water in this pour
  temperature?: number // °C, optional (uses recipe.temperature if omitted)
  isBloom?: boolean // true for the first bloom pour
  label?: string // optional display label
}

export type PourSchedule = PourStep[]

export interface V60RecipeTemplate {
  name: string
  coffeeGrams: number
  totalWater: number
  grindSize?: number
  pourSchedule: PourSchedule
  totalBrewTime?: number // total seconds including drawdown (overrides default 45s drain buffer)
  description?: string
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
  calculateRateConstant(
    temp: number,
    grind: number,
    roast: number,
    method: number
  ): number
  readonly E_MAX: { readonly value: number }
  readonly ALPHA: { readonly value: number }
}

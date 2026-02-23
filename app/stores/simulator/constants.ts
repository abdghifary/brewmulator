import type { BrewMethod, RoastLevel, BrewPreset, V60RecipeTemplate } from './types'

export const T_AMBIENT = 22 // °C, ambient temperature
export const H_COOL = 0.001 // /s, Newton cooling coefficient (~4°C/min, realistic for V60)
export const K_DEGAS = 0.03 // /s, CO2 degassing rate
export const BLOOM_INHIBITION = 0.6 // initial rate reduction during bloom
export const MAX_POUR_STEPS = 10 // max pour steps per schedule

export const v60Templates: V60RecipeTemplate[] = [
  {
    name: 'Tetsu Kasuya 4:6',
    coffeeGrams: 20,
    totalWater: 300,
    grindSize: 415,
    pourSchedule: [
      { startTime: 0, waterGrams: 60, isBloom: true, label: 'Bloom' },
      { startTime: 45, waterGrams: 60, label: 'Pour 2' },
      { startTime: 90, waterGrams: 60, label: 'Pour 3' },
      { startTime: 135, waterGrams: 60, label: 'Pour 4' },
      { startTime: 180, waterGrams: 60, label: 'Pour 5' }
    ],
    totalBrewTime: 210,
    description: 'Tetsu Kasuya 4:6 method — 5 equal pours at 45s intervals'
  },
  {
    name: 'James Hoffmann',
    coffeeGrams: 30,
    totalWater: 500,
    grindSize: 405,
    pourSchedule: [
      { startTime: 0, waterGrams: 60, isBloom: true, label: 'Bloom' },
      { startTime: 45, waterGrams: 240, label: 'Main pour' },
      { startTime: 75, waterGrams: 200, label: 'Top-off' }
    ],
    totalBrewTime: 210,
    description: 'James Hoffmann Ultimate V60 — bloom + single large pour + top-off'
  },
  {
    name: 'Scott Rao',
    coffeeGrams: 22,
    totalWater: 360,
    grindSize: 390,
    pourSchedule: [
      { startTime: 0, waterGrams: 66, isBloom: true, label: 'Bloom' },
      { startTime: 45, waterGrams: 134, label: 'Main pour' },
      { startTime: 75, waterGrams: 160, label: 'Final pour' }
    ],
    totalBrewTime: 195,
    description: 'Scott Rao method — 3x dose bloom, then two pours with Rao spin'
  },
  {
    name: 'Lance Hedrick',
    coffeeGrams: 15,
    totalWater: 250,
    grindSize: 340,
    pourSchedule: [
      { startTime: 0, waterGrams: 45, isBloom: true, label: 'Bloom' },
      { startTime: 40, waterGrams: 205, label: 'Single pour' }
    ],
    totalBrewTime: 150,
    description: 'Lance Hedrick 1-pour method — bloom then single continuous pour'
  },
  {
    name: 'Matt Winton',
    coffeeGrams: 20,
    totalWater: 300,
    grindSize: 400,
    pourSchedule: [
      { startTime: 0, waterGrams: 60, isBloom: true, label: 'Bloom' },
      { startTime: 45, waterGrams: 60, temperature: 88, label: 'Pour 2' },
      { startTime: 90, waterGrams: 60, temperature: 88, label: 'Pour 3' },
      { startTime: 135, waterGrams: 60, temperature: 88, label: 'Pour 4' },
      { startTime: 180, waterGrams: 60, temperature: 88, label: 'Pour 5' }
    ],
    totalBrewTime: 240,
    description: 'Matt Winton method — 5 pours with temperature stepping (93°C bloom → 88°C)'
  }
]

export const methodToNumber = (method: BrewMethod): number => {
  const map: Record<BrewMethod, number> = {
    v60: 0,
    frenchPress: 1,
    espresso: 2,
    aeropress: 3,
    coldBrew: 4
  }
  return map[method]
}

export const roastToNumber = (roast: RoastLevel): number => {
  const map: Record<RoastLevel, number> = {
    light: 0.8,
    medium: 1.0,
    dark: 1.2
  }
  return map[roast]
}

export const presetDefaults: Record<BrewMethod, BrewPreset> = {
  v60: {
    temperature: 93,
    grindSize: 500,
    roastLevel: 'medium',
    brewTime: 180,
    coffeeGrams: 18,
    waterGrams: 288,
    maxTime: 300,
    tempRange: [80, 100]
  },
  frenchPress: {
    temperature: 93,
    grindSize: 800,
    roastLevel: 'medium',
    brewTime: 240,
    coffeeGrams: 30,
    waterGrams: 450,
    maxTime: 600,
    tempRange: [80, 100]
  },
  espresso: {
    temperature: 93,
    grindSize: 250,
    roastLevel: 'medium',
    brewTime: 25,
    coffeeGrams: 18,
    waterGrams: 54, // Adjusted for ~36g yield (1:2 ratio)
    maxTime: 60,
    tempRange: [80, 100]
  },
  aeropress: {
    temperature: 85,
    grindSize: 600,
    roastLevel: 'medium',
    brewTime: 120,
    coffeeGrams: 15,
    waterGrams: 240,
    maxTime: 300,
    tempRange: [80, 100]
  },
  coldBrew: {
    temperature: 20,
    grindSize: 1000,
    roastLevel: 'medium',
    brewTime: 43200,
    coffeeGrams: 60,
    waterGrams: 900,
    maxTime: 86400,
    tempRange: [4, 25]
  }
}

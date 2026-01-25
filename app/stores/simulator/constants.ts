import type { BrewMethod, RoastLevel, BrewPreset } from './types'

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

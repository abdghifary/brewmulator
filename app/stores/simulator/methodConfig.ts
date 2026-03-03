import type { BrewMethod, BrewPreset } from './types'
import { presetDefaults, grindBounds } from './constants'

export interface MethodConfig {
  id: BrewMethod
  label: string
  defaults: BrewPreset
  grindBounds: { min: number, max: number, step: number }
  coffeeRange: { min: number, max: number }
  waterRange: { min: number, max: number }
  absorptionRate: number
  brewTimeStep: number
  sweetSpot: { min: number, max: number }
  drainBuffer: number
  supportsPourSchedule: boolean
  // Extension points for future plans (safe defaults)
  supportsFineFraction: boolean
  percolationMultiplier: number
  supportsDripperGeometry: boolean
}

export const METHOD_CONFIGS: Record<BrewMethod, MethodConfig> = {
  v60: {
    id: 'v60',
    label: 'V60',
    defaults: presetDefaults.v60,
    grindBounds: grindBounds.v60,
    coffeeRange: { min: 10, max: 60 },
    waterRange: { min: 100, max: 1000 },
    absorptionRate: 2.0,
    brewTimeStep: 10,
    sweetSpot: { min: 18, max: 22 },
    drainBuffer: 45,
    supportsPourSchedule: true,
    supportsFineFraction: true,
    percolationMultiplier: 1.0,
    supportsDripperGeometry: false
  },
  frenchPress: {
    id: 'frenchPress',
    label: 'French Press',
    defaults: presetDefaults.frenchPress,
    grindBounds: grindBounds.frenchPress,
    coffeeRange: { min: 10, max: 60 },
    waterRange: { min: 100, max: 1000 },
    absorptionRate: 2.0,
    brewTimeStep: 10,
    sweetSpot: { min: 18, max: 22 },
    drainBuffer: 45,
    supportsPourSchedule: false,
    supportsFineFraction: false,
    percolationMultiplier: 1.0,
    supportsDripperGeometry: false
  },
  espresso: {
    id: 'espresso',
    label: 'Espresso',
    defaults: presetDefaults.espresso,
    grindBounds: grindBounds.espresso,
    coffeeRange: { min: 7, max: 30 },
    waterRange: { min: 10, max: 150 },
    absorptionRate: 1.2,
    brewTimeStep: 1,
    sweetSpot: { min: 17, max: 23 },
    drainBuffer: 45,
    supportsPourSchedule: false,
    supportsFineFraction: false,
    percolationMultiplier: 1.0,
    supportsDripperGeometry: false
  },
  aeropress: {
    id: 'aeropress',
    label: 'AeroPress',
    defaults: presetDefaults.aeropress,
    grindBounds: grindBounds.aeropress,
    coffeeRange: { min: 10, max: 60 },
    waterRange: { min: 100, max: 1000 },
    absorptionRate: 2.0,
    brewTimeStep: 10,
    sweetSpot: { min: 18, max: 22 },
    drainBuffer: 45,
    supportsPourSchedule: false,
    supportsFineFraction: false,
    percolationMultiplier: 1.0,
    supportsDripperGeometry: false
  },
  coldBrew: {
    id: 'coldBrew',
    label: 'Cold Brew',
    defaults: presetDefaults.coldBrew,
    grindBounds: grindBounds.coldBrew,
    coffeeRange: { min: 10, max: 100 },
    waterRange: { min: 100, max: 1500 },
    absorptionRate: 2.0,
    brewTimeStep: 3600,
    sweetSpot: { min: 16, max: 20 },
    drainBuffer: 45,
    supportsPourSchedule: false,
    supportsFineFraction: false,
    percolationMultiplier: 1.0,
    supportsDripperGeometry: false
  }
}

export function getMethodConfig(method: BrewMethod): MethodConfig {
  return METHOD_CONFIGS[method]
}

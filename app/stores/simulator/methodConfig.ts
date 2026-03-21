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
  methodModifierFast: number
  methodModifierSlow: number
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
    supportsDripperGeometry: false,
    methodModifierFast: 1.0,
    methodModifierSlow: 1.0
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
    supportsDripperGeometry: false,
    // Two-phase modifiers: immersion restricts the surface-wash phase via a
    // stagnant boundary layer, but the 4 min steep still needs a modestly
    // stronger diffusion term to land in the calibrated EY band.
    methodModifierFast: 0.99,
    methodModifierSlow: 1.30
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
    supportsDripperGeometry: false,
    methodModifierFast: 12.0,
    methodModifierSlow: 4.0
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
    supportsDripperGeometry: false,
    // Two-phase modifiers: gentle pressure and agitation make AeroPress a bit
    // faster than neutral pour-over scaling without approaching espresso.
    methodModifierFast: 1.35,
    methodModifierSlow: 1.20
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
    supportsDripperGeometry: false,
    // Two-phase modifiers: cold, static immersion suppresses both wash and
    // diffusion phases; the slow phase is reduced most aggressively to keep
    // 12 h extraction within the calibrated cold-brew band.
    methodModifierFast: 0.90,
    methodModifierSlow: 0.45
  }
}

export function getMethodConfig(method: BrewMethod): MethodConfig {
  return METHOD_CONFIGS[method]
}

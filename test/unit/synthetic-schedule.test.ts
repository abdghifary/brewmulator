import { describe, it, expect } from 'vitest'
import type { BrewRecipe } from '../../app/stores/simulator/types'
import { presetDefaults } from '../../app/stores/simulator/constants'
import { generateSyntheticSchedule } from '../../app/stores/simulator/composables/usePiecewiseExtraction'

describe('generateSyntheticSchedule', () => {
  it('French Press: generates [{ startTime: 0, waterGrams: 450 }]', () => {
    const recipe: BrewRecipe = {
      method: 'frenchPress',
      temperature: presetDefaults.frenchPress.temperature,
      grindSize: presetDefaults.frenchPress.grindSize,
      roastLevel: presetDefaults.frenchPress.roastLevel,
      brewTime: presetDefaults.frenchPress.brewTime,
      coffeeGrams: presetDefaults.frenchPress.coffeeGrams,
      waterGrams: presetDefaults.frenchPress.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ startTime: 0, waterGrams: 450 })
  })

  it('Espresso: generates [{ startTime: 0, waterGrams: 54 }]', () => {
    const recipe: BrewRecipe = {
      method: 'espresso',
      temperature: presetDefaults.espresso.temperature,
      grindSize: presetDefaults.espresso.grindSize,
      roastLevel: presetDefaults.espresso.roastLevel,
      brewTime: presetDefaults.espresso.brewTime,
      coffeeGrams: presetDefaults.espresso.coffeeGrams,
      waterGrams: presetDefaults.espresso.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ startTime: 0, waterGrams: 54 })
  })

  it('AeroPress: generates [{ startTime: 0, waterGrams: 240 }]', () => {
    const recipe: BrewRecipe = {
      method: 'aeropress',
      temperature: presetDefaults.aeropress.temperature,
      grindSize: presetDefaults.aeropress.grindSize,
      roastLevel: presetDefaults.aeropress.roastLevel,
      brewTime: presetDefaults.aeropress.brewTime,
      coffeeGrams: presetDefaults.aeropress.coffeeGrams,
      waterGrams: presetDefaults.aeropress.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ startTime: 0, waterGrams: 240 })
  })

  it('Cold Brew: generates [{ startTime: 0, waterGrams: 900 }]', () => {
    const recipe: BrewRecipe = {
      method: 'coldBrew',
      temperature: presetDefaults.coldBrew.temperature,
      grindSize: presetDefaults.coldBrew.grindSize,
      roastLevel: presetDefaults.coldBrew.roastLevel,
      brewTime: presetDefaults.coldBrew.brewTime,
      coffeeGrams: presetDefaults.coldBrew.coffeeGrams,
      waterGrams: presetDefaults.coldBrew.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ startTime: 0, waterGrams: 900 })
  })

  it('has no isBloom: true step', () => {
    const recipe: BrewRecipe = {
      method: 'frenchPress',
      temperature: presetDefaults.frenchPress.temperature,
      grindSize: presetDefaults.frenchPress.grindSize,
      roastLevel: presetDefaults.frenchPress.roastLevel,
      brewTime: presetDefaults.frenchPress.brewTime,
      coffeeGrams: presetDefaults.frenchPress.coffeeGrams,
      waterGrams: presetDefaults.frenchPress.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)
    const step = result[0]

    expect(step.isBloom).toBeUndefined()
  })

  it('has no per-step temperature field', () => {
    const recipe: BrewRecipe = {
      method: 'coldBrew',
      temperature: presetDefaults.coldBrew.temperature,
      grindSize: presetDefaults.coldBrew.grindSize,
      roastLevel: presetDefaults.coldBrew.roastLevel,
      brewTime: presetDefaults.coldBrew.brewTime,
      coffeeGrams: presetDefaults.coldBrew.coffeeGrams,
      waterGrams: presetDefaults.coldBrew.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)
    const step = result[0]

    expect(step.temperature).toBeUndefined()
  })

  it('uses recipe.waterGrams not preset defaults (custom 500g)', () => {
    const recipe: BrewRecipe = {
      method: 'frenchPress',
      temperature: presetDefaults.frenchPress.temperature,
      grindSize: presetDefaults.frenchPress.grindSize,
      roastLevel: presetDefaults.frenchPress.roastLevel,
      brewTime: presetDefaults.frenchPress.brewTime,
      coffeeGrams: presetDefaults.frenchPress.coffeeGrams,
      waterGrams: 500 // custom value, not the preset 450
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result).toHaveLength(1)
    expect(result[0].waterGrams).toBe(500)
    expect(result[0].waterGrams).not.toBe(presetDefaults.frenchPress.waterGrams)
  })

  it('returns exactly 1 pour step', () => {
    const recipe: BrewRecipe = {
      method: 'aeropress',
      temperature: presetDefaults.aeropress.temperature,
      grindSize: presetDefaults.aeropress.grindSize,
      roastLevel: presetDefaults.aeropress.roastLevel,
      brewTime: presetDefaults.aeropress.brewTime,
      coffeeGrams: presetDefaults.aeropress.coffeeGrams,
      waterGrams: presetDefaults.aeropress.waterGrams
    }

    const result = generateSyntheticSchedule(recipe)

    expect(result.length).toBe(1)
  })
})

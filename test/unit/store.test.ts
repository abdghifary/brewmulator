import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useV60PourSchedule } from '../../app/stores/simulator/composables/useV60PourSchedule'
import type { BrewRecipe } from '../../app/stores/simulator/types'

function makeRecipe(overrides: Partial<BrewRecipe> = {}): BrewRecipe {
  return {
    method: 'v60',
    temperature: 93,
    grindSize: 500,
    roastLevel: 'medium',
    brewTime: 180,
    coffeeGrams: 18,
    waterGrams: 288,
    ...overrides
  }
}

describe('useV60PourSchedule', () => {
  it('starts with empty pour schedule', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, hasPourSchedule } = useV60PourSchedule(recipe)
    expect(pourSchedule.value).toHaveLength(0)
    expect(hasPourSchedule.value).toBe(false)
  })

  it('addPourStep adds a step and sorts by startTime', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, addPourStep } = useV60PourSchedule(recipe)
    addPourStep({ startTime: 45, waterGrams: 60, temperature: 93 })
    addPourStep({ startTime: 0, waterGrams: 60, temperature: 93, isBloom: true })
    expect(pourSchedule.value).toHaveLength(2)
    expect(pourSchedule.value[0]!.startTime).toBe(0)
    expect(pourSchedule.value[1]!.startTime).toBe(45)
  })

  it('removePourStep cannot remove bloom step', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, addPourStep, removePourStep } = useV60PourSchedule(recipe)
    addPourStep({ startTime: 0, waterGrams: 60, temperature: 93, isBloom: true })
    removePourStep(0)
    expect(pourSchedule.value).toHaveLength(1)
  })

  it('removePourStep removes non-bloom step', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, addPourStep, removePourStep } = useV60PourSchedule(recipe)
    addPourStep({ startTime: 0, waterGrams: 60, temperature: 93, isBloom: true })
    addPourStep({ startTime: 45, waterGrams: 60, temperature: 93 })
    removePourStep(1)
    expect(pourSchedule.value).toHaveLength(1)
  })

  it('clearPourSchedule empties the schedule', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, addPourStep, clearPourSchedule } = useV60PourSchedule(recipe)
    addPourStep({ startTime: 0, waterGrams: 60, temperature: 93, isBloom: true })
    clearPourSchedule()
    expect(pourSchedule.value).toHaveLength(0)
  })

  it('loadTemplate loads a V60 template', () => {
    const recipe = ref(makeRecipe())
    const { pourSchedule, loadTemplate } = useV60PourSchedule(recipe)
    loadTemplate(0)
    expect(pourSchedule.value.length).toBeGreaterThan(0)
    expect(recipe.value.coffeeGrams).toBeGreaterThan(0)
  })

  it('hasPourSchedule is true when method is v60 and schedule has steps', () => {
    const recipe = ref(makeRecipe({ method: 'v60' }))
    const { hasPourSchedule, addPourStep } = useV60PourSchedule(recipe)
    expect(hasPourSchedule.value).toBe(false)
    addPourStep({ startTime: 0, waterGrams: 60, temperature: 93, isBloom: true })
    expect(hasPourSchedule.value).toBe(true)
  })

  it('hasPourSchedule is false for non-v60 methods even with steps', () => {
    const recipe = ref(makeRecipe({ method: 'frenchPress' }))
    const { hasPourSchedule, addPourStep } = useV60PourSchedule(recipe)
    addPourStep({ startTime: 0, waterGrams: 200, temperature: 93 })
    expect(hasPourSchedule.value).toBe(false)
  })
})

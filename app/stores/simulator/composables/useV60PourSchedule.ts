import { ref, computed, type Ref } from 'vue'
import type { BrewRecipe, PourStep, PourSchedule } from '../types'
import { v60Templates, MAX_POUR_STEPS } from '../constants'
import { getMethodConfig } from '../methodConfig'
import { clampPourStep, clampGrindSize } from '../validation'

export function useV60PourSchedule(recipe: Ref<BrewRecipe>) {
  const pourSchedule = ref<PourSchedule>([])
  const hasPourSchedule = computed(() => recipe.value.method === 'v60' && pourSchedule.value.length > 0)

  function addPourStep(step: PourStep): void {
    if (pourSchedule.value.length >= MAX_POUR_STEPS) return
    pourSchedule.value.push(clampPourStep(step))
    pourSchedule.value.sort((a, b) => a.startTime - b.startTime)
    _recalculatePourTotals()
  }

  function removePourStep(index: number): void {
    if (pourSchedule.value[index]?.isBloom) return
    pourSchedule.value.splice(index, 1)
    _recalculatePourTotals()
  }

  function updatePourStep(index: number, step: PourStep): void {
    pourSchedule.value[index] = clampPourStep(step)
    pourSchedule.value.sort((a, b) => a.startTime - b.startTime)
    _recalculatePourTotals()
  }

  function loadTemplate(templateIndex: number): void {
    const template = v60Templates[templateIndex]
    if (!template) return
    pourSchedule.value = template.pourSchedule.map(clampPourStep)
    recipe.value.coffeeGrams = template.coffeeGrams
    recipe.value.waterGrams = template.totalWater
    recipe.value.grindSize = clampGrindSize(template.grindSize ?? recipe.value.grindSize, recipe.value.method)
    const firstTemp = template.pourSchedule[0]?.temperature
    if (firstTemp !== undefined) {
      recipe.value.temperature = firstTemp
    }
    _recalculatePourTotals()
    if (template.totalBrewTime) {
      recipe.value.brewTime = template.totalBrewTime
    }
  }

  function clearPourSchedule(): void {
    pourSchedule.value = []
    const defaults = getMethodConfig(recipe.value.method).defaults
    recipe.value.waterGrams = defaults.waterGrams
    recipe.value.brewTime = defaults.brewTime
  }

  function _recalculatePourTotals(): void {
    if (pourSchedule.value.length === 0) return
    recipe.value.waterGrams = pourSchedule.value.reduce((sum, s) => sum + s.waterGrams, 0)
    const lastPour = pourSchedule.value[pourSchedule.value.length - 1]
    if (lastPour) recipe.value.brewTime = lastPour.startTime + getMethodConfig(recipe.value.method).drainBuffer
  }

  return {
    pourSchedule,
    hasPourSchedule,
    addPourStep,
    removePourStep,
    updatePourStep,
    loadTemplate,
    clearPourSchedule,
  }
}

import { computed, type Ref } from 'vue'
import type { BrewRecipe } from '../types'
import { getMethodConfig } from '../methodConfig'

export function useBrewLimits(recipe: Ref<BrewRecipe>) {
  const coffeeMin = computed(() => getMethodConfig(recipe.value.method).coffeeRange.min)
  const coffeeMax = computed(() => getMethodConfig(recipe.value.method).coffeeRange.max)
  const waterMin = computed(() => getMethodConfig(recipe.value.method).waterRange.min)
  const waterMax = computed(() => getMethodConfig(recipe.value.method).waterRange.max)
  const grindMin = computed(() => getMethodConfig(recipe.value.method).grindBounds.min)
  const grindMax = computed(() => getMethodConfig(recipe.value.method).grindBounds.max)
  const grindStep = computed(() => getMethodConfig(recipe.value.method).grindBounds.step)

  return {
    coffeeMin,
    coffeeMax,
    waterMin,
    waterMax,
    grindMin,
    grindMax,
    grindStep
  }
}

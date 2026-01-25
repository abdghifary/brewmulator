import { computed, type Ref } from 'vue'
import type { BrewRecipe } from '../types'

export function useBrewLimits(recipe: Ref<BrewRecipe>) {
  const coffeeMin = computed(() => {
    return recipe.value.method === 'espresso' ? 7 : 10
  })

  const coffeeMax = computed(() => {
    if (recipe.value.method === 'espresso') return 30
    if (recipe.value.method === 'coldBrew') return 100
    return 60
  })

  const waterMin = computed(() => {
    return recipe.value.method === 'espresso' ? 10 : 100
  })

  const waterMax = computed(() => {
    if (recipe.value.method === 'espresso') return 150
    return recipe.value.method === 'coldBrew' ? 1500 : 1000
  })

  return {
    coffeeMin,
    coffeeMax,
    waterMin,
    waterMax
  }
}

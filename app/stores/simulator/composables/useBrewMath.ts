import { computed, type Ref } from 'vue'
import type { BrewRecipe, WasmModule } from '../types'
import { methodToNumber, roastToNumber } from '../constants'

export function useBrewMath(recipe: Ref<BrewRecipe>, wasmModule: Ref<WasmModule | null>) {
  const brewRatio = computed(() => {
    if (recipe.value.coffeeGrams === 0) return 0
    return recipe.value.waterGrams / recipe.value.coffeeGrams
  })

  const extractionYield = computed(() => {
    if (!wasmModule.value) return 0
    return wasmModule.value.calculateExtractionYield(
      recipe.value.brewTime,
      recipe.value.temperature,
      recipe.value.grindSize,
      roastToNumber(recipe.value.roastLevel),
      methodToNumber(recipe.value.method),
      recipe.value.waterGrams,
      recipe.value.coffeeGrams
    )
  })

  const beverageWeight = computed(() => {
    // Absorption rate depends on brew method:
    // Espresso: ~1.2x (high pressure, lower retention)
    // Others: ~2.0x (standard drip/immersion retention)
    const absorptionRate = recipe.value.method === 'espresso' ? 1.2 : 2.0
    const absorbed = recipe.value.coffeeGrams * absorptionRate
    const waterMass = Math.max(0, recipe.value.waterGrams - absorbed)

    // Add dissolved solids to beverage weight (mass conservation)
    // extractionYield is in percent (0-28)
    const solubles = (extractionYield.value / 100.0) * recipe.value.coffeeGrams

    return waterMass + solubles
  })

  const tds = computed(() => {
    if (!wasmModule.value || beverageWeight.value === 0) return 0
    return wasmModule.value.calculateTDS(
      extractionYield.value,
      recipe.value.coffeeGrams,
      beverageWeight.value
    )
  })

  const extractionZone = computed(() => {
    if (!wasmModule.value) return 0
    return wasmModule.value.getExtractionZone(
      extractionYield.value,
      methodToNumber(recipe.value.method)
    )
  })

  return {
    brewRatio,
    beverageWeight,
    extractionYield,
    tds,
    extractionZone
  }
}

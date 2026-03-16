import { computed, type Ref } from 'vue'
import type { BrewRecipe, ExtractionPoint, WasmModule } from '../types'
import { getMethodConfig } from '../methodConfig'

export function useBrewMath(
  recipe: Ref<BrewRecipe>,
  wasmModule: Ref<WasmModule | null>,
  extractionCurve: Ref<ExtractionPoint[]>
) {
  const brewRatio = computed(() => {
    if (recipe.value.coffeeGrams === 0) return 0
    return recipe.value.waterGrams / recipe.value.coffeeGrams
  })

  const extractionYield = computed(() => {
    if (extractionCurve.value.length === 0) return 0
    return extractionCurve.value[extractionCurve.value.length - 1]!.yield
  })

  const beverageWeight = computed(() => {
    // Absorption rate depends on brew method:
    // Espresso: ~1.2x (high pressure, lower retention)
    // Others: ~2.0x (standard drip/immersion retention)
    const absorptionRate = getMethodConfig(recipe.value.method).absorptionRate
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
    const config = getMethodConfig(recipe.value.method)
    const ey = extractionYield.value
    if (ey < config.sweetSpot.min) return 0 // under-extracted
    if (ey <= config.sweetSpot.max) return 1 // sweet spot
    return 2 // over-extracted
  })

  return {
    brewRatio,
    beverageWeight,
    extractionYield,
    tds,
    extractionZone
  }
}

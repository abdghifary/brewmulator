import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useBrewMath } from '../../app/stores/simulator/composables/useBrewMath'
import type { BrewRecipe, ExtractionPoint } from '../../app/stores/simulator/types'

const baseRecipe: BrewRecipe = {
  method: 'v60',
  temperature: 93,
  grindSize: 500,
  roastLevel: 'medium',
  brewTime: 180,
  coffeeGrams: 18,
  waterGrams: 288,
  finesFraction: undefined
}

describe('useBrewMath extractionYield', () => {
  it('returns 0 when extractionCurve is empty', () => {
    const recipe = ref(baseRecipe)
    const wasmModule = ref(null)
    const curve = ref<ExtractionPoint[]>([])
    const { extractionYield } = useBrewMath(recipe, wasmModule, curve)
    expect(extractionYield.value).toBe(0)
  })

  it('returns the last point yield from a non-empty curve', () => {
    const recipe = ref(baseRecipe)
    const wasmModule = ref(null)
    const curve = ref<ExtractionPoint[]>([
      { time: 0, yield: 0 },
      { time: 60, yield: 12.5 },
      { time: 180, yield: 20.3 }
    ])
    const { extractionYield } = useBrewMath(recipe, wasmModule, curve)
    expect(extractionYield.value).toBeCloseTo(20.3, 4)
  })
})

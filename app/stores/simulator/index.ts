import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { BrewMethod, BrewRecipe, ExtractionPoint, WasmModule } from './types'
import { presetDefaults, methodToNumber, roastToNumber, DEFAULT_FINES_FRACTION } from './constants'
import { clampFinesFraction } from './validation'
import { getMethodConfig } from './methodConfig'
import { useBrewMath } from './composables/useBrewMath'
import { useBrewLimits } from './composables/useBrewLimits'
import { useV60PourSchedule } from './composables/useV60PourSchedule'
import { computePiecewiseCurve } from './composables/usePiecewiseExtraction'

export * from './types'
export * from './constants'
export * from './methodConfig'

export const useSimulatorStore = defineStore('simulator', () => {
  // Infrastructure State
  const wasmModule = ref<WasmModule | null>(null)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  // Domain State
  const recipe = ref<BrewRecipe>({
    method: 'v60',
    temperature: 93,
    grindSize: 500,
    roastLevel: 'medium',
    brewTime: 180,
    coffeeGrams: 18,
    waterGrams: 288,
    finesFraction: undefined
  })

  const extractionCurve = ref<ExtractionPoint[]>([])

  // Domain Composables
  const v60Pour = useV60PourSchedule(recipe)
  const { brewRatio, beverageWeight, extractionYield, tds, extractionZone } = useBrewMath(recipe, wasmModule, v60Pour.hasPourSchedule, extractionCurve)
  const limits = useBrewLimits(recipe)

  // Actions
  const computeCurve = () => {
    if (!wasmModule.value) {
      extractionCurve.value = []
      return
    }

    // Piecewise path for V60 with pour schedule
    if (v60Pour.hasPourSchedule.value) {
      extractionCurve.value = computePiecewiseCurve({
        pourSchedule: v60Pour.pourSchedule.value,
        coffeeGrams: recipe.value.coffeeGrams,
        grindSize: recipe.value.grindSize,
        roastLevel: roastToNumber(recipe.value.roastLevel),
        method: methodToNumber(recipe.value.method),
        maxTime: recipe.value.brewTime,
        numPoints: 101,
        wasmModule: wasmModule.value,
        globalTemp: recipe.value.temperature,
        finesFraction: getMethodConfig(recipe.value.method).supportsFineFraction ? clampFinesFraction(recipe.value.finesFraction ?? DEFAULT_FINES_FRACTION) : undefined
      })
      return
    }

    // Legacy path — single-pour methods
    const { method, temperature, grindSize, roastLevel, waterGrams, coffeeGrams } = recipe.value
    const preset = presetDefaults[method]
    const maxTime = preset.maxTime
    const numPoints = 100

    // Optimization: Pre-calculate numeric values to avoid lookups in the loop
    const methodNum = methodToNumber(method)
    const roastNum = roastToNumber(roastLevel)

    const points: ExtractionPoint[] = []

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * maxTime
      const y = wasmModule.value.calculateExtractionYield(
        t,
        temperature,
        grindSize,
        roastNum,
        methodNum,
        waterGrams,
        coffeeGrams
      )
      points.push({ time: t, yield: y })
    }

    extractionCurve.value = points
  }

  // Watch for deep changes in recipe to trigger re-computation
  watch(recipe, () => {
    computeCurve()
  }, { deep: true })

  watch(v60Pour.pourSchedule, () => computeCurve(), { deep: true })

  const initialize = async () => {
    try {
      const module = await import('../../../build/release.js')
      wasmModule.value = module
      isLoading.value = false
      setPreset('v60')
    } catch (e) {
      error.value = e as Error
      isLoading.value = false
      console.error('Failed to load WASM module:', e)
    }
  }

  const setPreset = (newMethod: BrewMethod) => {
    if (recipe.value.method === 'v60' && newMethod !== 'v60') v60Pour.clearPourSchedule()
    const preset = presetDefaults[newMethod]
    recipe.value = {
      method: newMethod,
      temperature: preset.temperature,
      grindSize: preset.grindSize,
      roastLevel: preset.roastLevel,
      brewTime: preset.brewTime,
      coffeeGrams: preset.coffeeGrams,
      waterGrams: preset.waterGrams,
      finesFraction: newMethod === 'v60' ? recipe.value.finesFraction : undefined
    }
    // Compute immediately on preset change
    computeCurve()
  }

  return {
    // Infrastructure
    isLoading,
    error,
    initialize,

    // State
    recipe,
    extractionCurve,

    // Actions
    setPreset,
    computeCurve,

    // Computed
    brewRatio,
    beverageWeight,
    extractionYield,
    tds,
    extractionZone,
    ...limits,

    // V60 pour schedule (composed)
    ...v60Pour
  }
})

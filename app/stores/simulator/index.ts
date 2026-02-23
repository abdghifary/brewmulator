import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BrewMethod, BrewRecipe, ExtractionPoint, WasmModule, PourStep, PourSchedule } from './types'
import { presetDefaults, methodToNumber, roastToNumber, v60Templates, MAX_POUR_STEPS } from './constants'
import { useBrewMath } from './composables/useBrewMath'
import { useBrewLimits } from './composables/useBrewLimits'
import { computePiecewiseCurve } from './composables/usePiecewiseExtraction'

export * from './types'
export * from './constants'

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
    waterGrams: 288
  })

  const extractionCurve = ref<ExtractionPoint[]>([])
  const pourSchedule = ref<PourSchedule>([])

  const hasPourSchedule = computed(() => recipe.value.method === 'v60' && pourSchedule.value.length > 0)

  // Domain Composables
  const { brewRatio, beverageWeight, extractionYield, tds, extractionZone } = useBrewMath(recipe, wasmModule, hasPourSchedule, extractionCurve)
  const limits = useBrewLimits(recipe)

  // Actions
  const computeCurve = () => {
    if (!wasmModule.value) {
      extractionCurve.value = []
      return
    }

    // Piecewise path for V60 with pour schedule
    if (hasPourSchedule.value) {
      extractionCurve.value = computePiecewiseCurve({
        pourSchedule: pourSchedule.value,
        coffeeGrams: recipe.value.coffeeGrams,
        grindSize: recipe.value.grindSize,
        roastLevel: roastToNumber(recipe.value.roastLevel),
        method: methodToNumber(recipe.value.method),
        maxTime: recipe.value.brewTime,
        numPoints: 101,
        wasmModule: wasmModule.value,
        globalTemp: recipe.value.temperature
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

  watch(pourSchedule, () => computeCurve(), { deep: true })

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
    if (recipe.value.method === 'v60' && newMethod !== 'v60') clearPourSchedule()
    const preset = presetDefaults[newMethod]
    recipe.value = {
      method: newMethod,
      temperature: preset.temperature,
      grindSize: preset.grindSize,
      roastLevel: preset.roastLevel,
      brewTime: preset.brewTime,
      coffeeGrams: preset.coffeeGrams,
      waterGrams: preset.waterGrams
    }
    // Compute immediately on preset change
    computeCurve()
  }

  function addPourStep(step: PourStep): void {
    if (pourSchedule.value.length >= MAX_POUR_STEPS) return
    pourSchedule.value.push(step)
    pourSchedule.value.sort((a, b) => a.startTime - b.startTime)
    _recalculatePourTotals()
  }

  function removePourStep(index: number): void {
    pourSchedule.value.splice(index, 1)
    _recalculatePourTotals()
  }

  function updatePourStep(index: number, step: PourStep): void {
    pourSchedule.value[index] = step
    pourSchedule.value.sort((a, b) => a.startTime - b.startTime)
    _recalculatePourTotals()
  }

  function loadTemplate(templateIndex: number): void {
    const template = v60Templates[templateIndex]
    if (!template) return
    pourSchedule.value = [...template.pourSchedule]
    recipe.value.coffeeGrams = template.coffeeGrams
    recipe.value.waterGrams = template.totalWater
    recipe.value.grindSize = template.grindSize ?? recipe.value.grindSize
    const firstTemp = template.pourSchedule[0]?.temperature
    if (firstTemp !== undefined) {
      recipe.value.temperature = firstTemp
    }
    _recalculatePourTotals()
    // Use template's documented total brew time (includes drawdown) if available
    if (template.totalBrewTime) {
      recipe.value.brewTime = template.totalBrewTime
    }
  }

  function clearPourSchedule(): void {
    pourSchedule.value = []
    const defaults = presetDefaults[recipe.value.method]
    recipe.value.waterGrams = defaults.waterGrams
    recipe.value.brewTime = defaults.brewTime
  }

  function _recalculatePourTotals(): void {
    if (pourSchedule.value.length === 0) return
    recipe.value.waterGrams = pourSchedule.value.reduce((sum, s) => sum + s.waterGrams, 0)
    const lastPour = pourSchedule.value[pourSchedule.value.length - 1]
    if (lastPour) recipe.value.brewTime = lastPour.startTime + 45
  }

  return {
    // Infrastructure
    isLoading,
    error,
    initialize,

    // State
    recipe,
    extractionCurve,
    pourSchedule,

    // Actions
    setPreset,
    computeCurve,
    addPourStep,
    removePourStep,
    updatePourStep,
    loadTemplate,
    clearPourSchedule,

    // Computed
    hasPourSchedule,
    brewRatio,
    beverageWeight,
    extractionYield,
    tds,
    extractionZone,
    ...limits
  }
})

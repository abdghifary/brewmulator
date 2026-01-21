import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'

type BrewMethod = 'v60' | 'frenchPress' | 'espresso' | 'aeropress' | 'coldBrew'
type RoastLevel = 'light' | 'medium' | 'dark'

interface ExtractionPoint {
  time: number
  yield: number
}

const methodToNumber = (method: BrewMethod): number => {
  const map: Record<BrewMethod, number> = {
    v60: 0,
    frenchPress: 1,
    espresso: 2,
    aeropress: 3,
    coldBrew: 4
  }
  return map[method]
}

const roastToNumber = (roast: RoastLevel): number => {
  const map: Record<RoastLevel, number> = {
    light: 0.8,
    medium: 1.0,
    dark: 1.2
  }
  return map[roast]
}

export const presetDefaults: Record<BrewMethod, {
  temperature: number
  grindSize: number
  roastLevel: RoastLevel
  brewTime: number
  coffeeGrams: number
  waterGrams: number
  maxTime: number
  tempRange: [number, number]
}> = {
  v60: {
    temperature: 93,
    grindSize: 500,
    roastLevel: 'medium',
    brewTime: 180,
    coffeeGrams: 18,
    waterGrams: 288,
    maxTime: 300,
    tempRange: [80, 100]
  },
  frenchPress: {
    temperature: 93,
    grindSize: 800,
    roastLevel: 'medium',
    brewTime: 240,
    coffeeGrams: 30,
    waterGrams: 450,
    maxTime: 600,
    tempRange: [80, 100]
  },
  espresso: {
    temperature: 93,
    grindSize: 250,
    roastLevel: 'medium',
    brewTime: 25,
    coffeeGrams: 18,
    waterGrams: 36,
    maxTime: 60,
    tempRange: [80, 100]
  },
  aeropress: {
    temperature: 85,
    grindSize: 600,
    roastLevel: 'medium',
    brewTime: 120,
    coffeeGrams: 15,
    waterGrams: 240,
    maxTime: 300,
    tempRange: [80, 100]
  },
  coldBrew: {
    temperature: 20,
    grindSize: 1000,
    roastLevel: 'medium',
    brewTime: 43200,
    coffeeGrams: 60,
    waterGrams: 900,
    maxTime: 86400,
    tempRange: [4, 25]
  }
}

export const useSimulatorStore = defineStore('simulator', () => {
  const wasmModule = ref<any>(null)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  const method = ref<BrewMethod>('v60')
  const temperature = ref(93)
  const grindSize = ref(500)
  const roastLevel = ref<RoastLevel>('medium')
  const brewTime = ref(180)
  const coffeeGrams = ref(18)
  const waterGrams = ref(288)
  
  const extractionCurve = ref<ExtractionPoint[]>([])

  const initialize = async () => {
    try {
      const module = await import('../../build/release.js')
      wasmModule.value = module
      isLoading.value = false
      setPreset('v60')
    } catch (e) {
      error.value = e as Error
      isLoading.value = false
      console.error('Failed to load WASM module:', e)
    }
  }

  const brewRatio = computed(() => {
    if (coffeeGrams.value === 0) return 0
    return waterGrams.value / coffeeGrams.value
  })

  const beverageWeight = computed(() => {
    const absorbed = coffeeGrams.value * 2
    return Math.max(0, waterGrams.value - absorbed)
  })

  const extractionYield = computed(() => {
    if (!wasmModule.value) return 0
    return wasmModule.value.calculateExtractionYield(
      brewTime.value,
      temperature.value,
      grindSize.value,
      roastToNumber(roastLevel.value),
      methodToNumber(method.value)
    )
  })

  const tds = computed(() => {
    if (!wasmModule.value || beverageWeight.value === 0) return 0
    return wasmModule.value.calculateTDS(
      extractionYield.value,
      coffeeGrams.value,
      beverageWeight.value
    )
  })

  const extractionZone = computed(() => {
    if (!wasmModule.value) return 0
    return wasmModule.value.getExtractionZone(
      extractionYield.value,
      methodToNumber(method.value)
    )
  })

  const computeCurve = () => {
    if (!wasmModule.value) {
      extractionCurve.value = []
      return
    }

    const preset = presetDefaults[method.value]
    const points: ExtractionPoint[] = []
    const numPoints = 100
    const maxTime = preset.maxTime

    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * maxTime
      const y = wasmModule.value.calculateExtractionYield(
        t,
        temperature.value,
        grindSize.value,
        roastToNumber(roastLevel.value),
        methodToNumber(method.value)
      )
      points.push({ time: t, yield: y })
    }

    extractionCurve.value = points
  }

  const debouncedCompute = useDebounceFn(computeCurve, 150)

  const setPreset = (presetMethod: BrewMethod) => {
    const preset = presetDefaults[presetMethod]
    method.value = presetMethod
    temperature.value = preset.temperature
    grindSize.value = preset.grindSize
    roastLevel.value = preset.roastLevel
    brewTime.value = preset.brewTime
    coffeeGrams.value = preset.coffeeGrams
    waterGrams.value = preset.waterGrams
    computeCurve()
  }

  return {
    isLoading,
    error,
    method,
    temperature,
    grindSize,
    roastLevel,
    brewTime,
    coffeeGrams,
    waterGrams,
    extractionCurve,
    
    brewRatio,
    beverageWeight,
    extractionYield,
    tds,
    extractionZone,
    
    initialize,
    setPreset,
    debouncedCompute,
    computeCurve
  }
})

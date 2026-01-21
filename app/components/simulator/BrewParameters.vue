<template>
  <div class="brew-parameters space-y-4">
    <UFormField :label="`Temperature: ${store.temperature}°C`">
      <USlider
        v-model="store.temperature"
        :min="currentPreset.tempRange[0]"
        :max="currentPreset.tempRange[1]"
        :step="1"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>

    <UFormField :label="`Grind Size: ${store.grindSize}μm`">
      <USlider
        v-model="store.grindSize"
        :min="200"
        :max="1400"
        :step="50"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>

    <UFormField label="Roast Level">
      <div class="flex gap-2">
        <UButton
          v-for="roast in roastLevels"
          :key="roast"
          :variant="store.roastLevel === roast ? 'solid' : 'outline'"
          :color="store.roastLevel === roast ? 'primary' : 'neutral'"
          @click="setRoast(roast)"
        >
          {{ roast.charAt(0).toUpperCase() + roast.slice(1) }}
        </UButton>
      </div>
    </UFormField>

    <UFormField :label="`Brew Time: ${formatTime(store.brewTime)}`">
      <USlider
        v-model="store.brewTime"
        :min="0"
        :max="currentPreset.maxTime"
        :step="store.method === 'espresso' ? 1 : store.method === 'coldBrew' ? 3600 : 10"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { presetDefaults } from '~/stores/simulator'

type RoastLevel = 'light' | 'medium' | 'dark'

const store = useSimulatorStore()
const roastLevels: RoastLevel[] = ['light', 'medium', 'dark']

const currentPreset = computed(() => presetDefaults[store.method])

function setRoast(roast: RoastLevel) {
  store.roastLevel = roast
  store.debouncedCompute()
}

function formatTime(seconds: number): string {
  if (store.method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (store.method === 'espresso') {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

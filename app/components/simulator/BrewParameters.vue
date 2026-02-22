<template>
  <div class="brew-parameters space-y-4">
    <UFormField :label="`Temperature: ${store.recipe.temperature}°C`">
      <USlider
        v-model="store.recipe.temperature"
        :min="currentPreset.tempRange[0]"
        :max="currentPreset.tempRange[1]"
        :step="1"
        :disabled="store.hasPourSchedule"
      />
      <p
        v-if="store.hasPourSchedule"
        class="text-xs text-gray-400 mt-1"
      >
        Kettle temperature is set by pour schedule
      </p>
    </UFormField>

    <UFormField :label="`Grind Size: ${store.recipe.grindSize}μm`">
      <USlider
        v-model="store.recipe.grindSize"
        :min="grindMin"
        :max="grindMax"
        :step="grindStep"
      />
    </UFormField>

    <UFormField label="Roast Level">
      <div class="flex gap-2">
        <UButton
          v-for="roast in roastLevels"
          :key="roast"
          :variant="store.recipe.roastLevel === roast ? 'solid' : 'outline'"
          :color="store.recipe.roastLevel === roast ? 'primary' : 'neutral'"
          @click="setRoast(roast)"
        >
          {{ roast.charAt(0).toUpperCase() + roast.slice(1) }}
        </UButton>
      </div>
    </UFormField>

    <UFormField :label="`Brew Time: ${formatTime(store.recipe.brewTime)}`">
      <USlider
        v-model="store.recipe.brewTime"
        :min="0"
        :max="currentPreset.maxTime"
        :step="store.recipe.method === 'espresso' ? 1 : store.recipe.method === 'coldBrew' ? 3600 : 10"
        :disabled="store.hasPourSchedule"
      />
      <p
        v-if="store.hasPourSchedule"
        class="text-xs text-gray-400 mt-1"
      >
        Brew time is set by pour schedule
      </p>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { presetDefaults } from '~/stores/simulator/constants'

type RoastLevel = 'light' | 'medium' | 'dark'

const store = useSimulatorStore()
const roastLevels: RoastLevel[] = ['light', 'medium', 'dark']

const currentPreset = computed(() => presetDefaults[store.recipe.method])

const grindMin = computed(() => store.recipe.method === 'espresso' ? 50 : 200)
const grindMax = computed(() => 1500)
const grindStep = computed(() => store.recipe.method === 'espresso' ? 10 : 50)

function setRoast(roast: RoastLevel) {
  store.recipe.roastLevel = roast
}

function formatTime(seconds: number): string {
  if (store.recipe.method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (store.recipe.method === 'espresso') {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

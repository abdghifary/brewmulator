<template>
  <div class="brew-parameters space-y-4">
    <UFormField
      v-if="store.recipe.method !== 'v60'"
      :label="'Temperature: ' + store.recipe.temperature + '°C'"
    >
      <USlider
        v-model="store.recipe.temperature"
        :min="currentPreset.tempRange[0]"
        :max="currentPreset.tempRange[1]"
        :step="1"
      />
    </UFormField>

    <UFormField label="Grinder">
      <USelect
        v-model="selectedGrinderId"
        :items="grinders.map(g => ({ label: g.name, value: g.id }))"
      />
      <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
        Grind values are model-calibrated for this simulator.
        Results show relative trends accurately; absolute numbers are approximate.
      </p>
    </UFormField>

    <UFormField
      :label="isRawMode
        ? `Grind Size: ${store.recipe.grindSize}μm`
        : `Grind Size: ${store.recipe.grindSize}μm (${selectedGrinder.clickLabel} ${clicksForMicrons(store.recipe.grindSize)})`"
    >
      <div class="flex items-center gap-3">
        <USlider
          v-model="store.recipe.grindSize"
          :min="store.grindMin"
          :max="store.grindMax"
          :step="isRawMode ? store.grindStep : selectedGrinder.micronsPerClick * selectedGrinder.clickStep"
          class="flex-1"
        />
        <UInput
          type="number"
          :min="store.grindMin"
          :max="store.grindMax"
          class="w-20"
          :model-value="store.recipe.grindSize"
          @update:model-value="onGrindInput"
        />
      </div>
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

    <UFormField
      v-if="store.recipe.method !== 'v60'"
      :label="'Brew Time: ' + formatTimeFull(store.recipe.brewTime, store.recipe.method)"
    >
      <USlider
        v-model="store.recipe.brewTime"
        :min="0"
        :max="currentPreset.maxTime"
        :step="getMethodConfig(store.recipe.method).brewTimeStep"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { presetDefaults } from '~/stores/simulator/constants'
import { useGrinderProfile } from '~/stores/simulator/composables/useGrinderProfile'
import { formatTimeFull } from '~/stores/simulator/utils'
import { getMethodConfig } from '~/stores/simulator/methodConfig'

type RoastLevel = 'light' | 'medium' | 'dark'

const store = useSimulatorStore()
const { selectedGrinderId, selectedGrinder, isRawMode, clicksForMicrons, micronsForClicks, grinderProfiles: grinders } = useGrinderProfile()
watch(selectedGrinderId, () => {
  // Snap current grindSize to nearest valid click for the new grinder
  const clicks = clicksForMicrons(store.recipe.grindSize)
  const snapped = micronsForClicks(clicks)
  // Only update if snapped value differs and is within method bounds
  store.recipe.grindSize = Math.max(store.grindMin, Math.min(store.grindMax, snapped))
})

let grindInputTimeout: ReturnType<typeof setTimeout> | null = null

function onGrindInput(value: string | number) {
  if (grindInputTimeout) clearTimeout(grindInputTimeout)
  grindInputTimeout = setTimeout(() => {
    const num = Number(value)
    if (!isNaN(num) && num > 0) {
      store.recipe.grindSize = Math.max(store.grindMin, Math.min(store.grindMax, num))
    }
  }, 300) // 300ms debounce
}
const roastLevels: RoastLevel[] = ['light', 'medium', 'dark']

const currentPreset = computed(() => presetDefaults[store.recipe.method])

function setRoast(roast: RoastLevel) {
  store.recipe.roastLevel = roast
}
</script>

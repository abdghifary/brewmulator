<template>
  <div class="preset-selector">
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="preset in presets"
        :key="preset.id"
        :variant="store.recipe.method === preset.id ? 'solid' : 'outline'"
        :color="store.recipe.method === preset.id ? 'primary' : 'neutral'"
        :icon="preset.icon"
        @click="store.setPreset(preset.id)"
      >
        {{ preset.label }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulatorStore } from '~/stores/simulator'

const store = useSimulatorStore()

const presets = [
  { id: 'v60' as const, label: 'V60', icon: 'i-lucide-filter' },
  { id: 'frenchPress' as const, label: 'French Press', icon: 'i-lucide-coffee' },
  { id: 'espresso' as const, label: 'Espresso', icon: 'i-lucide-gauge' },
  { id: 'aeropress' as const, label: 'AeroPress', icon: 'i-lucide-arrow-down-to-line' },
  { id: 'coldBrew' as const, label: 'Cold Brew', icon: 'i-lucide-snowflake' }
]
</script>

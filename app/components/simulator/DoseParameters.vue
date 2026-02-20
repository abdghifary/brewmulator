<template>
  <div class="dose-parameters space-y-4">
    <UFormField :label="`Coffee: ${store.recipe.coffeeGrams}g`">
      <USlider
        v-model="store.recipe.coffeeGrams"
        :min="store.coffeeMin"
        :max="store.coffeeMax"
        :step="0.5"
      />
    </UFormField>

    <UFormField :label="`Water: ${store.recipe.waterGrams}g`">
      <USlider
        v-model="store.recipe.waterGrams"
        :min="store.waterMin"
        :max="store.waterMax"
        :step="1"
        :disabled="store.hasPourSchedule"
      />
      <p
        v-if="store.hasPourSchedule"
        class="text-xs text-gray-400 mt-1"
      >
        Water is set by pour schedule
      </p>
    </UFormField>

    <div class="space-y-1 text-sm text-gray-500">
      <div>Brew Ratio: 1:{{ store.brewRatio.toFixed(1) }}</div>
      <div>Beverage Weight: {{ store.beverageWeight.toFixed(0) }}g</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulatorStore } from '~/stores/simulator'

const store = useSimulatorStore()
</script>

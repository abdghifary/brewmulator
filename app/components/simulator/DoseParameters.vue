<template>
  <div class="dose-parameters space-y-4">
    <UFormField :label="`Coffee: ${store.coffeeGrams}g`">
      <USlider
        v-model="store.coffeeGrams"
        :min="store.coffeeMin"
        :max="store.coffeeMax"
        :step="0.5"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>

    <UFormField :label="`Water: ${store.waterGrams}g`">
      <USlider
        v-model="store.waterGrams"
        :min="store.waterMin"
        :max="store.waterMax"
        :step="1"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>

    <div class="space-y-1 text-sm text-gray-500">
      <div>Brew Ratio: 1:{{ store.brewRatio.toFixed(1) }}</div>
      <div>Beverage Weight: {{ store.beverageWeight.toFixed(0) }}g</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const store = useSimulatorStore()
</script>

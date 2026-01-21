<template>
  <div class="dose-parameters space-y-4">
    <UFormField :label="`Coffee: ${store.coffeeGrams}g`">
      <USlider
        v-model="store.coffeeGrams"
        :min="10"
        :max="50"
        :step="0.5"
        @update:model-value="store.debouncedCompute"
      />
    </UFormField>

    <UFormField :label="`Water: ${store.waterGrams}g`">
      <USlider
        v-model="store.waterGrams"
        :min="100"
        :max="1000"
        :step="10"
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

<template>
  <div class="dose-parameters space-y-4">
    <UFormField>
      <template #label>
        <span>Coffee: <span class="font-mono">{{ store.recipe.coffeeGrams }}g</span></span>
      </template>
      <USlider
        v-model="store.recipe.coffeeGrams"
        :min="store.coffeeMin"
        :max="store.coffeeMax"
        :step="0.5"
      />
    </UFormField>

    <UFormField>
      <template #label>
        <span>Water: <span class="font-mono">{{ store.recipe.waterGrams }}g</span></span>
      </template>
      <USlider
        v-model="store.recipe.waterGrams"
        :min="store.waterMin"
        :max="store.waterMax"
        :step="1"
        :disabled="store.hasPourSchedule"
      />
      <p
        v-if="store.hasPourSchedule"
        class="text-xs text-[var(--ui-text-dimmed)] mt-1"
      >
        Water is set by pour schedule
      </p>
    </UFormField>

    <div class="space-y-1 text-sm text-[var(--ui-text-muted)]">
      <div>Brew Ratio: <span class="font-mono tabular-nums">1:{{ store.brewRatio.toFixed(1) }}</span></div>
      <div>Beverage Weight: <span class="font-mono tabular-nums">{{ store.beverageWeight.toFixed(0) }}g</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulatorStore } from '~/stores/simulator'

const store = useSimulatorStore()
</script>

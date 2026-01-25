<template>
  <div class="extraction-results">
    <div class="grid grid-cols-2 gap-4">
      <UCard>
        <div class="text-sm text-gray-500">
          Extraction Yield
        </div>
        <div class="text-2xl font-bold">
          {{ store.extractionYield.toFixed(2) }}%
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-gray-500">
          TDS
        </div>
        <div class="text-2xl font-bold">
          {{ store.tds.toFixed(2) }}%
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-gray-500">
          Beverage Weight
        </div>
        <div class="text-2xl font-bold">
          {{ store.beverageWeight.toFixed(0) }}g
        </div>
      </UCard>

      <UCard>
        <div class="text-sm text-gray-500">
          Zone
        </div>
        <div class="text-2xl font-bold">
          <UBadge
            :color="zoneColor"
            variant="solid"
          >
            {{ zoneName }}
          </UBadge>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'

const store = useSimulatorStore()

const zoneName = computed(() => {
  switch (store.extractionZone) {
    case 0: return 'Under'
    case 1: return 'Sweet Spot'
    case 2: return 'Over'
    default: return 'Unknown'
  }
})

const zoneColor = computed(() => {
  switch (store.extractionZone) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'error'
    default: return 'neutral'
  }
})
</script>

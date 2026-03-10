<template>
  <div class="extraction-chart h-[300px] w-full relative">
    <ClientOnly>
      <VueApexCharts
        :key="isDark ? 'dark' : 'light'"
        type="area"
        height="300"
        :options="chartOptions"
        :series="series"
      />
      <template #fallback>
        <div
          class="h-[300px] w-full bg-[var(--ui-bg-muted)]/50 rounded-lg border border-[var(--ui-border)] animate-pulse"
        />
      </template>
    </ClientOnly>
    <!-- Empty state hint: V60 selected but no pour schedule configured yet -->
    <div
      v-if="store.recipe.method === 'v60' && !store.hasPourSchedule"
      class="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none"
    >
      <div
        class="bg-stone-900/80 dark:bg-stone-800/90 text-stone-100 text-sm px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm"
      >
        <span>☕</span>
        <span>Select a template or add a pour step to see the multi-pour
          curve</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

const store = useSimulatorStore()
const { chartOptions, series, isDark } = useExtractionChart()
</script>

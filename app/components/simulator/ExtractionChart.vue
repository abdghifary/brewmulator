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
        <div class="h-[300px] w-full bg-[var(--ui-bg-muted)]/50 rounded-lg border border-[var(--ui-border)] animate-pulse" />
      </template>
    </ClientOnly>
    <!-- Empty state hint: V60 selected but no pour schedule configured yet -->
    <div
      v-if="store.recipe.method === 'v60' && !store.hasPourSchedule"
      class="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none"
    >
      <div class="bg-stone-900/80 dark:bg-stone-800/90 text-stone-100 text-sm px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
        <span>☕</span>
        <span>Select a template or add a pour step to see the multi-pour curve</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { presetDefaults } from '~/stores/simulator/constants'
import { formatTimeCompact } from '~/stores/simulator/utils'
import { getMethodConfig } from '~/stores/simulator/methodConfig'

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

const store = useSimulatorStore()
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')
const maxTime = computed(() =>
  store.hasPourSchedule ? store.recipe.brewTime : presetDefaults[store.recipe.method].maxTime
)

// Espresso Lab palette — all chart colors centralized here
const chartColors = computed(() => ({
  line: isDark.value ? '#F59E0B' : '#D97706', // amber-500 / amber-600
  sweetSpotFill: isDark.value ? '#10B981' : '#059669', // emerald-500 / emerald-600
  sweetSpotLabel: isDark.value ? '#10B981' : '#059669', // emerald-500 / emerald-600
  pourLine: isDark.value ? '#78716C' : '#A8A29E', // stone-500 / stone-400
  pourLabel: isDark.value ? '#A8A29E' : '#78716C', // stone-400 / stone-500
  foreColor: isDark.value ? '#A8A29E' : '#78716C', // stone-400 / stone-500
  gridBorder: isDark.value ? '#292524' : '#E7E5E4', // stone-800 / stone-200
  brewTimeLine: isDark.value ? '#F59E0B' : '#D97706' // amber (matches line)
}))

const series = computed(() => [{
  name: 'Extraction Yield',
  data: store.extractionCurve.map(p => ({ x: p.time, y: p.yield }))
}])

const pourAnnotations = computed(() => {
  if (!store.hasPourSchedule) return []
  return store.pourSchedule.map((step, i) => ({
    x: step.startTime,
    borderColor: chartColors.value.pourLine,
    strokeDashArray: 4,
    opacity: 0.6,
    label: {
      text: step.label || `Pour ${i + 1}`,
      orientation: 'vertical',
      offsetY: 30,
      borderWidth: 0,
      style: {
        color: chartColors.value.pourLabel,
        background: 'transparent',
        fontSize: '10px',
        fontWeight: 400,
        padding: { left: 2, right: 2, top: 2, bottom: 2 }
      }
    }
  }))
})

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    height: 300,
    background: 'transparent',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 400,
      dynamicAnimation: {
        enabled: true,
        speed: 200
      }
    },
    foreColor: chartColors.value.foreColor,
    zoom: { enabled: false }
  },
  theme: {
    mode: isDark.value ? 'dark' as const : 'light' as const
  },
  colors: [chartColors.value.line],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.25,
      opacityTo: 0.03,
      stops: [0, 100]
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2.5
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    type: 'numeric',
    min: 0,
    max: maxTime.value,
    tickAmount: 5,
    labels: {
      formatter: (val: number) => formatTimeCompact(val, store.recipe.method),
      style: {
        fontFamily: 'JetBrains Mono, monospace'
      }
    },
    axisBorder: { show: false },
    axisTicks: { show: true }
  },
  yaxis: {
    min: 0,
    max: 30,
    tickAmount: 6,
    labels: {
      formatter: (val: number) => val + '%',
      style: {
        fontFamily: 'JetBrains Mono, monospace'
      }
    }
  },
  annotations: {
    yaxis: [{
      y: getMethodConfig(store.recipe.method).sweetSpot.min,
      y2: getMethodConfig(store.recipe.method).sweetSpot.max,
      fillColor: chartColors.value.sweetSpotFill,
      opacity: 0.1,
      borderColor: 'transparent',
      label: {
        text: 'Target Zone',
        position: 'right',
        offsetX: -8,
        style: {
          color: chartColors.value.sweetSpotLabel,
          background: 'transparent',
          fontSize: '11px',
          fontWeight: 500,
          padding: { left: 4, right: 4, top: 2, bottom: 2 }
        }
      }
    }],
    xaxis: [
      {
        x: store.recipe.brewTime,
        borderColor: chartColors.value.brewTimeLine,
        strokeDashArray: 0,
        opacity: 0.8,
        label: {
          text: '',
          style: {
            background: 'transparent'
          }
        }
      },
      ...pourAnnotations.value
    ]
  },
  grid: {
    borderColor: chartColors.value.gridBorder,
    strokeDashArray: 4,
    padding: { left: 10, right: 10 }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    x: {
      formatter: (val: number) => formatTimeCompact(val, store.recipe.method)
    },
    y: {
      formatter: (val: number) => val.toFixed(1) + '%'
    }
  },
  markers: {
    size: 0,
    hover: {
      size: 5,
      sizeOffset: 3
    }
  }
}))
</script>

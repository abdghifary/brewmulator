<template>
  <div class="extraction-chart h-[300px] w-full relative">
    <ClientOnly>
      <apexchart
        type="area"
        height="300"
        :options="chartOptions"
        :series="series"
      />
      <template #fallback>
        <div class="h-[300px] w-full bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse" />
      </template>
    </ClientOnly>
    <!-- Empty state hint: V60 selected but no pour schedule configured yet -->
    <div
      v-if="store.recipe.method === 'v60' && !store.hasPourSchedule"
      class="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none"
    >
      <div class="bg-gray-900/80 dark:bg-gray-800/90 text-gray-100 text-sm px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
        <span>☕</span>
        <span>Select a template or add a pour step to see the multi-pour curve</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { presetDefaults } from '~/stores/simulator/constants'

const store = useSimulatorStore()
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')
const maxTime = computed(() => presetDefaults[store.recipe.method].maxTime)

const series = computed(() => [{
  name: 'Extraction Yield',
  data: store.extractionCurve.map(p => ({ x: p.time, y: p.yield }))
}])

function formatTime(seconds: number): string {
  if (store.recipe.method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (store.recipe.method === 'espresso') {
    return `${Math.round(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  return `${mins}m`
}

const pourAnnotations = computed(() => {
  if (!store.hasPourSchedule) return []
  return store.pourSchedule.map((step, i) => ({
    x: step.startTime,
    borderColor: '#3b82f6',
    strokeDashArray: 4,
    opacity: 0.6,
    label: {
      text: step.label || `Pour ${i + 1}`,
      orientation: 'vertical',
      style: {
        color: '#3b82f6',
        background: 'transparent',
        fontSize: '10px'
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
      speed: 300,
      dynamicAnimation: {
        enabled: true,
        speed: 150
      }
    },
    foreColor: isDark.value ? '#94a3b8' : '#64748b',
    zoom: { enabled: false }
  },
  theme: {
    mode: isDark.value ? 'dark' as const : 'light' as const
  },
  colors: ['#22c55e'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.3,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2
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
      formatter: (val: number) => formatTime(val),
      style: {
        fontFamily: 'ui-monospace, monospace'
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
        fontFamily: 'ui-monospace, monospace'
      }
    }
  },
  annotations: {
    yaxis: [{
      y: 18,
      y2: 22,
      fillColor: '#22c55e',
      opacity: 0.1,
      borderColor: 'transparent',
      label: {
        text: 'Target Zone',
        position: 'front',
        offsetX: 8,
        style: {
          color: '#16a34a',
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
        borderColor: '#22c55e',
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
    borderColor: isDark.value ? '#1e293b' : '#e2e8f0',
    strokeDashArray: 4,
    padding: { left: 10, right: 10 }
  },
  tooltip: {
    theme: isDark.value ? 'dark' : 'light',
    x: {
      formatter: (val: number) => formatTime(val)
    },
    y: {
      formatter: (val: number) => val.toFixed(1) + '%'
    }
  },
  markers: {
    size: 0
  }
}))
</script>

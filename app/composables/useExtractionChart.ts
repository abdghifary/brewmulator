import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { presetDefaults } from '~/stores/simulator/constants'
import { formatTimeCompact } from '~/stores/simulator/utils'
import { getMethodConfig } from '~/stores/simulator/methodConfig'
import { useColorMode } from '@vueuse/core'

// Evaluated once at module load — never reactive, never re-created.
// The computed in useExtractionChart() spreads this and overrides only dynamic leaves.
const BASE_CHART_OPTIONS = {
  chart: {
    type: 'area' as const,
    height: 300,
    background: 'transparent',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout' as const,
      speed: 400,
      dynamicAnimation: { enabled: true, speed: 200 }
    },
    zoom: { enabled: false }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.25,
      opacityTo: 0.03,
      stops: [0, 100] as number[]
    }
  },
  stroke: {
    curve: 'smooth' as const,
    width: 2.5
  },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'numeric' as const,
    min: 0,
    tickAmount: 5,
    axisBorder: { show: false },
    axisTicks: { show: true },
    labels: {
      style: { fontFamily: 'JetBrains Mono, monospace' }
    }
  },
  yaxis: {
    min: 0,
    max: 30,
    tickAmount: 6,
    labels: {
      formatter: (val: number) => val + '%',
      style: { fontFamily: 'JetBrains Mono, monospace' }
    }
  },
  markers: {
    size: 0,
    hover: { size: 5, sizeOffset: 3 }
  },
  grid: {
    strokeDashArray: 4,
    padding: { left: 10, right: 10 }
  }
} as const


export function useExtractionChart() {
  const store = useSimulatorStore()
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.value === 'dark')

  const maxTime = computed(() =>
    store.hasPourSchedule
      ? store.recipe.brewTime
      : presetDefaults[store.recipe.method].maxTime
  )

  const chartColors = computed(() => ({
    line: isDark.value ? '#F59E0B' : '#D97706',
    sweetSpotFill: isDark.value ? '#10B981' : '#059669',
    sweetSpotLabel: isDark.value ? '#10B981' : '#059669',
    pourLine: isDark.value ? '#78716C' : '#A8A29E',
    pourLabel: isDark.value ? '#A8A29E' : '#78716C',
    foreColor: isDark.value ? '#A8A29E' : '#78716C',
    gridBorder: isDark.value ? '#292524' : '#E7E5E4',
    brewTimeLine: isDark.value ? '#F59E0B' : '#D97706'
  }))

  const series = computed(() => [
    {
      name: 'Extraction Yield',
      data: store.extractionCurve.map(p => ({ x: p.time, y: p.yield }))
    }
  ])

  const pourAnnotations = computed(() => {
    if (!store.hasPourSchedule) return []
    return store.pourSchedule.map((step, i) => ({
      x: step.startTime,
      borderColor: chartColors.value.pourLine,
      strokeDashArray: 4,
      opacity: 0.6,
      label: {
        text: step.label || `Pour ${i + 1}`,
        orientation: 'vertical' as const,
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
    ...BASE_CHART_OPTIONS,
    chart: {
      ...BASE_CHART_OPTIONS.chart,
      foreColor: chartColors.value.foreColor
    },
    theme: {
      mode: isDark.value ? ('dark' as const) : ('light' as const)
    },
    colors: [chartColors.value.line],
    xaxis: {
      ...BASE_CHART_OPTIONS.xaxis,
      max: maxTime.value,
      labels: {
        ...BASE_CHART_OPTIONS.xaxis.labels,
        formatter: (val: number) => formatTimeCompact(val, store.recipe.method)
      }
    },
    annotations: {
      yaxis: [
        {
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
        }
      ],
      xaxis: [
        {
          x: store.recipe.brewTime,
          borderColor: chartColors.value.brewTimeLine,
          strokeDashArray: 0,
          opacity: 0.8,
          label: {
            text: '',
            style: { background: 'transparent' }
          }
        },
        ...pourAnnotations.value
      ]
    },
    grid: {
      ...BASE_CHART_OPTIONS.grid,
      borderColor: chartColors.value.gridBorder
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
      x: {
        formatter: (val: number) => formatTimeCompact(val, store.recipe.method)
      },
      y: {
        formatter: (val: number) => val.toFixed(1) + '%'
      }
    }
  }))

  return { chartOptions, series }
}

<template>
  <div class="extraction-chart relative h-[300px] w-full bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <!-- Green Target Zone (18-22%) -->
    <div
      class="absolute bg-green-500/10 pointer-events-none z-10 border-y border-green-500/20"
      :style="{
        top: `${yScale(22)}%`,
        bottom: `${100 - yScale(18)}%`,
        left: 0,
        right: 0
      }"
    >
      <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium hidden sm:block">
        Target Zone
      </div>
    </div>

    <!-- Current Time Marker -->
    <div
      class="absolute w-0.5 bg-primary-500 pointer-events-none z-20 transition-all duration-75"
      :style="{
        left: `${(store.brewTime / maxTime) * 100}%`,
        top: 0,
        bottom: 0
      }"
    />

    <!-- SVG Area Chart -->
    <svg
      class="w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="curveGradient"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="var(--color-primary-500)"
            stop-opacity="0.3"
          />
          <stop
            offset="100%"
            stop-color="var(--color-primary-500)"
            stop-opacity="0.05"
          />
        </linearGradient>
      </defs>

      <!-- Grid lines (optional, adds context) -->
      <line
        x1="0"
        y1="0"
        x2="100"
        y2="0"
        stroke="currentColor"
        stroke-opacity="0.05"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="25"
        x2="100"
        y2="25"
        stroke="currentColor"
        stroke-opacity="0.05"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="50"
        x2="100"
        y2="50"
        stroke="currentColor"
        stroke-opacity="0.05"
        vector-effect="non-scaling-stroke"
      />
      <line
        x1="0"
        y1="75"
        x2="100"
        y2="75"
        stroke="currentColor"
        stroke-opacity="0.05"
        vector-effect="non-scaling-stroke"
      />

      <path
        v-if="pathD"
        :d="pathD"
        fill="url(#curveGradient)"
        stroke="var(--color-primary-500)"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>

    <!-- X-Axis Labels -->
    <div class="absolute bottom-1 left-2 text-xs text-gray-400 font-mono pointer-events-none">
      0
    </div>
    <div class="absolute bottom-1 right-2 text-xs text-gray-400 font-mono pointer-events-none">
      {{ formatTime(maxTime) }}
    </div>

    <!-- Y-Axis Label (Max Yield) -->
    <div class="absolute top-1 left-2 text-xs text-gray-400 font-mono pointer-events-none">
      30%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { presetDefaults } from '~/stores/simulator'

const store = useSimulatorStore()

const maxTime = computed(() => presetDefaults[store.method].maxTime)

function yScale(yieldValue: number): number {
  const min = 0
  const max = 30
  return ((max - yieldValue) / (max - min)) * 100
}

function formatTime(seconds: number): string {
  if (store.method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (store.method === 'espresso') {
    return `${Math.round(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  return `${mins}m`
}

const pathD = computed(() => {
  if (!store.extractionCurve.length || maxTime.value <= 0) return ''

  // Build the points string
  const points = store.extractionCurve.map((p) => {
    // Clamp values to ensure they stay within bounds
    const x = Math.max(0, Math.min(100, (p.time / maxTime.value) * 100))
    const y = Math.max(0, Math.min(100, yScale(p.yield)))
    return `${x},${y}`
  })

  const lastPoint = points[points.length - 1]
  if (!lastPoint) return ''

  const [lastX] = lastPoint.split(',')

  // Construct the area path:
  // 1. Move to start bottom (0,100)
  // 2. Line to first point (0,0 typically) and all subsequent points
  // 3. Line to current X projection on bottom axis (lastX, 100)
  // 4. Close path (Z) implies line back to start

  return `M 0,100 L ${points.join(' L ')} L ${lastX},100 Z`
})
</script>

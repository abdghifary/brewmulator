<template>
  <!-- Desktop: inline flow · Mobile: fixed floating dock at bottom -->
  <div
    class="flex justify-center py-2 lg:relative lg:z-auto fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)] lg:pb-0 pointer-events-none"
  >
    <div
      ref="dockRef"
      class="flex items-end gap-4 px-4 py-2 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-[var(--ui-border)] shadow-xl pointer-events-auto mb-3 lg:mb-0"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <LazySimulatorDockItem
        v-for="(preset, index) in METHOD_PRESET_OPTIONS"
        :key="preset.id"
        hydrate-on-visible
        :label="preset.label"
        :icon="preset.icon"
        :scale="getScale(index)"
        :active="store.recipe.method === preset.id"
        :label-style="labelStyle(index)"
        @select="store.setPreset(preset.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulatorStore } from '~/stores/simulator'
import { METHOD_PRESET_OPTIONS } from '~/stores/simulator/constants'

const store = useSimulatorStore()
const dockRef = ref<HTMLElement | null>(null)
const { getScale, onMouseMove, onMouseLeave, labelStyle }
  = useDockMagnification(dockRef)
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'

defineProps<{
  label: string
  icon: string
  scale: number
  active: boolean
  labelStyle?: Record<string, string>
}>()

defineEmits<{
  select: []
}>()

const isMounted = useMounted()
</script>

<template>
  <div
    class="relative flex flex-col items-center group"
    :style="{
      transform: `scale(${isMounted ? scale : 1})`,
      transformOrigin: 'bottom center',
      transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: Math.round((isMounted ? scale : 1) * 10)
    }"
  >
    <button
      class="flex items-center justify-center rounded-full cursor-pointer size-[40px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="
        active
          ? 'bg-primary text-white shadow-md'
          : 'bg-stone-100 dark:bg-stone-800 text-[var(--ui-text-muted)]'
      "
      :aria-label="label"
      :aria-pressed="active"
      @click="$emit('select')"
    >
      <UIcon
        :name="icon"
        class="size-6"
      />
    </button>

    <span
      class="absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap text-[var(--ui-text)] bg-white/90 dark:bg-stone-800/90 px-2 py-0.5 rounded-md shadow pointer-events-none transition-opacity duration-150 opacity-0"
      :class="{
        'opacity-100': active,
        'md:group-hover:opacity-100': true
      }"
      :style="labelStyle"
    >
      {{ label }}
    </span>
  </div>
</template>

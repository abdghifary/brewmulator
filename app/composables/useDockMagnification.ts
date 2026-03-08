import type { Ref } from 'vue'
import { useMediaQuery, useMounted } from '@vueuse/core'

interface DockConfig {
  /** px - base item diameter */
  itemSize?: number
  /** px - gap between items (Tailwind gap-4 = 16) */
  gap?: number
  /** px - container inline padding (Tailwind px-4 = 16) */
  padding?: number
  /** maximum magnification factor */
  maxScale?: number
  /** px - mouse influence radius */
  spread?: number
}

const DEFAULTS = {
  itemSize: 40,
  gap: 16,
  padding: 16,
  maxScale: 1.5,
  spread: 120
} as const satisfies Required<DockConfig>

const LABEL_BASE_TOP = 40 // px - md:top-10 equivalent (2.5 rem)
const LABEL_BASE_BOTTOM = 56 // px - label above button on mobile (40px button + 16px gap)
const LABEL_SCALE_MULTIPLIER = 50 // px extra per unit of scale above 1

export function useDockMagnification(
  dockRef: Readonly<Ref<HTMLElement | null>>,
  config: DockConfig = {}
) {
  const { itemSize, gap, padding, maxScale, spread } = { ...DEFAULTS, ...config }

  const mouseX = ref<number | null>(null)

  // Use mounted state to ensure SSR consistency - media queries return different values on server vs client
  const isMounted = useMounted()
  const canHover = useMediaQuery('(hover: hover)')
  const isMd = useMediaQuery('(min-width: 768px)')

  function itemCenterX(index: number): number {
    return padding + index * (itemSize + gap) + itemSize / 2
  }

  function getScale(index: number): number {
    // Return safe default during SSR to prevent hydration mismatch
    if (!isMounted.value || !canHover.value || mouseX.value === null) return 1
    const dist = Math.abs(mouseX.value - itemCenterX(index))
    if (dist >= spread) return 1
    const t = 1 - dist / spread
    return 1 + (maxScale - 1) * t * t
  }

  function onMouseMove(e: MouseEvent) {
    const rect = dockRef.value?.getBoundingClientRect()
    if (rect) mouseX.value = e.clientX - rect.left
  }

  function onMouseLeave() {
    mouseX.value = null
  }

  function labelStyle(index: number): Record<string, string> | undefined {
    if (!isMounted.value) return undefined
    const scale = getScale(index)

    if (isMd.value) {
      const top = LABEL_BASE_TOP + (scale - 1) * LABEL_SCALE_MULTIPLIER
      return { top: `${top}px` }
    } else {
      const bottom = LABEL_BASE_BOTTOM + (scale - 1) * LABEL_SCALE_MULTIPLIER
      return { bottom: `${bottom}px` }
    }
  }

  return {
    getScale,
    onMouseMove,
    onMouseLeave,
    labelStyle
  }
}

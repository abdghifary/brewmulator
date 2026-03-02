import type { BrewMethod } from './types'

/**
 * Compact time format for chart axis labels.
 * coldBrew → "3h", espresso → "25s", others → "3m"
 */
export function formatTimeCompact(seconds: number, method: BrewMethod): string {
  if (method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (method === 'espresso') {
    return `${Math.round(seconds)}s`
  }
  const mins = Math.floor(seconds / 60)
  return `${mins}m`
}

/**
 * Full time format for form labels and display.
 * coldBrew → "3h", espresso → "25s", others → "3:00"
 */
export function formatTimeFull(seconds: number, method: BrewMethod): string {
  if (method === 'coldBrew') {
    const hours = Math.floor(seconds / 3600)
    return `${hours}h`
  }
  if (method === 'espresso') {
    return `${seconds}s`
  }
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

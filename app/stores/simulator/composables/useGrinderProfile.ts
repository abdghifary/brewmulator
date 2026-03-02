import { ref, computed } from 'vue'
import { grinderProfiles, RAW_MICRONS_ID, type GrinderProfile } from '../grinders'

export function useGrinderProfile() {
  const selectedGrinderId = ref(RAW_MICRONS_ID)

  const selectedGrinder = computed<GrinderProfile>(() => {
    return grinderProfiles.find(g => g.id === selectedGrinderId.value)
      ?? grinderProfiles[0]! // fallback to Raw μm
  })

  const isRawMode = computed(() => selectedGrinderId.value === RAW_MICRONS_ID)

  /** Convert microns to the selected grinder's click value */
  function clicksForMicrons(microns: number): number {
    const profile = selectedGrinder.value
    if (profile.micronsPerClick === 0) return 0
    return Math.round((microns / profile.micronsPerClick) / profile.clickStep) * profile.clickStep
  }

  /** Convert the selected grinder's click value to microns */
  function micronsForClicks(clicks: number): number {
    return Math.round(clicks * selectedGrinder.value.micronsPerClick)
  }

  return {
    selectedGrinderId,
    selectedGrinder,
    isRawMode,
    clicksForMicrons,
    micronsForClicks,
    grinderProfiles // expose for dropdown options
  }
}

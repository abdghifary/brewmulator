import { describe, it, expect } from 'vitest'
import { grinderProfiles, RAW_MICRONS_ID } from '../../app/stores/simulator/grinders'

describe('Grinder Profiles', () => {
  it('contains at least 9 profiles (8 grinders + Raw μm)', () => {
    expect(grinderProfiles.length).toBeGreaterThanOrEqual(9)
  })

  it('has Raw μm as first profile with micronsPerClick=1', () => {
    const raw = grinderProfiles.find(g => g.id === RAW_MICRONS_ID)
    expect(raw).toBeDefined()
    expect(raw!.micronsPerClick).toBe(1)
  })

  it('all profiles have positive micronsPerClick', () => {
    for (const profile of grinderProfiles) {
      expect(profile.micronsPerClick).toBeGreaterThan(0)
    }
  })

  it('all profiles have minClick < maxClick', () => {
    for (const profile of grinderProfiles) {
      expect(profile.minClick).toBeLessThan(profile.maxClick)
    }
  })

  it('all profiles have unique ids', () => {
    const ids = grinderProfiles.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('Niche Zero has 0.5 clickStep', () => {
    const niche = grinderProfiles.find(g => g.id === 'niche-zero')
    expect(niche).toBeDefined()
    expect(niche!.clickStep).toBe(0.5)
  })

  it('Comandante C40 standard has 30 μm/click', () => {
    const c40 = grinderProfiles.find(g => g.id === 'comandante-c40')
    expect(c40).toBeDefined()
    expect(c40!.micronsPerClick).toBe(30)
  })

  it('Comandante C40 Red Clix has 15 μm/click (half of standard)', () => {
    const redClix = grinderProfiles.find(g => g.id === 'comandante-c40-red-clix')
    expect(redClix).toBeDefined()
    expect(redClix!.micronsPerClick).toBe(15)
  })
})

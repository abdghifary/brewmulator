export interface GrinderProfile {
  id: string
  name: string
  type: 'hand' | 'electric' | 'raw'
  micronsPerClick: number
  minClick: number
  maxClick: number
  clickStep: number // 1 for most grinders, 0.5 for stepless like Niche Zero
  clickLabel: string // 'clicks' | 'setting' | 'μm'
  defaultFinesFraction: number // typical fines (<100μm) mass fraction for this grinder (Gagné 2023)
}

export const RAW_MICRONS_ID = 'raw-microns'

export const grinderProfiles: GrinderProfile[] = [
  {
    id: 'raw-microns',
    name: 'Raw μm',
    type: 'raw',
    micronsPerClick: 1,
    minClick: 50,
    maxClick: 1500,
    clickStep: 1,
    clickLabel: 'μm',
    defaultFinesFraction: 0.15
  },
  {
    id: 'comandante-c40',
    name: 'Comandante C40 (Standard)',
    type: 'hand',
    micronsPerClick: 30,
    minClick: 1,
    maxClick: 50,
    clickStep: 1,
    clickLabel: 'clicks',
    defaultFinesFraction: 0.11
  },
  {
    id: 'comandante-c40-red-clix',
    name: 'Comandante C40 (Red Clix)',
    type: 'hand',
    micronsPerClick: 15,
    minClick: 1,
    maxClick: 100,
    clickStep: 1,
    clickLabel: 'clicks',
    defaultFinesFraction: 0.11
  },
  {
    id: 'timemore-c2',
    name: 'Timemore Chestnut C2',
    type: 'hand',
    micronsPerClick: 25,
    minClick: 1,
    maxClick: 36,
    clickStep: 1,
    clickLabel: 'clicks',
    defaultFinesFraction: 0.20
  },
  {
    id: '1zpresso-jx-pro',
    name: '1Zpresso JX-Pro',
    type: 'hand',
    micronsPerClick: 12.5,
    minClick: 1,
    maxClick: 120,
    clickStep: 1,
    clickLabel: 'clicks',
    defaultFinesFraction: 0.19
  },
  {
    id: '1zpresso-k-ultra',
    name: '1Zpresso K-Ultra',
    type: 'hand',
    micronsPerClick: 22,
    minClick: 1,
    maxClick: 90,
    clickStep: 1,
    clickLabel: 'clicks',
    defaultFinesFraction: 0.13
  },
  {
    id: 'baratza-encore',
    name: 'Baratza Encore',
    type: 'electric',
    micronsPerClick: 35,
    minClick: 1,
    maxClick: 40,
    clickStep: 1,
    clickLabel: 'setting',
    defaultFinesFraction: 0.19
  },
  {
    id: 'niche-zero',
    name: 'Niche Zero',
    type: 'electric',
    micronsPerClick: 15,
    minClick: 0,
    maxClick: 50,
    clickStep: 0.5,
    clickLabel: 'setting',
    defaultFinesFraction: 0.17
  },
  {
    id: 'fellow-ode-gen2',
    name: 'Fellow Ode (Gen 2)',
    type: 'electric',
    micronsPerClick: 30,
    minClick: 1,
    maxClick: 31,
    clickStep: 1,
    clickLabel: 'setting',
    defaultFinesFraction: 0.11
  }
]

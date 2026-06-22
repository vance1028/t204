import type { Category, Period, PriceMatrix, WeightConfig, IndexConfig } from '@/core/types'
import { initDefaultWeights } from '@/core/weight'

const TABLEAU_COLORS = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ac',
]

export const defaultCategories: Category[] = [
  { id: 'steel_rebar', name: '螺纹钢', unit: '元/吨', color: TABLEAU_COLORS[0] },
  { id: 'steel_hotroll', name: '热轧卷板', unit: '元/吨', color: TABLEAU_COLORS[1] },
  { id: 'cu', name: '电解铜', unit: '元/吨', color: TABLEAU_COLORS[2] },
  { id: 'al', name: '电解铝', unit: '元/吨', color: TABLEAU_COLORS[3] },
  { id: 'coal_thermal', name: '动力煤', unit: '元/吨', color: TABLEAU_COLORS[4] },
  { id: 'coal_coking', name: '焦煤', unit: '元/吨', color: TABLEAU_COLORS[5] },
  { id: 'chem_ppa', name: 'PTA', unit: '元/吨', color: TABLEAU_COLORS[6] },
  { id: 'chem_methanol', name: '甲醇', unit: '元/吨', color: TABLEAU_COLORS[7] },
]

export function generatePeriods(year: number, count: number): Period[] {
  const out: Period[] = []
  let month = 1
  let xun = 1
  for (let i = 0; i < count; i++) {
    const xunLabel = xun === 1 ? '上旬' : xun === 2 ? '中旬' : '下旬'
    out.push({
      id: `p_${year}_${String(month).padStart(2, '0')}_${xun}`,
      label: `${year}年${month}月${xunLabel}`,
    })
    xun++
    if (xun > 3) {
      xun = 1
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }
  }
  return out
}

export const defaultPeriods: Period[] = generatePeriods(2024, 12)

export const defaultPriceMatrix: PriceMatrix = {
  steel_rebar: {
    p_2024_01_1: 3820,
    p_2024_01_2: 3780,
    p_2024_01_3: 3750,
    p_2024_02_1: 3690,
    p_2024_02_2: 3710,
    p_2024_02_3: 3780,
    p_2024_03_1: 3850,
    p_2024_03_2: 3920,
    p_2024_03_3: 3980,
    p_2024_04_1: 4020,
    p_2024_04_2: 3970,
    p_2024_04_3: 3910,
  },
  steel_hotroll: {
    p_2024_01_1: 4120,
    p_2024_01_2: 4080,
    p_2024_01_3: 4050,
    p_2024_02_1: 3990,
    p_2024_02_2: 4020,
    p_2024_02_3: 4100,
    p_2024_03_1: 4180,
    p_2024_03_2: 4260,
    p_2024_03_3: 4330,
    p_2024_04_1: 4380,
    p_2024_04_2: 4310,
    p_2024_04_3: 4240,
  },
  cu: {
    p_2024_01_1: 68500,
    p_2024_01_2: 69100,
    p_2024_01_3: 69800,
    p_2024_02_1: 70500,
    p_2024_02_2: 71200,
    p_2024_02_3: 72100,
    p_2024_03_1: 72800,
    p_2024_03_2: 73500,
    p_2024_03_3: 74200,
    p_2024_04_1: 74800,
    p_2024_04_2: 74100,
    p_2024_04_3: 73300,
  },
  al: {
    p_2024_01_1: 18800,
    p_2024_01_2: 18950,
    p_2024_01_3: 19100,
    p_2024_02_1: 19250,
    p_2024_02_2: 19400,
    p_2024_02_3: 19550,
    p_2024_03_1: 19700,
    p_2024_03_2: 19850,
    p_2024_03_3: null,
    p_2024_04_1: 20100,
    p_2024_04_2: 20000,
    p_2024_04_3: 19850,
  },
  coal_thermal: {
    p_2024_01_1: 820,
    p_2024_01_2: 815,
    p_2024_01_3: 810,
    p_2024_02_1: 805,
    p_2024_02_2: 800,
    p_2024_02_3: 795,
    p_2024_03_1: 790,
    p_2024_03_2: 785,
    p_2024_03_3: 780,
    p_2024_04_1: 775,
    p_2024_04_2: 770,
    p_2024_04_3: 765,
  },
  coal_coking: {
    p_2024_01_1: 1950,
    p_2024_01_2: 1920,
    p_2024_01_3: 1890,
    p_2024_02_1: 1860,
    p_2024_02_2: 1880,
    p_2024_02_3: 1910,
    p_2024_03_1: 1940,
    p_2024_03_2: 1970,
    p_2024_03_3: 2000,
    p_2024_04_1: 2030,
    p_2024_04_2: 2000,
    p_2024_04_3: 1970,
  },
  chem_ppa: {
    p_2024_01_1: 5850,
    p_2024_01_2: 5900,
    p_2024_01_3: 5950,
    p_2024_02_1: 6000,
    p_2024_02_2: 6050,
    p_2024_02_3: 6100,
    p_2024_03_1: 6150,
    p_2024_03_2: 6200,
    p_2024_03_3: 6250,
    p_2024_04_1: 6300,
    p_2024_04_2: 6250,
    p_2024_04_3: 6200,
  },
  chem_methanol: {
    p_2024_01_1: 2450,
    p_2024_01_2: 2480,
    p_2024_01_3: 2510,
    p_2024_02_1: 2540,
    p_2024_02_2: 2560,
    p_2024_02_3: 2590,
    p_2024_03_1: 2620,
    p_2024_03_2: 2650,
    p_2024_03_3: 2680,
    p_2024_04_1: 2710,
    p_2024_04_2: 2680,
    p_2024_04_3: 2650,
  },
}

export function defaultWeightConfig(): WeightConfig {
  const cfg = initDefaultWeights(defaultCategories)
  cfg.manualWeights = {
    steel_rebar: 18,
    steel_hotroll: 15,
    cu: 20,
    al: 12,
    coal_thermal: 10,
    coal_coking: 8,
    chem_ppa: 9,
    chem_methanol: 8,
  }
  cfg.turnoverShares = {
    steel_rebar: 360,
    steel_hotroll: 300,
    cu: 400,
    al: 240,
    coal_thermal: 200,
    coal_coking: 160,
    chem_ppa: 180,
    chem_methanol: 160,
  }
  return cfg
}

export const defaultIndexConfig: IndexConfig = {
  basePeriodId: 'p_2024_01_1',
  formula: 'laspeyres',
  indexType: 'fixed_base',
}

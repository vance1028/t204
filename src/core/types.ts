export interface Period {
  id: string
  label: string
}

export interface Category {
  id: string
  name: string
  unit: string
  color: string
}

export type PriceCell = number | null

export type PriceMatrix = Record<string, Record<string, PriceCell>>

export type WeightMode = 'manual' | 'turnover'

export interface WeightConfig {
  mode: WeightMode
  manualWeights: Record<string, number>
  turnoverShares: Record<string, number>
}

export type Formula = 'laspeyres' | 'paasche'

export type IndexType = 'fixed_base' | 'chain' | 'mom'

export interface IndexConfig {
  basePeriodId: string
  formula: Formula
  indexType: IndexType
}

export interface IndexResult {
  fixedBase: Record<string, number>
  mom: Record<string, number>
  chained: Record<string, number>
  contributions: Record<string, Record<string, number>>
}

export interface ProcessLogEntry {
  type: 'interpolated' | 'dropped' | 'anomaly' | 'info'
  periodId: string
  categoryId: string
  message: string
}

export interface ProcessedData {
  prices: PriceMatrix
  logs: ProcessLogEntry[]
  anomalies: Record<string, Record<string, boolean>>
  availableCategories: string[]
}

export interface VerifyReport {
  weightSumOk: boolean
  weightSum: number
  chainVsFixedDiff: Record<string, number>
  chainVsFixedMaxDiff: number
  contributionSumOk: Record<string, boolean>
  contributionSumDiff: Record<string, number>
}

export interface AppDataBundle {
  periods: Period[]
  categories: Category[]
  priceMatrix: PriceMatrix
  weightConfig: WeightConfig
  indexConfig: IndexConfig
  selectedPeriodId: string | null
  version: number
}

import type { Category, PriceMatrix, WeightConfig, WeightMode } from './types'

export function normalizeWeights(
  rawWeights: Record<string, number>,
  availableCategoryIds: string[],
): Record<string, number> {
  const filtered: Record<string, number> = {}
  let sum = 0
  for (const id of availableCategoryIds) {
    const v = rawWeights[id]
    const val = typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0
    filtered[id] = val
    sum += val
  }
  if (sum <= 0) {
    const n = availableCategoryIds.length
    if (n === 0) return {}
    const eq = 1 / n
    const out: Record<string, number> = {}
    for (const id of availableCategoryIds) out[id] = eq
    return out
  }
  const out: Record<string, number> = {}
  for (const id of availableCategoryIds) {
    out[id] = filtered[id] / sum
  }
  return out
}

export function computeWeights(
  config: WeightConfig,
  availableCategoryIds: string[],
  periodId?: string,
  priceMatrix?: PriceMatrix,
): Record<string, number> {
  if (config.mode === 'turnover') {
    return normalizeWeights(config.turnoverShares, availableCategoryIds)
  }
  return normalizeWeights(config.manualWeights, availableCategoryIds)
}

export function getReportPeriodWeights(
  config: WeightConfig,
  availableCategoryIds: string[],
  basePeriodId: string,
  reportPeriodId: string,
  priceMatrix: PriceMatrix,
  formula: 'laspeyres' | 'paasche',
): Record<string, number> {
  if (formula === 'laspeyres') {
    return computeWeights(config, availableCategoryIds)
  }
  const base = computeWeights(config, availableCategoryIds)
  const result: Record<string, number> = {}
  for (const id of availableCategoryIds) {
    const p0 = priceMatrix[id]?.[basePeriodId]
    const pt = priceMatrix[id]?.[reportPeriodId]
    if (typeof p0 === 'number' && typeof pt === 'number' && p0 > 0) {
      result[id] = base[id] * (pt / p0)
    } else {
      result[id] = base[id]
    }
  }
  return normalizeWeights(result, availableCategoryIds)
}

export function initDefaultWeights(categories: Category[]): WeightConfig {
  const manual: Record<string, number> = {}
  const turnover: Record<string, number> = {}
  for (const c of categories) {
    manual[c.id] = 1
    turnover[c.id] = 1
  }
  return { mode: 'manual', manualWeights: manual, turnoverShares: turnover }
}

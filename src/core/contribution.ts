import type { Category, Period, PriceMatrix, IndexResult, WeightConfig, Formula } from './types'
import { getProcessedData, computeIndex } from './indexEngine'
import { normalizeWeights, computeWeights } from './weight'

export interface ContributionItem {
  categoryId: string
  categoryName: string
  value: number
}

export function getContributionForPeriod(
  indexResult: IndexResult,
  categories: Category[],
  periodId: string,
): ContributionItem[] {
  const raw = indexResult.contributions[periodId] || {}
  const items: ContributionItem[] = []
  for (const c of categories) {
    const v = raw[c.id]
    if (typeof v === 'number' && isFinite(v)) {
      items.push({ categoryId: c.id, categoryName: c.name, value: v })
    }
  }
  items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  return items
}

export function getTotalChangeForPeriod(
  contributions: ContributionItem[],
): number {
  return contributions.reduce((s, it) => s + it.value, 0)
}

export function recomputeContributionDecomposition(
  periods: Period[],
  categories: Category[],
  priceMatrix: PriceMatrix,
  weightConfig: WeightConfig,
  basePeriodId: string,
  formula: Formula,
  targetPeriodId: string,
): { items: ContributionItem[]; total: number; startIndex: number; endIndex: number } {
  const ctx = { periods, categories, rawPriceMatrix: priceMatrix, weightConfig, basePeriodId, formula }
  const result = computeIndex(ctx)
  const items = getContributionForPeriod(result, categories, targetPeriodId)
  const total = getTotalChangeForPeriod(items)
  const startIndex = NaN
  const endIndex = NaN
  return { items, total, startIndex, endIndex }
}

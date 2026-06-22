import type { Category, Period, PriceMatrix, IndexResult, WeightConfig, VerifyReport, Formula } from './types'
import { computeIndex, getProcessedData } from './indexEngine'
import { normalizeWeights, computeWeights } from './weight'

export function buildVerifyReport(
  periods: Period[],
  categories: Category[],
  priceMatrix: PriceMatrix,
  weightConfig: WeightConfig,
  basePeriodId: string,
  formula: Formula,
  indexResult: IndexResult,
): VerifyReport {
  const processed = getProcessedData({
    periods,
    categories,
    rawPriceMatrix: priceMatrix,
    weightConfig,
    basePeriodId,
  })
  const available = processed.availableCategories

  const wRaw = computeWeights(weightConfig, available)
  const wNorm = normalizeWeights(wRaw, available)
  const weightSum = Object.values(wNorm).reduce((s, v) => s + (isFinite(v) ? v : 0), 0)
  const weightSumOk = Math.abs(weightSum - 1) < 1e-9 || available.length === 0

  const chainVsFixedDiff: Record<string, number> = {}
  let chainVsFixedMaxDiff = 0
  for (const p of periods) {
    const fb = indexResult.fixedBase[p.id]
    const ch = indexResult.chained[p.id]
    if (typeof fb === 'number' && isFinite(fb) && typeof ch === 'number' && isFinite(ch)) {
      const diff = Math.abs(fb - ch)
      chainVsFixedDiff[p.id] = diff
      if (diff > chainVsFixedMaxDiff) chainVsFixedMaxDiff = diff
    }
  }

  const contributionSumOk: Record<string, boolean> = {}
  const contributionSumDiff: Record<string, number> = {}
  for (let i = 1; i < periods.length; i++) {
    const pid = periods[i].id
    const prevPid = periods[i - 1].id
    const contrib = indexResult.contributions[pid] || {}
    const contribSum = Object.values(contrib).reduce((s, v) => s + (isFinite(v) ? v : 0), 0)
    const fbCur = indexResult.fixedBase[pid]
    const fbPrev = indexResult.fixedBase[prevPid]
    let expectedDiff = NaN
    if (typeof fbCur === 'number' && isFinite(fbCur) && typeof fbPrev === 'number' && isFinite(fbPrev)) {
      expectedDiff = fbCur - fbPrev
    }
    if (isFinite(expectedDiff)) {
      const diff = Math.abs(contribSum - expectedDiff)
      contributionSumDiff[pid] = diff
      contributionSumOk[pid] = diff < 0.05
    } else {
      contributionSumDiff[pid] = NaN
      contributionSumOk[pid] = true
    }
  }

  return { weightSumOk, weightSum, chainVsFixedDiff, chainVsFixedMaxDiff, contributionSumOk, contributionSumDiff }
}

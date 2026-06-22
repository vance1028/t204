import type { Category, Period, PriceMatrix, IndexResult, Formula, WeightConfig } from './types'
import { processMissingAndAnomalies, hasValidPrice } from './missing'
import { normalizeWeights, computeWeights, getReportPeriodWeights } from './weight'

export interface ComputeContext {
  periods: Period[]
  categories: Category[]
  rawPriceMatrix: PriceMatrix
  weightConfig: WeightConfig
  basePeriodId: string
  formula: Formula
}

function validCatsForPeriod(
  processed: ReturnType<typeof processMissingAndAnomalies>,
  periodId: string,
  categories: Category[],
): string[] {
  return categories
    .map((c) => c.id)
    .filter((cid) => hasValidPrice(processed, cid, periodId))
}

function computeFixedBaseSingle(
  ctx: ComputeContext,
  processed: ReturnType<typeof processMissingAndAnomalies>,
  reportPeriodId: string,
): number {
  const { basePeriodId, formula } = ctx
  const baseCats = validCatsForPeriod(processed, basePeriodId, ctx.categories)
  const reportCats = validCatsForPeriod(processed, reportPeriodId, ctx.categories)
  const common = baseCats.filter((c) => reportCats.includes(c))
  if (common.length === 0) return NaN

  const weights = getReportPeriodWeights(
    ctx.weightConfig,
    common,
    basePeriodId,
    reportPeriodId,
    processed.prices,
    formula,
  )
  const wNorm = normalizeWeights(weights, common)

  let num = 0
  let den = 0
  for (const cid of common) {
    const p0 = processed.prices[cid][basePeriodId] as number
    const pt = processed.prices[cid][reportPeriodId] as number
    const w = wNorm[cid]
    num += w * (pt / p0)
    den += w
  }
  if (den === 0) return NaN
  return (num / den) * 100
}

function computeMoMSingle(
  ctx: ComputeContext,
  processed: ReturnType<typeof processMissingAndAnomalies>,
  prevPeriodId: string,
  reportPeriodId: string,
): number {
  const { formula } = ctx
  const reportCats = validCatsForPeriod(processed, reportPeriodId, ctx.categories)
  const prevCats = validCatsForPeriod(processed, prevPeriodId, ctx.categories)
  const common = reportCats.filter((c) => prevCats.includes(c))
  if (common.length === 0) return NaN

  const weights = getReportPeriodWeights(
    ctx.weightConfig,
    common,
    prevPeriodId,
    reportPeriodId,
    processed.prices,
    formula,
  )
  const wNorm = normalizeWeights(weights, common)

  let num = 0
  let den = 0
  for (const cid of common) {
    const p0 = processed.prices[cid][prevPeriodId] as number
    const pt = processed.prices[cid][reportPeriodId] as number
    const w = wNorm[cid]
    num += w * (pt / p0)
    den += w
  }
  if (den === 0) return NaN
  return (num / den) * 100
}

export function computeIndex(ctx: ComputeContext): IndexResult {
  const periods = ctx.periods.slice()
  const processed = processMissingAndAnomalies(
    ctx.rawPriceMatrix,
    ctx.categories,
    ctx.periods,
  )
  const fixedBase: Record<string, number> = {}
  const mom: Record<string, number> = {}
  const chained: Record<string, number> = {}
  const contributions: Record<string, Record<string, number>> = {}

  const baseIdx = periods.findIndex((p) => p.id === ctx.basePeriodId)
  if (baseIdx < 0) {
    return { fixedBase: {}, mom: {}, chained: {}, contributions: {} }
  }

  for (let i = 0; i < periods.length; i++) {
    const pid = periods[i].id
    fixedBase[pid] = computeFixedBaseSingle(ctx, processed, pid)
    if (i === 0) {
      mom[pid] = NaN
    } else {
      mom[pid] = computeMoMSingle(ctx, processed, periods[i - 1].id, pid)
    }
  }

  chained[periods[baseIdx].id] = 100
  for (let i = baseIdx + 1; i < periods.length; i++) {
    const pid = periods[i].id
    const prevChain = chained[periods[i - 1].id]
    const m = mom[pid]
    if (typeof prevChain === 'number' && isFinite(prevChain) && typeof m === 'number' && isFinite(m)) {
      chained[pid] = prevChain * (m / 100)
    } else {
      chained[pid] = NaN
    }
  }
  for (let i = baseIdx - 1; i >= 0; i--) {
    const pid = periods[i].id
    const nextChain = chained[periods[i + 1].id]
    const nextMom = mom[periods[i + 1].id]
    if (typeof nextChain === 'number' && isFinite(nextChain) && typeof nextMom === 'number' && isFinite(nextMom) && nextMom > 0) {
      chained[pid] = nextChain / (nextMom / 100)
    } else {
      chained[pid] = NaN
    }
  }

  for (let i = 1; i < periods.length; i++) {
    const pid = periods[i].id
    const prevPid = periods[i - 1].id
    contributions[pid] = computeContributionPerCategory(ctx, processed, prevPid, pid)
  }

  return { fixedBase, mom, chained, contributions }
}

function computeContributionPerCategory(
  ctx: ComputeContext,
  processed: ReturnType<typeof processMissingAndAnomalies>,
  prevPeriodId: string,
  reportPeriodId: string,
): Record<string, number> {
  const { basePeriodId } = ctx
  const baseCats = validCatsForPeriod(processed, basePeriodId, ctx.categories)
  const prevCats = validCatsForPeriod(processed, prevPeriodId, ctx.categories)
  const reportCats = validCatsForPeriod(processed, reportPeriodId, ctx.categories)
  const common = baseCats.filter((c) => prevCats.includes(c) && reportCats.includes(c))

  const wRaw = computeWeights(ctx.weightConfig, common)
  const w = normalizeWeights(wRaw, common)
  const out: Record<string, number> = {}
  for (const cid of common) {
    const p0 = processed.prices[cid][basePeriodId] as number
    const pPrev = processed.prices[cid][prevPeriodId] as number
    const pCur = processed.prices[cid][reportPeriodId] as number
    if (p0 > 0) {
      out[cid] = w[cid] * ((pCur - pPrev) / p0) * 100
    } else {
      out[cid] = 0
    }
  }
  return out
}

export function getProcessedData(ctx: Omit<ComputeContext, 'formula'>) {
  return processMissingAndAnomalies(ctx.rawPriceMatrix, ctx.categories, ctx.periods)
}

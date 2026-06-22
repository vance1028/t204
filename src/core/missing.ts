import type { Category, Period, PriceMatrix, ProcessedData, ProcessLogEntry } from './types'

const ANOMALY_THRESHOLD = 0.3

function findPrevNextValid(
  prices: PriceMatrix,
  categoryId: string,
  periodIdx: number,
  orderedPeriodIds: string[],
): { prevIdx: number | null; nextIdx: number | null; prevVal: number | null; nextVal: number | null } {
  let prevIdx: number | null = null
  let prevVal: number | null = null
  for (let i = periodIdx - 1; i >= 0; i--) {
    const v = prices[categoryId]?.[orderedPeriodIds[i]]
    if (typeof v === 'number' && isFinite(v)) {
      prevIdx = i
      prevVal = v
      break
    }
  }
  let nextIdx: number | null = null
  let nextVal: number | null = null
  for (let i = periodIdx + 1; i < orderedPeriodIds.length; i++) {
    const v = prices[categoryId]?.[orderedPeriodIds[i]]
    if (typeof v === 'number' && isFinite(v)) {
      nextIdx = i
      nextVal = v
      break
    }
  }
  return { prevIdx, nextIdx, prevVal, nextVal }
}

export function processMissingAndAnomalies(
  rawPriceMatrix: PriceMatrix,
  categories: Category[],
  periods: Period[],
): ProcessedData {
  const orderedPeriodIds = periods.map((p) => p.id)
  const prices: PriceMatrix = {}
  const logs: ProcessLogEntry[] = []
  const anomalies: Record<string, Record<string, boolean>> = {}
  const availableCategories: string[] = []

  for (const cat of categories) {
    const row: Record<string, number | null> = {}
    const rawRow = rawPriceMatrix[cat.id] || {}
    const catAnom: Record<string, boolean> = {}
    let hasAnyValid = false

    for (let i = 0; i < orderedPeriodIds.length; i++) {
      const pid = orderedPeriodIds[i]
      const raw = rawRow[pid]
      if (typeof raw === 'number' && isFinite(raw) && raw > 0) {
        row[pid] = raw
        hasAnyValid = true
      } else {
        row[pid] = null
      }
    }

    for (let i = 0; i < orderedPeriodIds.length; i++) {
      const pid = orderedPeriodIds[i]
      if (row[pid] === null) {
        const { prevIdx, nextIdx, prevVal, nextVal } = findPrevNextValid(
          { [cat.id]: row } as PriceMatrix,
          cat.id,
          i,
          orderedPeriodIds,
        )
        if (prevIdx !== null && nextIdx !== null && prevVal !== null && nextVal !== null) {
          const t = (i - prevIdx) / (nextIdx - prevIdx)
          const interp = prevVal + t * (nextVal - prevVal)
          row[pid] = interp
          logs.push({
            type: 'interpolated',
            periodId: pid,
            categoryId: cat.id,
            message: `${cat.name} 在期次 ${pid} 缺失，已线性插值为 ${interp.toFixed(2)}`,
          })
        } else {
          logs.push({
            type: 'dropped',
            periodId: pid,
            categoryId: cat.id,
            message: `${cat.name} 在期次 ${pid} 缺失且无法插值，该期该品类被剔除，权重已重新归一`,
          })
        }
      }
    }

    for (let i = 1; i < orderedPeriodIds.length; i++) {
      const pid = orderedPeriodIds[i]
      const prevPid = orderedPeriodIds[i - 1]
      const cur = row[pid]
      const prev = row[prevPid]
      if (typeof cur === 'number' && typeof prev === 'number' && prev > 0) {
        const change = Math.abs(cur / prev - 1)
        if (change > ANOMALY_THRESHOLD) {
          catAnom[pid] = true
          logs.push({
            type: 'anomaly',
            periodId: pid,
            categoryId: cat.id,
            message: `${cat.name} 在期次 ${pid} 价格跳变 ${((cur / prev - 1) * 100).toFixed(1)}%，已标注异常`,
          })
        }
      }
    }

    prices[cat.id] = row
    if (Object.keys(catAnom).length > 0) anomalies[cat.id] = catAnom
    if (hasAnyValid || Object.values(row).some((v) => typeof v === 'number')) {
      availableCategories.push(cat.id)
    }
  }

  return { prices, logs, anomalies, availableCategories }
}

export function hasValidPrice(
  processed: ProcessedData,
  categoryId: string,
  periodId: string,
): boolean {
  const v = processed.prices[categoryId]?.[periodId]
  return typeof v === 'number' && isFinite(v) && v > 0
}

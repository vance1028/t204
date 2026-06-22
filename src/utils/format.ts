export function formatNumber(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatPercent(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}%`
}

export function formatPctPoint(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}`
}

export function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

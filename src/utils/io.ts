import type { AppDataBundle, Period, Category, IndexResult, IndexType } from '@/core/types'

export function exportToJSON(bundle: AppDataBundle): string {
  return JSON.stringify(bundle, null, 2)
}

export function downloadJSON(content: string, filename = 'price-index-data.json'): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function parseJSON(text: string): AppDataBundle | null {
  try {
    const parsed = JSON.parse(text)
    if (parsed && Array.isArray(parsed.periods) && Array.isArray(parsed.categories)) {
      return parsed as AppDataBundle
    }
    return null
  } catch (e) {
    console.error('JSON parse error', e)
    return null
  }
}

export function exportIndexCSV(
  periods: Period[],
  categories: Category[],
  laspeyresResult: IndexResult,
  paascheResult: IndexResult,
): string {
  const header = [
    '期次',
    '拉氏定基指数',
    '拉氏环比指数',
    '拉氏链式指数',
    '帕氏定基指数',
    '帕氏环比指数',
    '帕氏链式指数',
  ].join(',')
  const rows: string[] = [header]
  for (const p of periods) {
    const row = [
      p.label,
      fmt(laspeyresResult.fixedBase[p.id]),
      fmt(laspeyresResult.mom[p.id]),
      fmt(laspeyresResult.chained[p.id]),
      fmt(paascheResult.fixedBase[p.id]),
      fmt(paascheResult.mom[p.id]),
      fmt(paascheResult.chained[p.id]),
    ].join(',')
    rows.push(row)
  }
  rows.push('')
  rows.push('品类涨跌贡献（拉氏，百分点）')
  const contribHeader = ['期次', ...categories.map((c) => c.name)].join(',')
  rows.push(contribHeader)
  for (const p of periods) {
    const contrib = laspeyresResult.contributions[p.id] || {}
    const row = [p.label, ...categories.map((c) => fmt(contrib[c.id]))].join(',')
    rows.push(row)
  }
  return rows.join('\n')
}

function fmt(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return ''
  return v.toFixed(4)
}

export function downloadCSV(content: string, filename = 'price-index-result.csv'): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  triggerDownload(blob, filename)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'utf-8')
  })
}

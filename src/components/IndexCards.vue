<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div class="card px-4 py-3">
      <div class="text-xs text-slate-400 mb-1">综合指数（{{ formulaLabel }}）</div>
      <div class="flex items-end gap-2">
        <span class="font-mono-num text-3xl font-semibold text-slate-100">
          {{ fmt(currentIndex) }}
        </span>
        <span class="text-xs text-slate-500 mb-1">
          基期 = {{ store.basePeriod?.label ?? '—' }}
        </span>
      </div>
      <div class="mt-1 flex items-center gap-1.5 text-xs">
        <span class="text-slate-400">报告期：</span>
        <span class="text-slate-200">{{ store.selectedPeriod?.label ?? '—' }}</span>
      </div>
    </div>

    <div class="card px-4 py-3">
      <div class="text-xs text-slate-400 mb-1">相对基期涨跌</div>
      <div class="flex items-end gap-2">
        <TrendingUp v-if="changeFromBase > 0" class="w-5 h-5 text-sky-400 mb-0.5" />
        <TrendingDown v-else-if="changeFromBase < 0" class="w-5 h-5 text-orange-400 mb-0.5" />
        <Minus v-else class="w-5 h-5 text-slate-500 mb-0.5" />
        <span
          class="font-mono-num text-2xl font-semibold"
          :class="changeFromBase > 0 ? 'text-sky-400' : changeFromBase < 0 ? 'text-orange-400' : 'text-slate-400'"
        >
          {{ fmtPct(changeFromBase) }}
        </span>
      </div>
    </div>

    <div class="card px-4 py-3">
      <div class="text-xs text-slate-400 mb-1">环比涨跌</div>
      <div class="flex items-end gap-2">
        <TrendingUp v-if="momChange > 0" class="w-5 h-5 text-sky-400 mb-0.5" />
        <TrendingDown v-else-if="momChange < 0" class="w-5 h-5 text-orange-400 mb-0.5" />
        <Minus v-else class="w-5 h-5 text-slate-500 mb-0.5" />
        <span
          class="font-mono-num text-2xl font-semibold"
          :class="momChange > 0 ? 'text-sky-400' : momChange < 0 ? 'text-orange-400' : 'text-slate-400'"
        >
          {{ fmtPct(momChangePct) }}
        </span>
        <span class="text-xs text-slate-500 mb-1 font-mono-num">
          {{ fmtPctPoint(momChange) }} 点
        </span>
      </div>
    </div>

    <div class="card px-4 py-3">
      <div class="text-xs text-slate-400 mb-1">链式指数 vs 定基</div>
      <div class="flex items-end gap-2">
        <span class="font-mono-num text-2xl font-semibold text-slate-100">{{ fmt(chainIndex) }}</span>
        <span
          class="text-xs mb-1 px-1.5 py-0.5 rounded"
          :class="chainDiff < 0.05 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'"
        >
          偏差 {{ chainDiff.toFixed(4) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { useIndexStore } from '@/store/indexStore'
import { formatNumber, formatPercent, formatPctPoint } from '@/utils/format'

const store = useIndexStore()

const formulaLabel = computed(() => (store.indexConfig.formula === 'laspeyres' ? '拉氏' : '帕氏'))

const currentIndex = computed(() => {
  if (!store.selectedPeriodId) return NaN
  return store.currentResult.fixedBase[store.selectedPeriodId] ?? NaN
})

const baseIndex = computed(() => {
  return store.currentResult.fixedBase[store.indexConfig.basePeriodId] ?? 100
})

const changeFromBase = computed(() => {
  if (!isFinite(currentIndex.value) || !isFinite(baseIndex.value) || baseIndex.value === 0) return NaN
  return ((currentIndex.value - baseIndex.value) / baseIndex.value) * 100
})

const momIndex = computed(() => {
  if (!store.selectedPeriodId) return NaN
  return store.currentResult.mom[store.selectedPeriodId] ?? NaN
})

const momChange = computed(() => {
  if (!isFinite(currentIndex.value)) return NaN
  const idx = store.selectedPeriod ? store.periods.findIndex((p) => p.id === store.selectedPeriod!.id) : -1
  if (idx <= 0) return NaN
  const prevId = store.periods[idx - 1].id
  const prev = store.currentResult.fixedBase[prevId]
  if (!isFinite(prev)) return NaN
  return currentIndex.value - prev
})

const momChangePct = computed(() => (isFinite(momIndex.value) ? momIndex.value - 100 : NaN))

const chainIndex = computed(() => {
  if (!store.selectedPeriodId) return NaN
  return store.currentResult.chained[store.selectedPeriodId] ?? NaN
})

const chainDiff = computed(() => {
  if (!isFinite(currentIndex.value) || !isFinite(chainIndex.value)) return 0
  return Math.abs(currentIndex.value - chainIndex.value)
})

function fmt(v: number | null | undefined) {
  return formatNumber(v, 2)
}
function fmtPct(v: number | null | undefined) {
  return formatPercent(v, 2)
}
function fmtPctPoint(v: number | null | undefined) {
  return formatPctPoint(v, 2)
}
</script>

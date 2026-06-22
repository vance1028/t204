<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <BarChart3 class="w-4 h-4" />
        涨跌贡献分解（{{ selectedLabel }}）
      </span>
      <span class="text-xs text-slate-400">
        总变动：
        <span
          class="font-mono-num"
          :class="totalChange > 0 ? 'text-sky-400' : totalChange < 0 ? 'text-orange-400' : 'text-slate-300'"
        >{{ totalDisplay }}</span>
      </span>
    </div>
    <div ref="chartEl" class="chart-container px-2"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { BarChart3 } from 'lucide-vue-next'
import * as echarts from 'echarts/core'
import { BarChart as EBarChart, CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useIndexStore } from '@/store/indexStore'
import { formatPctPoint } from '@/utils/format'

echarts.use([EBarChart, CustomChart, GridComponent, TooltipComponent, CanvasRenderer])

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const store = useIndexStore()

const selectedLabel = computed(() => {
  if (!store.selectedPeriod) return '请选择报告期'
  const idx = store.periods.findIndex((p) => p.id === store.selectedPeriodId)
  if (idx <= 0) return `${store.selectedPeriod.label}（无前期）`
  return `${store.periods[idx - 1].label} → ${store.selectedPeriod.label}`
})

const totalChange = computed(() => store.selectedTotalChange)
const totalDisplay = computed(() => `${formatPctPoint(totalChange.value)} 点`)

function buildOption(): any {
  const items = store.selectedContributions
  if (items.length === 0) {
    return {
      backgroundColor: 'transparent',
      title: {
        text: '请选择有前期数据的报告期以查看涨跌贡献',
        left: 'center',
        top: 'middle',
        textStyle: { color: '#64748b', fontSize: 12, fontWeight: 'normal' },
      },
    }
  }

  const categories = items.map((it) => it.categoryName)
  const values = items.map((it) => +it.value.toFixed(4))

  const helperData: number[] = []
  const positiveData: (number | null)[] = []
  const negativeData: (number | null)[] = []

  let acc = 0
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (v >= 0) {
      helperData.push(+acc.toFixed(4))
      positiveData.push(+v.toFixed(4))
      negativeData.push(null)
    } else {
      helperData.push(+(acc + v).toFixed(4))
      positiveData.push(null)
      negativeData.push(+Math.abs(v).toFixed(4))
    }
    acc += v
  }

  const colorMap = new Map(store.categories.map((c) => [c.name, c.color]))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: any) => {
        const p = params.find((x: any) => x.seriesName !== '占位' && x.value !== null && x.value !== undefined)
        if (!p) return ''
        const sign = p.seriesName === '上涨贡献' ? '+' : '-'
        const abs = typeof p.value === 'number' ? p.value : 0
        return `${p.name}<br/>${p.marker} ${sign}${abs.toFixed(4)} 点`
      },
    },
    grid: { left: 96, right: 40, top: 20, bottom: 40 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => (v > 0 ? `+${v}` : `${v}`) },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: { color: '#cbd5e1', fontSize: 11 },
    },
    series: [
      {
        name: '占位',
        type: 'bar',
        stack: 'total',
        data: helperData,
        itemStyle: { color: 'transparent', borderColor: 'transparent' },
        barWidth: 14,
      },
      {
        name: '上涨贡献',
        type: 'bar',
        stack: 'total',
        data: positiveData.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colorMap.get(categories[i]) ?? '#38bdf8',
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: typeof v === 'number',
            position: 'right',
            color: '#7dd3fc',
            fontSize: 10,
            formatter: (p: any) => `+${Number(p.value).toFixed(2)}`,
          },
        })),
        barWidth: 14,
      },
      {
        name: '下跌贡献',
        type: 'bar',
        stack: 'total',
        data: negativeData.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colorMap.get(categories[i]) ?? '#fb923c',
            opacity: 0.85,
            borderRadius: [4, 0, 0, 4],
          },
          label: {
            show: typeof v === 'number',
            position: 'left',
            color: '#fdba74',
            fontSize: 10,
            formatter: (p: any) => `-${Number(p.value).toFixed(2)}`,
          },
        })),
        barWidth: 14,
      },
    ],
  }
}

function render() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

function handleResize() {
  chart?.resize()
}

onMounted(async () => {
  await nextTick()
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  render()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})

watch(
  () => [store.selectedContributions, store.selectedPeriodId, store.categories],
  () => render(),
  { deep: true },
)
</script>

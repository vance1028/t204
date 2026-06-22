<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <LineChart class="w-4 h-4" />
        综合指数走势（拉氏 / 帕氏 对比）
      </span>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" v-model="showLaspeyres" class="accent-sky-500" />
          <span class="inline-block w-2 h-2 rounded-full bg-sky-400"></span>拉氏
        </label>
        <label class="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" v-model="showPaasche" class="accent-indigo-500" />
          <span class="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>帕氏
        </label>
      </div>
    </div>
    <div ref="chartEl" class="chart-container px-2"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { LineChart } from 'lucide-vue-next'
import * as echarts from 'echarts/core'
import { LineChart as ELineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useIndexStore } from '@/store/indexStore'

echarts.use([ELineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, DataZoomComponent, CanvasRenderer])

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const showLaspeyres = ref(true)
const showPaasche = ref(true)

const store = useIndexStore()

function buildOption(): any {
  const periods = store.periods
  const xData = periods.map((p) => p.label)
  const baseIdx = periods.findIndex((p) => p.id === store.indexConfig.basePeriodId)
  const baseLabel = periods[baseIdx]?.label ?? ''

  const series: any[] = []
  if (showLaspeyres.value) {
    series.push({
      name: '拉氏定基指数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#38bdf8' },
      itemStyle: { color: '#38bdf8' },
      emphasis: { focus: 'series' },
      data: periods.map((p) => {
        const v = store.laspeyresResult.fixedBase[p.id]
        return isFinite(v) ? +v.toFixed(4) : null
      }),
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#475569', type: 'dashed', width: 1 },
        data: [{ yAxis: 100, label: { formatter: '基期 100', color: '#94a3b8', fontSize: 10 } }],
      },
    })
  }
  if (showPaasche.value) {
    series.push({
      name: '帕氏定基指数',
      type: 'line',
      smooth: true,
      symbol: 'diamond',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#818cf8' },
      itemStyle: { color: '#818cf8' },
      emphasis: { focus: 'series' },
      data: periods.map((p) => {
        const v = store.paascheResult.fixedBase[p.id]
        return isFinite(v) ? +v.toFixed(4) : null
      }),
    })
  }

  return {
    backgroundColor: 'transparent',
    grid: { left: 50, right: 24, top: 24, bottom: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { lineStyle: { color: '#475569' } },
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
    ],
    series,
  }
}

function render() {
  if (!chart) return
  chart.setOption(buildOption(), true)
  if (store.selectedPeriodId) {
    const idx = store.periods.findIndex((p) => p.id === store.selectedPeriodId)
    if (idx >= 0) {
      chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx })
    }
  }
}

function attachEvents() {
  if (!chart) return
  chart.off('click')
  chart.on('click', (params: any) => {
    if (typeof params.dataIndex === 'number') {
      const p = store.periods[params.dataIndex]
      if (p) store.selectPeriod(p.id)
    }
  })
}

function handleResize() {
  chart?.resize()
}

onMounted(async () => {
  await nextTick()
  if (!chartEl.value) return
  chart = echarts.init(chartEl.value)
  attachEvents()
  render()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})

watch(
  () => [
    store.periods,
    store.laspeyresResult,
    store.paascheResult,
    store.indexConfig.basePeriodId,
    store.selectedPeriodId,
    showLaspeyres.value,
    showPaasche.value,
  ],
  () => render(),
  { deep: true },
)
</script>

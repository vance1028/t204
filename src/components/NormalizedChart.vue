<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <Activity class="w-4 h-4" />
        各品类归一化价格（基期=100）
      </span>
    </div>
    <div ref="chartEl" class="chart-container px-2"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Activity } from 'lucide-vue-next'
import * as echarts from 'echarts/core'
import { LineChart as ELineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useIndexStore } from '@/store/indexStore'

echarts.use([ELineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const store = useIndexStore()

function buildOption(): any {
  const periods = store.periods
  const baseId = store.indexConfig.basePeriodId
  const xData = periods.map((p) => p.label)
  const processed = store.processedData

  const series: any[] = store.categories.map((cat) => {
    const basePrice = processed.prices[cat.id]?.[baseId]
    const data = periods.map((p) => {
      const v = processed.prices[cat.id]?.[p.id]
      if (typeof v !== 'number' || typeof basePrice !== 'number' || basePrice <= 0) return null
      return +((v / basePrice) * 100).toFixed(3)
    })
    return {
      name: cat.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 1.8, color: cat.color },
      itemStyle: { color: cat.color },
      emphasis: { focus: 'series' },
      data,
    }
  })

  return {
    backgroundColor: 'transparent',
    legend: {
      type: 'scroll',
      bottom: 2,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      itemWidth: 10,
      itemHeight: 8,
    },
    grid: { left: 44, right: 16, top: 16, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 11 },
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
    dataZoom: [{ type: 'inside', xAxisIndex: 0 }],
    series,
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
  () => [store.periods, store.categories, store.processedData, store.indexConfig.basePeriodId],
  () => render(),
  { deep: true },
)
</script>

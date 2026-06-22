<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <PieChartIcon class="w-4 h-4" />
        篮子权重构成
      </span>
      <div class="segmented">
        <button :class="{ active: chartType === 'pie' }" @click="chartType = 'pie'">环形</button>
        <button :class="{ active: chartType === 'bar' }" @click="chartType = 'bar'">条形</button>
      </div>
    </div>
    <div ref="chartEl" class="chart-container px-2"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { PieChart as PieChartIcon } from 'lucide-vue-next'
import * as echarts from 'echarts/core'
import { PieChart as EPieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useIndexStore } from '@/store/indexStore'

echarts.use([EPieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const chartEl = ref<HTMLElement | null>(null)
const chartType = ref<'pie' | 'bar'>('pie')
let chart: echarts.ECharts | null = null

const store = useIndexStore()

function buildOption(): any {
  const data = store.categories
    .map((c) => ({
      name: c.name,
      value: +((store.normalizedWeights[c.id] ?? 0) * 100).toFixed(2),
      itemStyle: { color: c.color },
    }))
    .filter((d) => d.value > 0)

  if (chartType.value === 'pie') {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15,23,42,0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: '{b}: {c}% ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 'middle',
        textStyle: { color: '#94a3b8', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 8,
      },
      series: [
        {
          name: '权重',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#0f172a', borderWidth: 2 },
          label: {
            show: true,
            color: '#cbd5e1',
            fontSize: 10,
            formatter: '{d}%',
          },
          labelLine: { length: 8, length2: 6 },
          data,
        },
      ],
    }
  }

  const sorted = [...data].sort((a, b) => a.value - b.value)
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { type: 'shadow' },
      formatter: (p: any) => {
        const d = p[0]
        return `${d.name}: ${d.value}%`
      },
    },
    grid: { left: 72, right: 40, top: 12, bottom: 20 },
    xAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, formatter: '{value}%' },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisTick: { show: false },
      axisLabel: { color: '#cbd5e1', fontSize: 11 },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => ({
          value: d.value,
          itemStyle: { color: d.itemStyle?.color, borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          color: '#e2e8f0',
          fontSize: 10,
          formatter: '{c}%',
        },
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
  () => [store.categories, store.normalizedWeights, chartType.value],
  () => render(),
  { deep: true },
)
</script>

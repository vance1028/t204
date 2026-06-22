<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <PieChart class="w-4 h-4" />
        篮子权重配置
      </span>
      <div class="segmented">
        <button
          :class="{ active: store.weightConfig.mode === 'manual' }"
          @click="store.setWeightMode('manual')"
        >手动权重</button>
        <button
          :class="{ active: store.weightConfig.mode === 'turnover' }"
          @click="store.setWeightMode('turnover')"
        >交易额份额</button>
      </div>
    </div>
    <div class="px-4 py-3 space-y-3 max-h-[320px] overflow-y-auto">
      <div v-for="cat in store.categories" :key="cat.id" class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :style="{ background: cat.color }"
          ></span>
          <span class="text-sm text-slate-200 flex-1">{{ cat.name }}</span>
          <span class="font-mono-num text-sm text-sky-400 w-14 text-right">
            {{ ((store.normalizedWeights[cat.id] ?? 0) * 100).toFixed(1) }}%
          </span>
        </div>
        <div class="flex items-center gap-2 pl-5">
          <input
            type="range"
            min="0"
            :max="maxSlider"
            step="0.1"
            :value="sliderValue(cat.id)"
            @input="(e) => handleSlider(cat.id, parseFloat((e.target as HTMLInputElement).value))"
            class="flex-1"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            class="w-20 font-mono-num text-right"
            :value="inputValue(cat.id)"
            @change="(e) => handleInput(cat.id, parseFloat((e.target as HTMLInputElement).value))"
          />
        </div>
      </div>
    </div>
    <div class="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
      <span class="text-slate-400">归一化权重和</span>
      <span
        class="font-mono-num"
        :class="store.verifyReport.weightSumOk ? 'text-emerald-400' : 'text-amber-400'"
      >
        {{ store.verifyReport.weightSum.toFixed(6) }}
        <Check v-if="store.verifyReport.weightSumOk" class="inline w-3.5 h-3.5 ml-1 align-text-bottom" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PieChart, Check } from 'lucide-vue-next'
import { useIndexStore } from '@/store/indexStore'

const store = useIndexStore()

const maxSlider = computed(() => {
  const values = store.categories.map((c) => rawValue(c.id)).filter((v) => isFinite(v))
  const m = Math.max(100, ...values)
  return Math.ceil(m * 1.2)
})

function rawValue(catId: string): number {
  const cfg = store.weightConfig
  return cfg.mode === 'manual' ? cfg.manualWeights[catId] ?? 0 : cfg.turnoverShares[catId] ?? 0
}

function sliderValue(catId: string): number {
  return rawValue(catId)
}

function inputValue(catId: string): number {
  return rawValue(catId)
}

function handleSlider(catId: string, v: number) {
  if (!isFinite(v) || v < 0) return
  if (store.weightConfig.mode === 'manual') {
    store.updateManualWeight(catId, v)
  } else {
    store.updateTurnoverShare(catId, v)
  }
}

function handleInput(catId: string, v: number) {
  if (!isFinite(v) || v < 0) return
  if (store.weightConfig.mode === 'manual') {
    store.updateManualWeight(catId, v)
  } else {
    store.updateTurnoverShare(catId, v)
  }
}
</script>

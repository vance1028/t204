<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <ShieldCheck class="w-4 h-4" />
        计算校验
      </span>
    </div>
    <div class="px-4 py-3 space-y-2.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="text-slate-400">权重归一化校验</span>
        <span
          class="flex items-center gap-1"
          :class="store.verifyReport.weightSumOk ? 'text-emerald-400' : 'text-amber-400'"
        >
          <Check v-if="store.verifyReport.weightSumOk" class="w-3.5 h-3.5" />
          <AlertTriangle v-else class="w-3.5 h-3.5" />
          {{ store.verifyReport.weightSumOk ? '通过（和为 1）' : '存在偏差' }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-slate-400">链式环比连乘 vs 定基指数</span>
        <span
          class="flex items-center gap-1"
          :class="store.verifyReport.chainVsFixedMaxDiff < 0.05 ? 'text-emerald-400' : 'text-amber-400'"
        >
          <Check v-if="store.verifyReport.chainVsFixedMaxDiff < 0.05" class="w-3.5 h-3.5" />
          <AlertTriangle v-else class="w-3.5 h-3.5" />
          最大偏差 {{ store.verifyReport.chainVsFixedMaxDiff.toFixed(4) }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-slate-400">各期涨跌贡献和 = 总涨跌</span>
        <span
          class="flex items-center gap-1"
          :class="allContribOk ? 'text-emerald-400' : 'text-amber-400'"
        >
          <Check v-if="allContribOk" class="w-3.5 h-3.5" />
          <AlertTriangle v-else class="w-3.5 h-3.5" />
          {{ allContribOk ? '全部通过' : `存在偏差（最大 ${maxContribDiff.toFixed(4)}）` }}
        </span>
      </div>

      <div v-if="logs.length > 0" class="pt-2 border-t border-slate-800 mt-2">
        <div class="text-slate-400 mb-1.5">数据处理日志（{{ logs.length }} 条）</div>
        <div class="max-h-24 overflow-y-auto space-y-0.5">
          <div
            v-for="(log, i) in logs"
            :key="i"
            class="font-mono-num text-[11px] leading-relaxed"
            :class="{
              'text-sky-400/80': log.type === 'interpolated',
              'text-orange-400/80': log.type === 'anomaly',
              'text-amber-400/80': log.type === 'dropped',
              'text-slate-400': log.type === 'info',
            }"
          >
            · {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, Check, AlertTriangle } from 'lucide-vue-next'
import { useIndexStore } from '@/store/indexStore'

const store = useIndexStore()

const allContribOk = computed(() =>
  Object.values(store.verifyReport.contributionSumOk).every((v) => v === true),
)

const maxContribDiff = computed(() =>
  Math.max(
    0,
    ...Object.values(store.verifyReport.contributionSumDiff).filter((v) => isFinite(v)),
  ),
)

const logs = computed(() => store.processedData.logs.slice(0, 30))
</script>

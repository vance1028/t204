<template>
  <header class="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
    <div class="px-6 py-3 flex items-center gap-6 max-w-[1920px] mx-auto">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
          <TrendingUp class="w-4 h-4 text-white" />
        </div>
        <h1 class="text-base font-semibold tracking-wide text-slate-100">行业价格指数编制平台</h1>
      </div>

      <div class="flex items-center gap-4 ml-4">
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">基期</span>
          <select
            :value="store.indexConfig.basePeriodId"
            @change="(e) => store.setBasePeriod((e.target as HTMLSelectElement).value)"
            class="bg-slate-900/80 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option v-for="p in store.periods" :key="p.id" :value="p.id">{{ p.label }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">编制口径</span>
          <div class="segmented">
            <button
              :class="{ active: store.indexConfig.formula === 'laspeyres' }"
              @click="store.setFormula('laspeyres')"
            >拉氏</button>
            <button
              :class="{ active: store.indexConfig.formula === 'paasche' }"
              @click="store.setFormula('paasche')"
            >帕氏</button>
          </div>
        </div>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
        <label class="btn btn-default cursor-pointer">
          <Upload class="w-3.5 h-3.5" />
          导入 JSON
          <input
            type="file"
            accept="application/json"
            class="hidden"
            @change="handleImport"
          />
        </label>
        <button class="btn btn-default" @click="store.exportBundleJSON()">
          <Download class="w-3.5 h-3.5" />
          导出 JSON
        </button>
        <button class="btn btn-primary" @click="store.exportResultCSV()">
          <FileSpreadsheet class="w-3.5 h-3.5" />
          导出 CSV
        </button>
        <button class="btn btn-default" @click="store.resetToDefaults()">
          <RotateCcw class="w-3.5 h-3.5" />
          重置样例
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { TrendingUp, Upload, Download, FileSpreadsheet, RotateCcw } from 'lucide-vue-next'
import { useIndexStore } from '@/store/indexStore'

const store = useIndexStore()

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = await store.importJSONFile(file)
  if (!ok) alert('JSON 格式不正确或缺少必要字段')
  ;(e.target as HTMLInputElement).value = ''
}
</script>

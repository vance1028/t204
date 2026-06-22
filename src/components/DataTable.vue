<template>
  <div class="card">
    <div class="card-header">
      <span class="card-title flex items-center gap-1.5">
        <Table2 class="w-4 h-4" />
        价格数据（行=品类，列=期次）
      </span>
      <div class="flex items-center gap-2">
        <button class="btn btn-default" @click="addCategory">
          <Plus class="w-3.5 h-3.5" /> 新增品类
        </button>
        <button class="btn btn-default" @click="addPeriod">
          <Plus class="w-3.5 h-3.5" /> 新增期次
        </button>
      </div>
    </div>
    <div class="scroll-x max-h-[380px] overflow-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="sticky left-0 z-10 bg-slate-900">品类 / 单位</th>
            <th v-for="p in store.periods" :key="p.id" class="whitespace-nowrap">
              <div class="flex items-center gap-1">
                {{ p.label }}
                <button
                  class="text-slate-500 hover:text-orange-400"
                  @click="store.removePeriod(p.id)"
                  title="删除该期"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in store.categories" :key="cat.id">
            <td class="sticky left-0 z-10 bg-slate-950">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :style="{ background: cat.color }"
                ></span>
                <div>
                  <div class="text-slate-200">{{ cat.name }}</div>
                  <div class="text-[10px] text-slate-500">{{ cat.unit }}</div>
                </div>
              </div>
            </td>
            <td v-for="p in store.periods" :key="p.id">
              <input
                type="text"
                inputmode="decimal"
                class="w-20 font-mono-num text-right"
                :class="{
                  'cell-missing': rawValue(cat.id, p.id) === null || rawValue(cat.id, p.id) === undefined,
                  'cell-anomaly': isAnomaly(cat.id, p.id),
                }"
                :value="displayValue(cat.id, p.id)"
                @focus="(e) => (e.target as HTMLInputElement).select()"
                @change="(e) => handlePriceChange(cat.id, p.id, (e.target as HTMLInputElement).value)"
              />
            </td>
            <td>
              <button
                class="text-slate-500 hover:text-orange-400"
                @click="store.removeCategory(cat.id)"
                title="删除该品类"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-4 py-2 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-4">
      <span>
        <span class="inline-block w-2 h-2 rounded bg-orange-500/70 mr-1 align-middle"></span>
        价格跳变超过 30% 已标注异常
      </span>
      <span>空值自动线性插值，无法插值时该期剔除</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Table2, Plus, X, Trash2 } from 'lucide-vue-next'
import { useIndexStore } from '@/store/indexStore'
import { formatNumber } from '@/utils/format'
import { genId } from '@/utils/format'

const store = useIndexStore()

function rawValue(catId: string, pid: string) {
  return store.priceMatrix[catId]?.[pid]
}

function displayValue(catId: string, pid: string): string {
  const raw = rawValue(catId, pid)
  if (raw === null || raw === undefined) return ''
  return formatNumber(raw, 2)
}

function isAnomaly(catId: string, pid: string): boolean {
  return !!store.processedData.anomalies[catId]?.[pid]
}

function handlePriceChange(catId: string, pid: string, raw: string) {
  const t = raw.trim()
  if (t === '') {
    store.updatePrice(catId, pid, null)
    return
  }
  const n = parseFloat(t.replace(/,/g, ''))
  if (isFinite(n)) {
    store.updatePrice(catId, pid, n)
  }
}

function addCategory() {
  const name = prompt('请输入品类名称：', '新品类')
  if (!name) return
  const unit = prompt('请输入单位：', '元/吨') || ''
  store.addCategory(name, unit)
}

function addPeriod() {
  const y = new Date().getFullYear()
  const label = prompt('请输入期次标签：', `${y}年新期次`)
  if (!label) return
  store.addPeriod(label)
}
</script>

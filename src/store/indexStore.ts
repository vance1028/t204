import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  AppDataBundle,
  Category,
  Formula,
  IndexConfig,
  IndexResult,
  Period,
  PriceMatrix,
  WeightConfig,
  WeightMode,
} from '@/core/types'
import { computeIndex, getProcessedData } from '@/core/indexEngine'
import { normalizeWeights, computeWeights } from '@/core/weight'
import { buildVerifyReport } from '@/core/verify'
import { getContributionForPeriod, getTotalChangeForPeriod } from '@/core/contribution'
import {
  defaultCategories,
  defaultIndexConfig,
  defaultPeriods,
  defaultPriceMatrix,
  defaultWeightConfig,
} from '@/data/sampleData'
import { genId } from '@/utils/format'
import { loadFromLocalStorage, saveToLocalStorage } from '@/utils/storage'
import { exportIndexCSV, exportToJSON, parseJSON, downloadCSV, downloadJSON, readFileAsText } from '@/utils/io'

export const useIndexStore = defineStore('index', () => {
  const periods = ref<Period[]>([])
  const categories = ref<Category[]>([])
  const priceMatrix = ref<PriceMatrix>({})
  const weightConfig = ref<WeightConfig>(defaultWeightConfig())
  const indexConfig = ref<IndexConfig>({ ...defaultIndexConfig })
  const selectedPeriodId = ref<string | null>(null)

  function initWithDefaults() {
    periods.value = defaultPeriods
    categories.value = defaultCategories.map((c) => ({ ...c }))
    priceMatrix.value = JSON.parse(JSON.stringify(defaultPriceMatrix))
    weightConfig.value = defaultWeightConfig()
    indexConfig.value = { ...defaultIndexConfig }
    selectedPeriodId.value = periods.value[periods.value.length - 1]?.id ?? null
    if (!selectedPeriodId.value) selectedPeriodId.value = periods.value[0]?.id ?? null
    if (periods.value.length > 0 && !selectedPeriodId.value) {
      selectedPeriodId.value = periods.value[periods.value.length - 1].id
    }
  }

  function loadFromBundle(bundle: AppDataBundle) {
    periods.value = bundle.periods
    categories.value = bundle.categories
    priceMatrix.value = bundle.priceMatrix
    weightConfig.value = bundle.weightConfig
    indexConfig.value = bundle.indexConfig
    selectedPeriodId.value = bundle.selectedPeriodId ?? periods.value[periods.value.length - 1]?.id ?? null
  }

  function toBundle(): AppDataBundle {
    return {
      periods: periods.value,
      categories: categories.value,
      priceMatrix: priceMatrix.value,
      weightConfig: weightConfig.value,
      indexConfig: indexConfig.value,
      selectedPeriodId: selectedPeriodId.value,
      version: 1,
    }
  }

  function tryLoadLocalStorage() {
    const bundle = loadFromLocalStorage()
    if (bundle) {
      loadFromBundle(bundle)
      return true
    }
    initWithDefaults()
    return false
  }

  function persist() {
    saveToLocalStorage(toBundle())
  }

  watch(
    [periods, categories, priceMatrix, weightConfig, indexConfig, selectedPeriodId],
    () => persist(),
    { deep: true },
  )

  function setBasePeriod(id: string) {
    indexConfig.value.basePeriodId = id
  }

  function setFormula(f: Formula) {
    indexConfig.value.formula = f
  }

  function setWeightMode(m: WeightMode) {
    weightConfig.value.mode = m
  }

  function updatePrice(categoryId: string, periodId: string, value: number | null) {
    if (!priceMatrix.value[categoryId]) {
      priceMatrix.value[categoryId] = {}
    }
    if (value === null || (typeof value === 'number' && isFinite(value))) {
      priceMatrix.value[categoryId][periodId] = value
    }
  }

  function updateManualWeight(categoryId: string, value: number) {
    weightConfig.value.manualWeights[categoryId] = Math.max(0, value)
  }

  function updateTurnoverShare(categoryId: string, value: number) {
    weightConfig.value.turnoverShares[categoryId] = Math.max(0, value)
  }

  function addCategory(name: string, unit: string) {
    const id = genId('cat')
    const color = pickColor()
    categories.value.push({ id, name, unit, color })
    priceMatrix.value[id] = {}
    weightConfig.value.manualWeights[id] = 1
    weightConfig.value.turnoverShares[id] = 1
    return id
  }

  function removeCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    delete priceMatrix.value[id]
    delete weightConfig.value.manualWeights[id]
    delete weightConfig.value.turnoverShares[id]
    if (categories.value.length === 0) {
      selectedPeriodId.value = null
    }
  }

  function addPeriod(label: string) {
    const id = genId('p')
    periods.value.push({ id, label })
    selectedPeriodId.value = id
    return id
  }

  function removePeriod(id: string) {
    periods.value = periods.value.filter((p) => p.id !== id)
    for (const cid of Object.keys(priceMatrix.value)) {
      delete priceMatrix.value[cid][id]
    }
    if (indexConfig.value.basePeriodId === id && periods.value.length > 0) {
      indexConfig.value.basePeriodId = periods.value[0].id
    }
    if (selectedPeriodId.value === id) {
      selectedPeriodId.value = periods.value[periods.value.length - 1]?.id ?? null
    }
  }

  function pickColor(): string {
    const palette = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac']
    const used = new Set(categories.value.map((c) => c.color))
    return palette.find((c) => !used.has(c)) ?? palette[categories.value.length % palette.length]
  }

  function selectPeriod(id: string) {
    selectedPeriodId.value = id
  }

  const processedData = computed(() =>
    getProcessedData({
      periods: periods.value,
      categories: categories.value,
      rawPriceMatrix: priceMatrix.value,
      weightConfig: weightConfig.value,
      basePeriodId: indexConfig.value.basePeriodId,
    }),
  )

  const normalizedWeights = computed(() => {
    const available = processedData.value.availableCategories
    return normalizeWeights(
      weightConfig.value.mode === 'manual'
        ? weightConfig.value.manualWeights
        : weightConfig.value.turnoverShares,
      available,
    )
  })

  const laspeyresResult = computed<IndexResult>(() =>
    computeIndex({
      periods: periods.value,
      categories: categories.value,
      rawPriceMatrix: priceMatrix.value,
      weightConfig: weightConfig.value,
      basePeriodId: indexConfig.value.basePeriodId,
      formula: 'laspeyres',
    }),
  )

  const paascheResult = computed<IndexResult>(() =>
    computeIndex({
      periods: periods.value,
      categories: categories.value,
      rawPriceMatrix: priceMatrix.value,
      weightConfig: weightConfig.value,
      basePeriodId: indexConfig.value.basePeriodId,
      formula: 'paasche',
    }),
  )

  const currentResult = computed<IndexResult>(() =>
    indexConfig.value.formula === 'laspeyres' ? laspeyresResult.value : paascheResult.value,
  )

  const selectedPeriod = computed(() =>
    periods.value.find((p) => p.id === selectedPeriodId.value) ?? null,
  )

  const basePeriod = computed(() =>
    periods.value.find((p) => p.id === indexConfig.value.basePeriodId) ?? null,
  )

  const selectedContributions = computed(() => {
    if (!selectedPeriodId.value) return []
    return getContributionForPeriod(currentResult.value, categories.value, selectedPeriodId.value)
  })

  const selectedTotalChange = computed(() => getTotalChangeForPeriod(selectedContributions.value))

  const verifyReport = computed(() =>
    buildVerifyReport(
      periods.value,
      categories.value,
      priceMatrix.value,
      weightConfig.value,
      indexConfig.value.basePeriodId,
      indexConfig.value.formula,
      currentResult.value,
    ),
  )

  function exportBundleJSON() {
    downloadJSON(exportToJSON(toBundle()))
  }

  function exportResultCSV() {
    downloadCSV(
      exportIndexCSV(periods.value, categories.value, laspeyresResult.value, paascheResult.value),
    )
  }

  async function importJSONFile(file: File): Promise<boolean> {
    const text = await readFileAsText(file)
    const bundle = parseJSON(text)
    if (!bundle) return false
    loadFromBundle(bundle)
    return true
  }

  function resetToDefaults() {
    initWithDefaults()
  }

  return {
    periods,
    categories,
    priceMatrix,
    weightConfig,
    indexConfig,
    selectedPeriodId,
    processedData,
    normalizedWeights,
    laspeyresResult,
    paascheResult,
    currentResult,
    selectedPeriod,
    basePeriod,
    selectedContributions,
    selectedTotalChange,
    verifyReport,
    initWithDefaults,
    tryLoadLocalStorage,
    setBasePeriod,
    setFormula,
    setWeightMode,
    updatePrice,
    updateManualWeight,
    updateTurnoverShare,
    addCategory,
    removeCategory,
    addPeriod,
    removePeriod,
    selectPeriod,
    exportBundleJSON,
    exportResultCSV,
    importJSONFile,
    resetToDefaults,
    toBundle,
    loadFromBundle,
  }
})

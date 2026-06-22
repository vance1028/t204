<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <Toolbar />
    <div class="px-6 py-4 max-w-[1920px] mx-auto">
      <IndexCards />
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div class="xl:col-span-4 space-y-4">
          <DataTable />
          <WeightPanel />
          <VerifyPanel />
        </div>
        <div class="xl:col-span-8 space-y-4">
          <IndexTrendChart />
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NormalizedChart />
            <WeightChart />
          </div>
          <ContributionWaterfall />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useIndexStore } from '@/store/indexStore'
import Toolbar from '@/components/Toolbar.vue'
import IndexCards from '@/components/IndexCards.vue'
import DataTable from '@/components/DataTable.vue'
import WeightPanel from '@/components/WeightPanel.vue'
import VerifyPanel from '@/components/VerifyPanel.vue'
import IndexTrendChart from '@/components/IndexTrendChart.vue'
import NormalizedChart from '@/components/NormalizedChart.vue'
import WeightChart from '@/components/WeightChart.vue'
import ContributionWaterfall from '@/components/ContributionWaterfall.vue'

const store = useIndexStore()

onMounted(() => {
  store.tryLoadLocalStorage()
})
</script>

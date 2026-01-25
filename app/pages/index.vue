<template>
  <div class="simulator-page min-h-screen p-4 md:p-8">
    <div class="max-w-7xl mx-auto space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold">
          Coffee Extraction Simulator
        </h1>
        <p class="text-gray-500 mt-2">
          Visualize extraction kinetics in real-time using physics-based modeling
        </p>
      </div>

      <SimulatorPresetSelector />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Brew Parameters
              </h2>
            </template>
            <SimulatorBrewParameters />
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Dose Parameters
              </h2>
            </template>
            <SimulatorDoseParameters />
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Extraction Curve
              </h2>
            </template>
            <SimulatorExtractionChart />
          </UCard>

          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Results
              </h2>
            </template>
            <SimulatorExtractionResults />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

useSeoMeta({
  title: 'Coffee Extraction Simulator',
  description: 'Physics-based coffee extraction simulator using WebAssembly'
})

const store = useSimulatorStore()

onMounted(() => {
  store.initialize()
})
</script>

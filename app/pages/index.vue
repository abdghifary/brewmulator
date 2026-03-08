<template>
  <NuxtLayout name="dashboard">
    <!-- Navbar: Brewmulator title + color mode toggle -->
    <template #navbar>
      <UDashboardNavbar :toggle="false">
        <template #left>
          <UButton
            class="lg:hidden"
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            aria-label="Open sidebar"
            @click="sidebarOpen = !sidebarOpen"
          />
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-flask-conical"
              class="text-primary size-5"
            />
            <span class="font-semibold text-sm tracking-tight">Brewmulator</span>
          </div>
        </template>
        <template #right>
          <UColorModeButton />
        </template>
      </UDashboardNavbar>
    </template>

    <!-- Sidebar: Parameter controls -->
    <template #sidebar>
      <div class="p-4 space-y-6">
        <div>
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3"
          >
            Brew Parameters
          </h3>
          <SimulatorBrewParameters />
        </div>

        <USeparator />

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="store.recipe.method === 'v60'">
            <h3
              class="text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3"
            >
              Pour Schedule
            </h3>
            <SimulatorPourSchedule />
          </div>
        </Transition>

        <USeparator v-if="store.recipe.method === 'v60'" />

        <div>
          <h3
            class="text-xs font-semibold uppercase tracking-wider text-[var(--ui-text-muted)] mb-3"
          >
            Dose Parameters
          </h3>
          <SimulatorDoseParameters />
        </div>
      </div>
    </template>

    <!-- Default slot: Dock + Chart + Results -->
    <!-- <div class="p-6 space-y-6"> -->

    <LazySimulatorPresetSelector hydrate-on-visible />

    <UCard
      variant="outline"
      class="flex-shrink-0"
    >
      <template #header>
        <h2 class="text-lg font-semibold">
          Extraction Curve
        </h2>
      </template>
      <LazySimulatorExtractionChart hydrate-on-visible />
    </UCard>

    <SimulatorExtractionResults />

    <!-- </div> -->
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useSimulatorStore } from '~/stores/simulator'

definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'Coffee Extraction Simulator',
  description: 'Physics-based coffee extraction simulator using WebAssembly'
})

const store = useSimulatorStore()
const sidebarOpen = useState('sidebar-open', () => false)

onMounted(() => {
  store.initialize()
})
</script>

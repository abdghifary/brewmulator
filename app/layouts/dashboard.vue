<template>
  <div class="flex flex-col h-dvh overflow-hidden">
    <!-- Full-width top navbar, spans sidebar + panel columns -->
    <slot name="navbar" />

    <!-- Sidebar + Panel sit below the navbar -->
    <UDashboardGroup
      storage="cookie"
      storage-key="brewmulator"
      class="!top-(--ui-header-height)"
    >
      <UDashboardSidebar
        id="simulator-controls"
        v-model:open="sidebarOpen"
        resizable
        collapsible
        :min-size="22"
        :default-size="30"
        :max-size="40"
        :ui="{ root: 'min-h-0' }"
      >
        <slot name="sidebar" />
      </UDashboardSidebar>

      <UDashboardPanel :ui="{ root: 'min-h-0' }">
        <template #body>
          <slot />
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = useState('sidebar-open', () => false)
</script>

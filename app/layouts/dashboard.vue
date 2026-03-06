<template>
  <UDashboardGroup
    storage="cookie"
    storage-key="brewmulator"
  >
    <UDashboardSidebar
      id="simulator-controls"
      resizable
      collapsible
      :min-size="22"
      :default-size="30"
      :max-size="40"
    >
      <template #header>
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-flask-conical"
              class="text-primary size-5"
            />
            <span class="font-semibold text-sm">Brewmulator</span>
          </div>
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default>
        <slot name="sidebar" />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <slot name="navbar" />
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

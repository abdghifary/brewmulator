<template>
  <div
    v-if="store.recipe.method === 'v60'"
    class="pour-schedule"
  >
    <!-- Template Selector -->
    <div class="flex flex-wrap gap-2 mb-4">
      <UButton
        v-for="(template, i) in v60Templates"
        :key="template.name"
        size="sm"
        variant="outline"
        @click="onTemplateClick(i)"
      >
        {{ template.name }}
      </UButton>
    </div>

    <!-- Pour Steps -->
    <div class="space-y-3">
      <div
        v-for="(step, index) in store.pourSchedule"
        :key="index"
        class="flex items-center gap-2 p-2 border border-[var(--ui-border)] rounded-md transition-colors duration-150 hover:bg-[var(--ui-bg-elevated)]"
      >
        <!-- Bloom badge -->
        <UBadge
          v-if="step.isBloom"
          color="warning"
          variant="subtle"
          size="sm"
        >
          Bloom
        </UBadge>
        <span
          v-else
          class="text-xs text-[var(--ui-text-muted)] font-medium"
        >Pour {{ index + 1 }}</span>

        <!-- Start time -->
        <UFormField label="Time (s)">
          <UInput
            type="number"
            :model-value="step.startTime"
            :min="MIN_POUR_START_TIME"
            :disabled="step.isBloom"
            size="sm"
            class="w-20"
            @update:model-value="onUpdateStep(index, 'startTime', Number($event))"
          />
        </UFormField>

        <!-- Water grams -->
        <UFormField label="Water (g)">
          <UInput
            type="number"
            :model-value="step.waterGrams"
            :min="MIN_POUR_WATER_GRAMS"
            size="sm"
            class="w-20"
            @update:model-value="onUpdateStep(index, 'waterGrams', Number($event))"
          />
        </UFormField>

        <!-- Temperature per step -->
        <div class="flex items-center gap-1">
          <!-- BLOOM: always show temp input, no toggle -->
          <template v-if="step.isBloom">
            <UFormField label="Temp (°C)">
              <UInput
                type="number"
                :model-value="step.temperature ?? store.recipe.temperature"
                :min="MIN_TEMP_OVERRIDE"
                :max="MAX_TEMP_OVERRIDE"
                size="sm"
                class="w-20"
                @update:model-value="onUpdateStep(index, 'temperature', Number($event))"
              />
            </UFormField>
          </template>
          <!-- NON-BLOOM: keep existing override toggle (unchanged) -->
          <template v-else>
            <template v-if="step.temperature !== undefined">
              <UFormField label="Temp (°C)">
                <UInput
                  type="number"
                  :model-value="step.temperature"
                  :min="MIN_TEMP_OVERRIDE"
                  :max="MAX_TEMP_OVERRIDE"
                  size="sm"
                  class="w-20"
                  @update:model-value="onUpdateStep(index, 'temperature', Number($event))"
                />
              </UFormField>
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="ghost"
                title="Use kettle temperature"
                @click="onClearTemp(index)"
              />
            </template>
            <template v-else>
              <span class="text-xs text-[var(--ui-text-dimmed)]">{{ store.recipe.temperature }}°C</span>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                title="Override temperature for this pour"
                @click="onSetTempOverride(index)"
              >
                Override
              </UButton>
            </template>
          </template>
        </div>

        <!-- Remove button -->
        <UButton
          v-if="store.pourSchedule.length > 1 && !step.isBloom"
          icon="i-lucide-trash"
          size="sm"
          color="error"
          variant="ghost"
          @click="store.removePourStep(index)"
        />
      </div>
    </div>

    <!-- Add step button -->
    <div class="mt-4">
      <UButton
        size="sm"
        variant="outline"
        icon="i-lucide-plus"
        :disabled="store.pourSchedule.length >= MAX_POUR_STEPS"
        @click="onAddStep"
      >
        Add Pour
      </UButton>
    </div>

    <!-- Summary footer -->
    <div
      v-if="store.pourSchedule.length > 0"
      class="mt-4 pt-4 border-t border-[var(--ui-border)] text-sm text-[var(--ui-text-muted)] space-y-1"
    >
      <div class="flex justify-between">
        <span>Total water:</span>
        <span class="font-medium font-mono tabular-nums text-[var(--ui-text-highlighted)]">{{ totalWater }}g</span>
      </div>
      <div class="flex justify-between">
        <span>Pours:</span>
        <span class="font-medium font-mono tabular-nums text-[var(--ui-text-highlighted)]">{{ store.pourSchedule.length }}</span>
      </div>
      <div class="flex justify-between">
        <span>Total brew time:</span>
        <span class="font-medium font-mono tabular-nums text-[var(--ui-text-highlighted)]">{{ brewTimeDisplay }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="mt-4 text-sm text-[var(--ui-text-dimmed)] italic"
    >
      Select a template above or add pour steps manually.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { v60Templates, MAX_POUR_STEPS, MIN_POUR_WATER_GRAMS, MIN_POUR_START_TIME, MIN_TEMP_OVERRIDE, MAX_TEMP_OVERRIDE, T_AMBIENT, H_COOL } from '~/stores/simulator/constants'
import type { PourStep } from '~/stores/simulator/types'

const store = useSimulatorStore()

function onTemplateClick(index: number) {
  store.loadTemplate(index)
}

function onUpdateStep(index: number, field: keyof PourStep, value: number) {
  const currentStep = store.pourSchedule[index]
  if (!currentStep) return
  const updated = { ...currentStep, [field]: value }
  store.updatePourStep(index, updated)
}

function onAddStep() {
  const isEmpty = store.pourSchedule.length === 0
  const lastPour = store.pourSchedule[store.pourSchedule.length - 1]
  const nextTime = lastPour ? lastPour.startTime + 45 : 0

  // Newton's cooling: auto-calculate temp for non-bloom pours
  let temperature: number | undefined
  if (!isEmpty && lastPour) {
    const lastPourTemp = lastPour.temperature ?? store.recipe.temperature
    const dt = nextTime - lastPour.startTime
    temperature = T_AMBIENT + (lastPourTemp - T_AMBIENT) * Math.exp(-H_COOL * dt)
  }

  store.addPourStep({
    startTime: isEmpty ? 0 : nextTime,
    waterGrams: 60,
    isBloom: isEmpty,
    label: isEmpty ? 'Bloom' : undefined,
    ...(temperature !== undefined ? { temperature } : {})
  })
}

function onClearTemp(index: number) {
  const step = store.pourSchedule[index]
  if (!step) return
  const { temperature: _, ...rest } = step
  store.updatePourStep(index, rest as PourStep)
}

function onSetTempOverride(index: number) {
  const step = store.pourSchedule[index]
  if (!step) return
  store.updatePourStep(index, { ...step, temperature: store.recipe.temperature })
}

const totalWater = computed(() => store.pourSchedule.reduce((sum, s) => sum + s.waterGrams, 0))

const brewTimeDisplay = computed(() => {
  if (!store.pourSchedule.length) return '0s'
  return `${store.recipe.brewTime}s`
})
</script>

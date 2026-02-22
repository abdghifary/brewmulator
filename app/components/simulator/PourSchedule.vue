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
        class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-800 rounded-md"
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
          class="text-xs text-gray-500 font-medium"
        >Pour {{ index + 1 }}</span>

        <!-- Start time -->
        <UFormField label="Time (s)">
          <UInput
            type="number"
            :model-value="step.startTime"
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
            size="sm"
            class="w-20"
            @update:model-value="onUpdateStep(index, 'waterGrams', Number($event))"
          />
        </UFormField>

        <!-- Temperature override per step -->
        <div class="flex items-center gap-1">
          <template v-if="step.temperature !== undefined">
            <UFormField label="Temp (°C)">
              <UInput
                type="number"
                :model-value="step.temperature"
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
            <span class="text-xs text-gray-400">{{ store.recipe.temperature }}°C</span>
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
        </div>

        <!-- Remove button -->
        <UButton
          v-if="store.pourSchedule.length > 1"
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
      class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 space-y-1"
    >
      <div class="flex justify-between">
        <span>Total water:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ totalWater }}g</span>
      </div>
      <div class="flex justify-between">
        <span>Pours:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ store.pourSchedule.length }}</span>
      </div>
      <div class="flex justify-between">
        <span>Total brew time:</span>
        <span class="font-medium text-gray-900 dark:text-gray-100">{{ brewTimeDisplay }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="mt-4 text-sm text-gray-400 italic"
    >
      Select a template above or add pour steps manually.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimulatorStore } from '~/stores/simulator'
import { v60Templates, MAX_POUR_STEPS } from '~/stores/simulator/constants'
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
  const lastPour = store.pourSchedule[store.pourSchedule.length - 1]
  const nextTime = lastPour ? lastPour.startTime + 45 : 0
  store.addPourStep({ startTime: nextTime, waterGrams: 60, isBloom: false })
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
  const last = store.pourSchedule[store.pourSchedule.length - 1]
  if (!last) return '0s'
  return `${last.startTime + 45}s`
})
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-between border-t border-border-subtle px-4 py-2 text-sm"
  >
    <ul class="flex items-center gap-4">
      <li
        v-for="milestone in milestones"
        :key="milestone.label"
        class="flex items-center gap-1"
        :class="milestone.done ? 'text-ink' : 'text-ink-subtle'"
      >
        <span aria-hidden="true">{{ milestone.done ? '✓' : '○' }}</span>
        {{ milestone.label }}
      </li>
    </ul>

    <BaseButton variant="secondary" :disabled="issueCount === 0" @click="emit('open-issues')">
      Probleme ({{ issueCount }})
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '@shared/components/BaseButton.vue'

const props = defineProps({
  isSvgUploaded: { type: Boolean, required: true },
  areElementsClassified: { type: Boolean, required: true },
  isConfigured: { type: Boolean, required: true },
  isOrderSet: { type: Boolean, required: true },
  isValidated: { type: Boolean, required: true },
  issueCount: { type: Number, required: true },
})

const emit = defineEmits(['open-issues'])

/**
 * Builds the ordered checklist shown in the bar from the individual
 * milestone props, so the template stays a plain v-for.
 */
const milestones = computed(() => [
  { label: 'SVG hochgeladen', done: props.isSvgUploaded },
  { label: 'Elemente klassifiziert', done: props.areElementsClassified },
  { label: 'Rätsel/Dekoration konfiguriert', done: props.isConfigured },
  { label: 'Reihenfolge festgelegt', done: props.isOrderSet },
  { label: 'Validiert', done: props.isValidated },
])
</script>

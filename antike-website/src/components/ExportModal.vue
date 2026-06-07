<template>
  <BaseModal title="Export: riddle-config.json" width="60vw" height="80vh" @close="emit('close')">
    <div class="flex shrink-0 items-center justify-end gap-2 border-b border-gray-100 px-5 py-2">
      <BaseButton @click="copyToClipboard">
        {{ 'Kopieren' }}
      </BaseButton>
    </div>

    <div class="flex-1 overflow-auto px-5 py-4">
      <pre class="font-mono text-xs whitespace-pre text-gray-800">{{ jsonString }}</pre>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, inject } from 'vue'
import { ELEMENTS_DATA } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const emit = defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)

const config = computed(() => buildRiddleConfig(elementsData.value))
const jsonString = computed(() => JSON.stringify(config.value, null, 2))

function copyToClipboard() {
  navigator.clipboard.writeText(jsonString.value)
}

function buildRiddleConfig(elementsData) {
  const entries = Object.entries(elementsData)

  const isOrdered = true

  const nodes = {}

  for (const [id, entry] of entries) {
    if (entry.elementArt === 'Rätsel') {
      const riddle = {
        question: entry.riddle.question,
        answer: entry.riddle.answer,
        successText: entry.riddle.successText,
      }
      if (entry.riddle.iconFile) {
        riddle.icon = entry.riddle.iconFile.name
      }

      nodes[id] = {
        type: 'rätsel',
        unlockAfterId: entry.riddle.unlockAfterId,
        riddle,
      }
    } else if (entry.elementArt === 'Dekoration') {
      nodes[id] = {
        type: 'dekoration',
        linkedNodeId: entry.deco.linkedNodeId,
        stateBefore: entry.deco.stateBefore,
        stateAfter: entry.deco.stateAfter,
      }
    }
  }

  return {
    svgFile: 'background.svg',
    ordering: isOrdered ? 'ordered' : 'unordered',
    nodes,
  }
}
</script>

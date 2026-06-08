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
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'

const emit = defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)

const config = computed(() => buildRiddleConfig(elementsData.value))
const jsonString = computed(() => JSON.stringify(config.value, null, 2))

function copyToClipboard() {
  navigator.clipboard.writeText(jsonString.value)
}
</script>

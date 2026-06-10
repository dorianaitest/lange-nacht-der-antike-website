<template>
  <BaseModal title="Export: riddle-config.json" width="60vw" height="80vh" @close="emit('close')">
    <div class="flex shrink-0 items-center justify-end gap-2 border-b border-gray-100 px-5 py-2">
      <BaseButton @click="downloadZip">
        {{ 'Zip-Datei erstellen' }}
      </BaseButton>
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
import { PLAIN_SVG_TEXT, ELEMENTS_DATA, COMPLETION_MESSAGE, SELECTED_MODE } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'
import { exportZip } from '../utils/exportZip.js'

const emit = defineEmits(['close'])

const plainSvgText = inject(PLAIN_SVG_TEXT)
const elementsData = inject(ELEMENTS_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const selectedMode = inject(SELECTED_MODE)

const config = computed(() => buildRiddleConfig(elementsData.value, completionMessage.value, selectedMode.value))
const jsonString = computed(() => JSON.stringify(config.value, null, 2))

function copyToClipboard() {
  navigator.clipboard.writeText(jsonString.value)
}

function downloadZip() {
  exportZip(plainSvgText.value, elementsData.value, completionMessage.value, selectedMode.value)
}

</script>

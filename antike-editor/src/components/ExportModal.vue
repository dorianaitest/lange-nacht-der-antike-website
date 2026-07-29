<template>
  <BaseModal title="Export: riddle-config.json" width="60vw" height="80vh" @close="emit('close')">
    <p class="shrink-0 border-b border-border-subtle px-5 py-3 text-sm text-ink-muted">
      Exportiere die vollständige Konfiguration als ZIP-Datei für den Spielserver.
    </p>
    <div class="flex shrink-0 items-center justify-end gap-2 border-b border-border-subtle px-5 py-2">
      <BaseButton @click="downloadZip">
        {{ 'Zip-Datei erstellen' }}
      </BaseButton>
      <BaseButton variant="secondary" @click="copyToClipboard">
        {{ copyLabel }}
      </BaseButton>
    </div>

    <div class="flex-1 overflow-auto px-5 py-4">
      <pre class="code-preview">{{ jsonString }}</pre>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { PLAIN_SVG_TEXT, ELEMENTS_DATA, SELECTED_MODE, SYMBOL_POOL, FINAL_RIDDLE_ID, FINAL_RIDDLE_PENALTY, SYMBOL_PICKER_DATA, COMPLETION_MESSAGE, START_SCREEN_DATA, STYLING_CONFIG } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'
import { exportZip } from '../utils/exportZip.js'

const emit = defineEmits(['close'])

const plainSvgText = inject(PLAIN_SVG_TEXT)
const elementsData = inject(ELEMENTS_DATA)
const selectedMode = inject(SELECTED_MODE)
const symbolPool = inject(SYMBOL_POOL)
const finalRiddleId = inject(FINAL_RIDDLE_ID)
const finalRiddlePenalty = inject(FINAL_RIDDLE_PENALTY)

const symbolPickerData = inject(SYMBOL_PICKER_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const startScreenData = inject(START_SCREEN_DATA)
const stylingConfig = inject(STYLING_CONFIG)

const copyState = ref(null)

const copyLabel = computed(function () {
  if (copyState.value === 'success') return 'Kopiert! ✓'
  if (copyState.value === 'error') return 'Fehler!'
  return 'Kopieren'
})

const config = computed(() => buildRiddleConfig(elementsData.value, selectedMode.value, symbolPool.value, finalRiddleId.value, finalRiddlePenalty.value, symbolPickerData.value, completionMessage.value, startScreenData.value, stylingConfig))
const jsonString = computed(() => JSON.stringify(config.value, null, 2))

function resetCopyState() {
  copyState.value = null
}

function onCopySuccess() {
  copyState.value = 'success'
  setTimeout(resetCopyState, 2000)
}

function onCopyError() {
  copyState.value = 'error'
  setTimeout(resetCopyState, 2000)
}

function copyToClipboard() {
  navigator.clipboard.writeText(jsonString.value)
    .then(onCopySuccess)
    .catch(onCopyError)
}

function downloadZip() {
  exportZip(plainSvgText.value, elementsData.value, selectedMode.value, symbolPool.value, finalRiddleId.value, finalRiddlePenalty.value, symbolPickerData.value, completionMessage.value, startScreenData.value, stylingConfig)
}

</script>

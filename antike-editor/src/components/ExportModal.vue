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
    <div v-if="exportError" role="alert" class="shrink-0 border-b border-border-subtle px-5 py-2 text-sm text-danger-600">
      <p>{{ exportError }}</p>
      <ul v-if="exportDetails.length" class="mt-1 list-disc pl-5">
        <li v-for="message in exportDetails" :key="message">{{ message }}</li>
      </ul>
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
import BaseButton from '@shared/components/BaseButton.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'
import { exportZip } from '../utils/exportZip.js'
import { RiddleConfigError, summarizeMessages } from '@shared/validateRiddleConfig.js'

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
const exportError = ref(null)
const exportDetails = ref([])

/**
 * Button label for copy. Used mostly for DEV work
 */
const copyLabel = computed(function () {
  if (copyState.value === 'success') return 'Kopiert! ✓'
  if (copyState.value === 'error') return 'Fehler!'
  return 'Kopieren'
})
/**
 * The live riddle-config.json object for the current editor state.
 */
const config = computed(() => buildRiddleConfig(elementsData.value, selectedMode.value, symbolPool.value, finalRiddleId.value, finalRiddlePenalty.value, symbolPickerData.value, completionMessage.value, startScreenData.value, stylingConfig))

/**
 * Pretty-printed JSON config, shown in preview.
 */
const jsonString = computed(() => JSON.stringify(config.value, null, 2))

/**
 * Clears the feedback state
 */
function resetCopyState() {
  copyState.value = null
}

/**
 * Shows success label for 2 seconds after a successful clipboard copy.
 */
function onCopySuccess() {
  copyState.value = 'success'
  setTimeout(resetCopyState, 2000)
}

/**
 * Shows error label for 2 seconds after a failed clipboard copy.
 */
function onCopyError() {
  copyState.value = 'error'
  setTimeout(resetCopyState, 2000)
}

/**
 * Copies the config JSON to clipboard.
 */
function copyToClipboard() {
  navigator.clipboard.writeText(jsonString.value)
    .then(onCopySuccess)
    .catch(onCopyError)
}

/**
 * Builds and downloads the full project zip (SVG, config, icons/symbols).
 * Shows an error instead of downloading if the config fails the schema.
 */
async function downloadZip() {
  try {
    await exportZip(plainSvgText.value, elementsData.value, selectedMode.value, symbolPool.value, finalRiddleId.value, finalRiddlePenalty.value, symbolPickerData.value, completionMessage.value, startScreenData.value, stylingConfig)
    exportError.value = null
    exportDetails.value = []
  } catch (error) {
    console.error('Export failed:', error)
    // validateConfig already blocks author mistakes, so a failure here means the editor built a broken config
    exportError.value = 'Der Export wurde abgebrochen, weil der Editor eine fehlerhafte Konfiguration erzeugt hat. Das ist ein Fehler im Editor, bitte melde ihn mit diesen Angaben:'
    exportDetails.value = error instanceof RiddleConfigError ? summarizeMessages(error.messages) : [error.message]
  }
}

</script>

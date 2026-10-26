<template>
  <BaseModal title="Vorschau" width="90vw" height="90vh" @close="emit('close')">
    <GameScreen
      class="relative flex-1 overflow-hidden"
      :svgText="plainSvgText"
      :config="config"
      :symbolPool="symbolPool"
      :riddleIcons="riddleIcons"
    >
      <template #completion-actions>
        <BaseButton variant="secondary" @click="emit('close')">Vorschau schließen</BaseButton>
        <BaseButton variant="secondary" @click="emit('reset')">Neu starten</BaseButton>
      </template>
    </GameScreen>
  </BaseModal>
</template>

<script setup>
import { computed, inject } from 'vue'
import {
  ELEMENTS_DATA,
  SELECTED_MODE,
  SYMBOL_POOL,
  FINAL_RIDDLE_ID,
  FINAL_RIDDLE_PENALTY,
  SYMBOL_PICKER_DATA,
  COMPLETION_MESSAGE,
  START_SCREEN_DATA,
  STYLING_CONFIG,
  PLAIN_SVG_TEXT,
} from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import GameScreen from '@shared/components/GameScreen.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'

const emit = defineEmits(['close', 'reset'])

const elementsData = inject(ELEMENTS_DATA)
const selectedMode = inject(SELECTED_MODE)
const symbolPickerData = inject(SYMBOL_PICKER_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const startScreenData = inject(START_SCREEN_DATA)
const symbolPool = inject(SYMBOL_POOL)
const finalRiddleId = inject(FINAL_RIDDLE_ID)
const finalRiddlePenalty = inject(FINAL_RIDDLE_PENALTY)
const stylingConfig = inject(STYLING_CONFIG)
const plainSvgText = inject(PLAIN_SVG_TEXT)

/**
 * The live riddle-config.json object, rebuilt whenever the editor state changes.
 */
const config = computed(function () {
  return buildRiddleConfig(
    elementsData.value,
    selectedMode.value,
    symbolPool.value,
    finalRiddleId.value,
    finalRiddlePenalty.value,
    symbolPickerData.value,
    completionMessage.value,
    startScreenData.value,
    stylingConfig,
  )
})

/**
 * Maps each riddle id to its uploaded Standard mode icon preview.
 */
const riddleIcons = computed(function () {
  const icons = {}
  for (const [id, entry] of Object.entries(elementsData.value)) {
    if (entry.riddle?.iconPreview) icons[id] = entry.riddle.iconPreview
  }
  return icons
})
</script>

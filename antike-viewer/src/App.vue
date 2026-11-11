<template>
  <div class="app-root">
    <div v-if="state === 'loading'" class="overlay-center">
      <p class="text-ink-muted text-sm">Laden…</p>
    </div>

    <div v-else-if="state === 'error' && configErrors.length" class="overlay-center flex-col gap-3">
      <p class="text-ink text-base font-semibold">Das Rätsel ist fehlerhaft. Ein Admin muss ein korrigiertes Rätsel hochladen!</p>
      <ul class="max-w-2xl list-disc pl-5 text-left text-sm text-danger-600">
        <li v-for="message in configErrors" :key="message">{{ message }}</li>
      </ul>
    </div>

    <div v-else-if="state === 'error'" class="overlay-center">
      <p class="text-ink text-base font-semibold">Kein Rätsel gefunden. Es muss ein valides Rätsel von einem Admin hochgeladen werden!</p>
    </div>

    <GameScreen
      v-else-if="state === 'ready'"
      class="app-root"
      :svgText="svgText"
      :config="config"
      :symbolPool="symbolPool"
      :riddleIcons="riddleIcons"
      persistProgress
    >
      <template #completion-actions>
        <BaseButton variant="secondary" @click="isRestartConfirmOpen = true">Neu starten</BaseButton>
      </template>
    </GameScreen>

    <ConfirmDialog
      v-if="isRestartConfirmOpen"
      title="Spiel wirklich neu starten?"
      message="Deine Zeit und dein Fortschritt werden gelöscht."
      confirmLabel="Ja, neu starten"
      @confirm="restart"
      @cancel="isRestartConfirmOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GameScreen from '@shared/components/GameScreen.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import ConfirmDialog from '@shared/components/ConfirmDialog.vue'
import { loadRiddle } from './utils/loadRiddle.js'
import { RiddleConfigError, summarizeMessages } from '@shared/validateRiddleConfig.js'
import { clearProgress } from '@shared/gameProgress.js'

const state = ref('loading')
const configErrors = ref([])
const svgText = ref('')
const config = ref(null)
const iconMap = ref({})
const symbolPool = ref([])
const isRestartConfirmOpen = ref(false)

/**
 * Maps each riddle id to its Standard mode reward icon url.
 * @returns {Object<string, string>} riddle id to icon object URL.
 */
const riddleIcons = computed(function () {
  const icons = {}
  for (const [id, node] of Object.entries(config.value.nodes)) {
    if (node.riddle?.icon && iconMap.value[node.riddle.icon]) {
      icons[id] = iconMap.value[node.riddle.icon]
    }
  }
  return icons
})

// consider if needed / wanted. Maybe guard click.
/** Clears the saved progress and reloads the page to restart the game. */
function restart() {
  clearProgress()
  window.location.reload()
}

onMounted(async function () {
  try {
    const riddle = await loadRiddle('current/riddle.zip')

    svgText.value = riddle.svgText
    config.value = riddle.config
    iconMap.value = riddle.iconMap
    symbolPool.value = riddle.symbolPool

    state.value = 'ready'
  } catch (err) {
    console.error(err)
    if (err instanceof RiddleConfigError) configErrors.value = summarizeMessages(err.messages)
    state.value = 'error'
  }
})
</script>

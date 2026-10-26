<template>
  <div class="app-root">
    <div v-if="state === 'loading'" class="overlay-center">
      <p class="text-ink-muted text-sm">Laden…</p>
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
    >
      <template #completion-actions>
        <BaseButton variant="secondary" @click="restart">Neu starten</BaseButton>
      </template>
    </GameScreen>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GameScreen from '@shared/components/GameScreen.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import { loadRiddle } from './utils/loadRiddle.js'

const state = ref('loading')
const svgText = ref('')
const config = ref(null)
const iconMap = ref({})
const symbolPool = ref([])

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
/** Reloads the page to restart the game. */
function restart() {
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
    state.value = 'error'
  }
})
</script>

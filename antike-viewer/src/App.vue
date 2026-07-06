<template>
  <div class="app-root">
    <div v-if="state === 'loading'" class="overlay-center">
      <p class="text-ink-muted text-sm">Laden…</p>
    </div>

    <div v-else-if="state === 'error'" class="overlay-center">
      <p class="text-ink text-base font-semibold">Kein Rätsel gefunden. Es muss ein valides Rätsel von einem Admin hochgeladen werden!</p>
    </div>

    <div v-else-if="state === 'ready'" class="app-root">
      <div
        v-if="gameStarted && !allComplete"
        class="pointer-events-none absolute top-3 right-3 z-10 rounded-lg bg-white/90 px-3 py-1 font-mono text-sm text-ink-secondary shadow-sm"
      >
        {{ formatTime(elapsedSeconds) }}
      </div>

      <PreviewMap
        :svgText="svgText"
        :config="config"
        :completedRiddles="completedRiddles"
        @raetselClick="onRaetselClick"
      />

      <div v-if="!gameStarted" class="modal-overlay">
        <div class="modal-card">
          <div class="scroll-body">
            <h3 class="mb-3 text-lg font-semibold text-ink">
              {{ config.startScreen.titel }}
            </h3>
            <p v-if="config.startScreen.beschreibung" class="text-sm text-ink-secondary">
              {{ config.startScreen.beschreibung }}
            </p>
          </div>
          <div class="mt-5">
            <BaseButton @click="startGame">Spiel starten</BaseButton>
          </div>
        </div>
      </div>

      <div v-if="allComplete && !activeRiddle" class="modal-overlay">
        <div class="modal-card">
          <div class="scroll-body">
            <h3 class="mb-1 text-lg font-semibold text-ink">Alle Rätsel gelöst!</h3>
            <p v-if="config.completionMessage" class="mt-1 text-sm text-ink-muted">
              {{ config.completionMessage }}
            </p>
            <p class="mt-2 font-mono text-2xl font-semibold text-ink">
              {{ formatTime(elapsedSeconds) }}
            </p>
          </div>
          <!-- DELETE THE RESTART ?? -->
          <div class="mt-5 flex gap-2">
            <BaseButton variant="secondary" @click="restart">Neu starten</BaseButton>
          </div>
        </div>
      </div>

      <div v-if="penaltyActive" class="modal-overlay">
        <div class="flex w-96 flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-2xl">
          <p class="text-base font-semibold text-danger-600">Falsche Auswahl!</p>
          <p class="text-sm text-ink-muted">Du kannst es erneut versuchen in:</p>
          <p class="font-mono text-4xl font-semibold text-ink">
            {{ formatTime(penaltySecondsLeft) }}
          </p>
        </div>
      </div>

      <div
        v-if="activeRiddle"
        class="modal-overlay"
        @click.self="closeDialog"
      >
        <div class="flex w-96 max-h-[80vh] flex-col rounded-xl bg-white p-6 shadow-2xl">
          <div class="scroll-body">
            <div class="mb-5">
              <p class="mb-1 font-mono text-xs text-ink-subtle">
                {{ activeRiddle.id }}
              </p>
              <h3
                v-if="!(isAbschlussRaetsel && riddlePhase === 'symbol')"
                class="dialog-title"
              >
                {{ activeRiddle.riddle.question }}
              </h3>
            </div>

            <template v-if="isAbschlussRaetsel && riddlePhase === 'symbol'">
              <div v-if="answerState !== 'symbolCorrect'" class="form-group">
                <p
                  v-if="config.nodes[activeRiddle.id].symbolPicker && config.nodes[activeRiddle.id].symbolPicker.prompt"
                  class="text-sm text-ink-secondary"
                >
                  {{ config.nodes[activeRiddle.id].symbolPicker.prompt }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <img
                    v-for="entry in shuffledSymbolEntries"
                    :key="entry.riddleId"
                    :src="entry.preview"
                    alt="Symbol"
                    class="h-16 w-16 cursor-pointer rounded-lg border-2 border-transparent object-cover hover:border-primary-600"
                    @click="onSymbolClick(entry.riddleId)"
                  />
                </div>
              </div>
              <div v-else class="alert-success">
                <p>{{ config.nodes[activeRiddle.id].symbolPicker && config.nodes[activeRiddle.id].symbolPicker.successText }}</p>
              </div>
            </template>

            <template v-else>
              <div v-if="answerState !== 'correct'" class="flex flex-col gap-1">
                <label for="viewerAnswer" class="form-label">
                  Deine Antwort
                </label>
                <input
                  id="viewerAnswer"
                  v-model="answerInput"
                  type="text"
                  autofocus
                  class="w-full rounded-lg border px-3 py-2 text-sm"
                  :class="answerState === 'wrong' ? 'input-error' : 'input-default'"
                  placeholder="Antwort eingeben..."
                  @keydown.enter="submitAnswer"
                />
                <p v-if="answerState === 'wrong'" class="mt-0.5 text-xs text-danger-600">
                  Falsche Antwort. Versuch es nochmal!
                </p>
              </div>

              <div v-else class="alert-success">
                <img
                  v-if="activeRiddleIconPreview"
                  :src="activeRiddleIconPreview"
                  alt="Symbol"
                  class="mb-3 h-16 w-16 rounded-lg object-cover"
                />
                <p>{{ activeRiddle.riddle.successText }}</p>
              </div>
            </template>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <template v-if="isAbschlussRaetsel && riddlePhase === 'symbol'">
              <BaseButton variant="secondary" @click="closeDialog">Schließen</BaseButton>
              <BaseButton v-if="answerState === 'symbolCorrect'" @click="proceedToRiddle">
                Weiter
              </BaseButton>
            </template>

            <template v-else>
              <BaseButton
                v-if="!(allComplete && answerState === 'correct')"
                variant="secondary"
                @click="closeDialog"
              >
                Schließen
              </BaseButton>
              <BaseButton
                v-if="allComplete && answerState === 'correct'"
                @click="closeDialog"
              >
                Fertig!
              </BaseButton>
              <BaseButton v-if="answerState !== 'correct'" @click="submitAnswer">
                Prüfen
              </BaseButton>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import PreviewMap from './components/PreviewMap.vue'
import BaseButton from './components/BaseButton.vue'
import { loadRiddle } from './utils/loadRiddle.js'

// base variables [should structure editor variables likes this too]
const state = ref('loading')
const svgText = ref('')
const config = ref(null)
const iconMap = ref({})
const symbolPool = ref([])

// game progress
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const usedSymbolIndices = {}
const symbolSelectionPassed = reactive({})

// flow control
const gameStarted = ref(false)
const activeRiddle = ref(null)
const answerInput = ref('')
const answerState = ref('idle')
const riddlePhase = ref('riddle')
const shuffledSymbolEntries = ref([])

// timer
const elapsedSeconds = ref(0)
let intervalId = null

// penalty
const penaltyActive = ref(false)
const penaltySecondsLeft = ref(0)
let penaltyIntervalId = null

const raetselCount = computed(function () {
  if (!config.value) return 0 // async guard
  let count = 0
  for (const id in config.value.nodes) {
    if (config.value.nodes[id].type === 'rätsel') {
      count++
    }
  }
  return count
})

const allComplete = computed(function () {
  if (raetselCount.value === 0) return false
  let completedCount = 0
  for (const id in completedRiddles) {
    if (completedRiddles[id] === true) {
      completedCount++
    }
  }
  return completedCount === raetselCount.value
})

const isAbschlussRaetsel = computed(function () {
  if (!activeRiddle.value) return false
  if (!config.value) return false // async guard
  if (config.value.mode !== 'Symbolraetsel') return false
  return activeRiddle.value.id === config.value.abschlussRaetselId
})

const activeRiddleIconPreview = computed(function () {
  if (!activeRiddle.value) return null

  if (config.value.mode === 'Symbolraetsel') {
    if (isAbschlussRaetsel.value) return null
    return assignedSymbols[activeRiddle.value.id] || null
  }

  const node = config.value.nodes[activeRiddle.value.id]
  if (!node || !node.riddle || !node.riddle.icon) return null
  return iconMap.value[node.riddle.icon] || null
})

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return minutes + ':' + seconds
}

function startTimer() {
  clearInterval(intervalId)
  elapsedSeconds.value = 0
  intervalId = setInterval(function () {
    elapsedSeconds.value++
  }, 1000)
}

function stopTimer() {
  clearInterval(intervalId)
  intervalId = null
}

function closeDialog() {
  activeRiddle.value = null
  answerInput.value = ''
  answerState.value = 'idle'
  riddlePhase.value = 'riddle'
}

function startPenalty() {
  closeDialog()
  penaltySecondsLeft.value = config.value.abschlussRaetselPenalty
  penaltyActive.value = true

  penaltyIntervalId = setInterval(function () {
    penaltySecondsLeft.value--

    if (penaltySecondsLeft.value <= 0) {
      clearInterval(penaltyIntervalId)
      penaltyIntervalId = null
      penaltyActive.value = false

      onRaetselClick({
        id: config.value.abschlussRaetselId,
        riddle: config.value.nodes[config.value.abschlussRaetselId].riddle,
      })
    }
  }, 1000)
}

function startGame() {
  gameStarted.value = true
  startTimer()
}

// consider if needed / wanted. Maybe guard click.
function restart() {
  window.location.reload()
}

function onRaetselClick(riddleElement) {
  if (!gameStarted.value) return

  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'

  const isSpezialMode = config.value.mode === 'Symbolraetsel'
  const isAbschluss = riddleElement.id === config.value.abschlussRaetselId

  if (isSpezialMode && isAbschluss) {
    if (symbolSelectionPassed[riddleElement.id]) {
      riddlePhase.value = 'riddle'
      return
    }

    riddlePhase.value = 'symbol'

    if (!assignedSymbols[riddleElement.id]) {
      for (let i = 0; i < symbolPool.value.length; i++) {
        if (!usedSymbolIndices[i]) {
          usedSymbolIndices[i] = true
          assignedSymbols[riddleElement.id] = symbolPool.value[i].preview
          break
        }
      }
    }

    const entries = []
    for (const riddleId in assignedSymbols) {
      entries.push({ riddleId: riddleId, preview: assignedSymbols[riddleId] })
    }

    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = entries[i]
      entries[i] = entries[j]
      entries[j] = temp
    }

    shuffledSymbolEntries.value = entries
  }
}

function submitAnswer() {
  if (!activeRiddle.value) return
  if (answerState.value === 'correct') return

  const expected = activeRiddle.value.riddle.answer.trim().toLowerCase()
  const given = answerInput.value.trim().toLowerCase()

  if (given === expected) {
    answerState.value = 'correct'

    const solvedRiddleId = activeRiddle.value.id
    completedRiddles[solvedRiddleId] = true

    const isSpezialMode = config.value.mode === 'Symbolraetsel'
    const isAbschluss = solvedRiddleId === config.value.abschlussRaetselId

    if (isSpezialMode && symbolPool.value.length > 0 && !isAbschluss) {
      const available = []
      for (let i = 0; i < symbolPool.value.length; i++) {
        if (!usedSymbolIndices[i]) {
          available.push(i)
        }
      }

      if (available.length > 0) {
        const pick = available[Math.floor(Math.random() * available.length)]
        usedSymbolIndices[pick] = true
        assignedSymbols[solvedRiddleId] = symbolPool.value[pick].preview
      }
    }
  } else {
    answerState.value = 'wrong'
  }
}

function onSymbolClick(clickedRiddleId) {
  if (clickedRiddleId === config.value.abschlussRaetselId) {
    answerState.value = 'symbolCorrect'
    symbolSelectionPassed[activeRiddle.value.id] = true
  } else {
    startPenalty()
  }
}

function proceedToRiddle() {
  riddlePhase.value = 'riddle'
  answerState.value = 'idle'
}

watch(allComplete, function (done) {
  if (done) {
    stopTimer()
  }
})

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

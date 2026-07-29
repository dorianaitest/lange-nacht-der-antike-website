<template>
  <BaseModal title="Vorschau" width="90vw" height="90vh" @close="emit('close')">
    <div class="relative flex-1 overflow-hidden">
      <div
        v-if="isGameStarted && !isAllComplete"
        class="pointer-events-none absolute top-3 right-3 z-10 rounded-lg bg-white/90 px-3 py-1 font-mono text-sm text-ink-secondary shadow-sm"
      >
        {{ formatTime(elapsedSeconds) }}
      </div>

      <PreviewMap
        :config="config"
        :completedRiddles="completedRiddles"
        @riddleClick="onRiddleClick"
      />

      <div v-if="!isGameStarted" class="modal-overlay">
        <div class="modal-card">
          <div class="scroll-body">
            <h3 class="mb-3 text-lg font-semibold text-ink">{{ startScreenData.title }}</h3>
            <p v-if="startScreenData.description" class="text-sm text-ink-secondary">
              {{ startScreenData.description }}
            </p>
          </div>
          <div class="mt-5">
            <BaseButton @click="startGame">Spiel starten</BaseButton>
          </div>
        </div>
      </div>

      <div v-if="isAllComplete && !activeRiddle" class="modal-overlay">
        <div
          class="modal-card"
        >
          <div class="scroll-body">
            <h3 class="mb-1 text-lg font-semibold text-ink">Alle Rätsel gelöst!</h3>
            <p v-if="completionMessage" class="mt-1 text-sm text-ink-muted">{{ completionMessage }}</p>
            <p class="mt-2 font-mono text-2xl font-semibold text-ink">
              {{ formatTime(elapsedSeconds) }}
            </p>
          </div>
          <div class="mt-5 flex gap-2">
            <BaseButton variant="secondary" @click="emit('close')">Vorschau schließen</BaseButton>
            <BaseButton variant="secondary" @click="emit('reset')">Neu starten</BaseButton>
          </div>
        </div>
      </div>

      <div
        v-if="isPenaltyActive"
        class="modal-overlay"
      >
        <div
          class="flex w-96 flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-2xl"
        >
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
                v-if="!(isFinalRiddle && riddlePhase === 'symbol')"
                class="dialog-title"
              >
                {{ activeRiddle.riddle.question }}
              </h3>
            </div>

            <!-- Phase 1: Symbol selection (final riddle only) -->
            <template v-if="isFinalRiddle && riddlePhase === 'symbol'">
              <div v-if="answerState !== 'symbolCorrect'" class="form-group">
                <p v-if="symbolPickerData.prompt" class="text-sm text-ink-secondary">
                  {{ symbolPickerData.prompt }}
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
                <p>{{ symbolPickerData.successText }}</p>
              </div>
            </template>

            <!-- Phase 2 or regular riddle -->
            <template v-else>
              <div v-if="answerState !== 'correct'" class="flex flex-col gap-1">
                <label for="previewAnswer" class="form-label">
                  Deine Antwort
                </label>

                <input
                  id="previewAnswer"
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
                <p>
                  {{ activeRiddle.riddle.successText }}
                </p>
              </div>
            </template>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <!-- Phase 1 footer -->
            <template v-if="isFinalRiddle && riddlePhase === 'symbol'">
              <BaseButton variant="secondary" @click="closeDialog">Schließen</BaseButton>
              <BaseButton v-if="answerState === 'symbolCorrect'" @click="proceedToRiddle">
                Weiter
              </BaseButton>
            </template>

            <!-- Phase 2 / regular riddle footer -->
            <template v-else>
              <BaseButton variant="secondary" v-if="!(isAllComplete && answerState === 'correct')" @click="closeDialog">
                Schließen
              </BaseButton>
              <BaseButton v-if="isAllComplete && answerState === 'correct'" @click="closeDialog">
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
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch, inject, onUnmounted } from 'vue'
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
} from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import PreviewMap from './PreviewMap.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'
import { normalizeAnswer } from '../utils/normalizeAnswer.js'

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

// create the JSON file
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

// probalby need to refactor this --> lowkey breaking my brain how to reset this
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const usedSymbolIndices = {}
const symbolSelectionPassed = reactive({})

// gotta be an easier way
const riddleCount = computed(function () {
  let count = 0
  for (const id in config.value.nodes) {
    if (config.value.nodes[id].type === 'riddle') {
      count++
    }
  }
  return count
})

const isAllComplete = computed(function () {
  if (riddleCount.value === 0) return false
  let completedCount = 0
  for (const id in completedRiddles) {
    if (completedRiddles[id] === true) {
      completedCount++
    }
  }
  return completedCount === riddleCount.value
})

watch(isAllComplete, function (done) {
  if (done) {
    stopTimer()
  }
})

const elapsedSeconds = ref(0)
let intervalId = null

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
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

const isPenaltyActive = ref(false)
const penaltySecondsLeft = ref(0)
let penaltyIntervalId = null

function startPenalty() {
  closeDialog()
  penaltySecondsLeft.value = finalRiddlePenalty.value
  isPenaltyActive.value = true

  penaltyIntervalId = setInterval(function () {
    penaltySecondsLeft.value--

    if (penaltySecondsLeft.value <= 0) {
      clearInterval(penaltyIntervalId)
      penaltyIntervalId = null
      isPenaltyActive.value = false

      // reopen the final riddle dialog automatically since that's all that's left
      // maybe ask if we should allow players to revisit riddles to see their rewards (?)
      onRiddleClick({
        id: finalRiddleId.value,
        riddle: config.value.nodes[finalRiddleId.value].riddle,
      })
    }
  }, 1000)
}

const isGameStarted = ref(false)

function startGame() {
  isGameStarted.value = true
  startTimer()
}

onUnmounted(function () {
  stopTimer()
  clearInterval(penaltyIntervalId)
})

const activeRiddle = ref(null)
const answerInput = ref('')
const answerState = ref('idle')
const riddlePhase = ref('riddle')

const activeRiddleIconPreview = computed(function () {
  if (!activeRiddle.value) return null

  if (selectedMode.value === 'SymbolRiddle') {
    // final riddle Phase 2 has no symbol reward
    if (isFinalRiddle.value) return null
    return assignedSymbols[activeRiddle.value.id] || null
  }

  const entry = elementsData.value[activeRiddle.value.id]
  if (!entry || !entry.riddle) return null
  return entry.riddle.iconPreview || null
})

// true when the final riddle is active in Symbol Riddle mode: used for symbol grid
const isFinalRiddle = computed(function () {
  if (!activeRiddle.value) return false
  if (selectedMode.value !== 'SymbolRiddle') return false
  return activeRiddle.value.id === finalRiddleId.value
})

// holds the shuffled symbol entries for the final riddle grid
const shuffledSymbolEntries = ref([])

function onRiddleClick(riddleElement) {
  if (!isGameStarted.value) return

  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'

  if (selectedMode.value === 'SymbolRiddle' && riddleElement.id === finalRiddleId.value) {
    if (symbolSelectionPassed[riddleElement.id]) {
      riddlePhase.value = 'riddle'
      return
    }

    riddlePhase.value = 'symbol'

    // assign symbol to the final riddle if not yet done (it's the correct answer in the grid)
    if (!assignedSymbols[riddleElement.id]) {
      for (let i = 0; i < symbolPool.value.length; i++) {
        if (!usedSymbolIndices[i]) {
          usedSymbolIndices[i] = true
          assignedSymbols[riddleElement.id] = symbolPool.value[i].preview
          break
        }
      }
    }

    // shuffle all assigned symbols (including the final riddle's) into the grid
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

  const normalizedInput = normalizeAnswer(answerInput.value)

  let isCorrect = false
  for (const answer of activeRiddle.value.riddle.answers) {
    if (normalizeAnswer(answer) === normalizedInput) {
      isCorrect = true
      break
    }
  }

  if (isCorrect) {
    answerState.value = 'correct'

    const solvedRiddleId = activeRiddle.value.id
    completedRiddles[solvedRiddleId] = true

    // maybe I should block the preview if there aren't enough symbols (?)
    // final riddle gets its symbol pre-assigned in onRiddleClick so we skip it here
    if (
      selectedMode.value === 'SymbolRiddle' &&
      symbolPool.value.length > 0 &&
      solvedRiddleId !== finalRiddleId.value
    ) {
      // collect pool indices that haven't been drawn yet
      const available = []
      for (let i = 0; i < symbolPool.value.length; i++) {
        if (!usedSymbolIndices[i]) available.push(i)
      }
      if (available.length > 0) {
        // pick one at random and mark it as used so it won't appear again
        const pick = available[Math.floor(Math.random() * available.length)]
        usedSymbolIndices[pick] = true
        assignedSymbols[solvedRiddleId] = symbolPool.value[pick].preview
      }
    }
  } else {
    answerState.value = 'wrong'
  }
}

function onSymbolClick(riddleId) {
  if (riddleId === finalRiddleId.value) {
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

function closeDialog() {
  activeRiddle.value = null
  answerInput.value = ''
  answerState.value = 'idle'
  riddlePhase.value = 'riddle'
}
</script>

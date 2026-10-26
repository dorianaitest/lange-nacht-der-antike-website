<template>
  <div>
    <div
      v-if="isGameStarted && !isAllComplete"
      class="pointer-events-none absolute top-3 right-3 z-10 rounded-lg bg-white/90 px-3 py-1 font-mono text-sm text-ink-secondary shadow-sm"
    >
      {{ formatTime(elapsedSeconds) }}
    </div>

    <SvgGameMap
      :svgText="svgText"
      :config="config"
      :completedRiddles="completedRiddles"
      @riddleClick="onRiddleClick"
    />

    <div v-if="!isGameStarted" class="modal-overlay">
      <div class="modal-card">
        <div class="scroll-body">
          <h3 class="mb-3 text-lg font-semibold text-ink">
            {{ config.startScreen.title }}
          </h3>
          <p v-if="config.startScreen.description" class="text-sm text-ink-secondary">
            {{ config.startScreen.description }}
          </p>
        </div>
        <div class="mt-5">
          <BaseButton @click="startGame">Spiel starten</BaseButton>
        </div>
      </div>
    </div>

    <div v-if="isAllComplete && !activeRiddle" class="modal-overlay">
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
        <div class="mt-5 flex gap-2">
          <slot name="completion-actions" />
        </div>
      </div>
    </div>

    <div v-if="isPenaltyActive" class="modal-overlay">
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
              v-if="!(isFinalRiddle && riddlePhase === 'symbol')"
              class="dialog-title"
            >
              {{ activeRiddle.riddle.question }}
            </h3>
          </div>

          <!-- Phase 1: Symbol selection (final riddle only) -->
          <template v-if="isFinalRiddle && riddlePhase === 'symbol'">
            <div v-if="answerState !== 'symbolCorrect'" class="form-group">
              <p v-if="symbolPickerData?.prompt" class="text-sm text-ink-secondary">
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
              <p>{{ symbolPickerData?.successText }}</p>
            </div>
          </template>

          <!-- Phase 2 or regular riddle -->
          <template v-else>
            <div v-if="answerState !== 'correct'" class="flex flex-col gap-1">
              <label for="gameAnswer" class="form-label">
                Deine Antwort
              </label>
              <input
                id="gameAnswer"
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
          <template v-if="isFinalRiddle && riddlePhase === 'symbol'">
            <BaseButton variant="secondary" @click="closeDialog">Schließen</BaseButton>
            <BaseButton v-if="answerState === 'symbolCorrect'" @click="proceedToRiddle">
              Weiter
            </BaseButton>
          </template>

          <template v-else>
            <BaseButton
              v-if="!(isAllComplete && answerState === 'correct')"
              variant="secondary"
              @click="closeDialog"
            >
              Schließen
            </BaseButton>
            <BaseButton
              v-if="isAllComplete && answerState === 'correct'"
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
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import SvgGameMap from './SvgGameMap.vue'
import BaseButton from './BaseButton.vue'
import {
  isAnswerCorrect,
  formatTime,
  buildShuffledSymbolEntries,
  drawRandomSymbol,
  drawFinalRiddleSymbol,
} from '../gameLogic.js'

const props = defineProps({
  svgText: {
    type: String,
    required: true,
  },
  // the riddle-config.json shape
  config: {
    type: Object,
    required: true,
  },
  // SymbolRiddle reward symbols, [{preview: url}]
  symbolPool: {
    type: Array,
    default: () => [],
  },
  // Standard mode reward icons, {riddleId: url}
  riddleIcons: {
    type: Object,
    default: () => ({}),
  },
})

const DEFAULT_PENALTY_SECONDS = 30

// game progress
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const usedSymbolIndices = {}
const symbolSelectionPassed = reactive({})

// flow control
const isGameStarted = ref(false)
const activeRiddle = ref(null)
const answerInput = ref('')
const answerState = ref('idle')
const riddlePhase = ref('riddle')
const shuffledSymbolEntries = ref([])

// timer
const elapsedSeconds = ref(0)
let intervalId = null

// penalty
const isPenaltyActive = ref(false)
const penaltySecondsLeft = ref(0)
let penaltyIntervalId = null

/**
 * Counts riddle elements in the config
 * @returns {number} Total number of riddle elements.
 */
const riddleCount = computed(function () {
  let count = 0
  for (const id in props.config.nodes) {
    if (props.config.nodes[id].type === 'riddle') {
      count++
    }
  }
  return count
})

/**
 * Checks if every riddle has been completed.
 * @returns {boolean} True if all riddles are solved.
 */
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

/**
 * Checks if the config uses SymbolRiddle mode.
 * @returns {boolean} True if mode is 'SymbolRiddle'.
 */
const isSymbolRiddleMode = computed(function () {
  return props.config.mode === 'SymbolRiddle'
})

/**
 * Checks if element id is the final riddle.
 * @param {string} id - riddle element id
 * @returns {boolean} True if id is the final riddle.
 */
function isFinalRiddleId(id) {
  return id === props.config.finalRiddleId
}

/**
 * Checks if the open riddle is the final riddle in SymbolRiddle mode
 * @returns {boolean} True if the riddle is the final riddle.
 */
const isFinalRiddle = computed(function () {
  if (!activeRiddle.value) return false
  if (!isSymbolRiddleMode.value) return false
  return isFinalRiddleId(activeRiddle.value.id)
})

/**
 * Resolves the reward image for the active riddle: the drawn pool symbol in SymbolRiddle mode,
 * otherwise the riddle's own icon.
 * @returns {string|null} url of the image, or null if none.
 */
const activeRiddleIconPreview = computed(function () {
  if (!activeRiddle.value) return null

  if (isSymbolRiddleMode.value) {
    // final riddle Phase 2 has no symbol reward
    if (isFinalRiddle.value) return null
    return assignedSymbols[activeRiddle.value.id] || null
  }

  return props.riddleIcons[activeRiddle.value.id] || null
})

/**
 * Reads the symbol picker config for the active riddle, if any.
 * @returns {Object|null} Symbol picker data, or null.
 */
const symbolPickerData = computed(function () {
  if (!activeRiddle.value) return null
  return props.config.nodes[activeRiddle.value.id]?.symbolPicker || null
})

/** Starts the elapsed-time timer, resetting it to zero. */
function startTimer() {
  clearInterval(intervalId)
  elapsedSeconds.value = 0
  intervalId = setInterval(function () {
    elapsedSeconds.value++
  }, 1000)
}

/** Stops the elapsed-time timer. */
function stopTimer() {
  clearInterval(intervalId)
  intervalId = null
}

/** Closes the active riddle dialog and resets its input state. */
function closeDialog() {
  activeRiddle.value = null
  answerInput.value = ''
  answerState.value = 'idle'
  riddlePhase.value = 'riddle'
}

/** Closes the dialog and starts the final-riddle wrong-answer penalty countdown. */
function startPenalty() {
  closeDialog()
  penaltySecondsLeft.value = props.config.finalRiddlePenalty || DEFAULT_PENALTY_SECONDS
  isPenaltyActive.value = true

  penaltyIntervalId = setInterval(function () {
    penaltySecondsLeft.value--

    if (penaltySecondsLeft.value <= 0) {
      clearInterval(penaltyIntervalId)
      penaltyIntervalId = null
      isPenaltyActive.value = false

      // reopen the riddle dialog automatically since that's all that's left
      onRiddleClick({
        id: props.config.finalRiddleId,
        riddle: props.config.nodes[props.config.finalRiddleId].riddle,
      })
    }
  }, 1000)
}

/** Marks the game as started and starts the timer. */
function startGame() {
  isGameStarted.value = true
  startTimer()
}

/**
 * Assigns the next unused pool symbol to a riddle, once, for the final riddle's symbol-picker phase.
 * @param {string} riddleId - Riddle id to assign a symbol to.
 */
function assignFinalRiddleSymbol(riddleId) {
  if (assignedSymbols[riddleId]) return

  const symbol = drawFinalRiddleSymbol(props.symbolPool, usedSymbolIndices)
  if (symbol) assignedSymbols[riddleId] = symbol
}

/**
 * Opens a riddle's dialog, entering the symbol-picker phase first if it's the unsolved final riddle in SymbolRiddle mode.
 * @param {Object} riddleElement - Clicked riddle element ({id, riddle}).
 */
function onRiddleClick(riddleElement) {
  if (!isGameStarted.value) return

  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'

  if (!isSymbolRiddleMode.value || !isFinalRiddleId(riddleElement.id)) return

  if (symbolSelectionPassed[riddleElement.id]) {
    riddlePhase.value = 'riddle'
    return
  }

  riddlePhase.value = 'symbol'
  assignFinalRiddleSymbol(riddleElement.id)
  shuffledSymbolEntries.value = buildShuffledSymbolEntries(assignedSymbols)
}

/**
 * Assigns a random unused pool symbol to a riddle.
 * @param {string} riddleId - riddle id to assign a symbol to.
 */
function assignRandomSymbol(riddleId) {
  const symbol = drawRandomSymbol(props.symbolPool, usedSymbolIndices)
  if (symbol) assignedSymbols[riddleId] = symbol
}

/** Validates the current answer input and marks the riddle solved if correct. */
function submitAnswer() {
  if (!activeRiddle.value) return
  if (answerState.value === 'correct') return

  if (!isAnswerCorrect(activeRiddle.value.riddle, answerInput.value)) {
    answerState.value = 'wrong'
    return
  }

  answerState.value = 'correct'

  const solvedRiddleId = activeRiddle.value.id
  completedRiddles[solvedRiddleId] = true

  // final riddle gets its symbol pre-assigned in onRiddleClick so we skip it here
  if (isSymbolRiddleMode.value && props.symbolPool.length > 0 && !isFinalRiddleId(solvedRiddleId)) {
    assignRandomSymbol(solvedRiddleId)
  }
}

/**
 * Handles a symbol click during the final riddle's picker phase. Passes on the correct symbol, penalizes otherwise.
 * @param {string} clickedRiddleId - Riddle id of the clicked symbol.
 */
function onSymbolClick(clickedRiddleId) {
  if (isFinalRiddleId(clickedRiddleId)) {
    answerState.value = 'symbolCorrect'
    symbolSelectionPassed[activeRiddle.value.id] = true
  } else {
    startPenalty()
  }
}

/** Advances from the final riddle's symbol-picker phase to its question. */
function proceedToRiddle() {
  riddlePhase.value = 'riddle'
  answerState.value = 'idle'
}

/** Watches for the game to finish so that the timer is stopped */
watch(isAllComplete, function (done) {
  if (done) {
    stopTimer()
  }
})

onUnmounted(function () {
  stopTimer()
  clearInterval(penaltyIntervalId)
})
</script>

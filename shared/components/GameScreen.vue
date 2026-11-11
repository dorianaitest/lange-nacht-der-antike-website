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
          <BaseButton @click="isStartConfirmOpen = true">Spiel starten</BaseButton>
        </div>
      </div>
    </div>

    <ConfirmDialog
      v-if="isStartConfirmOpen"
      title="Bereit?"
      message="Starte erst, wenn die Betreuung das Startsignal gibt. Ab dann läuft die Zeit."
      confirmLabel="Ja, starten"
      cancelLabel="Noch nicht"
      @confirm="startGame"
      @cancel="isStartConfirmOpen = false"
    />

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
import ConfirmDialog from './ConfirmDialog.vue'
import {
  isAnswerCorrect,
  formatTime,
  buildShuffledSymbolEntries,
  drawRandomSymbol,
  drawFinalRiddleSymbol,
} from '../gameLogic.js'
import { saveProgress, loadProgress } from '../gameProgress.js'

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
  // save progress in localStorage and continue it after a reload (viewer only)
  persistProgress: {
    type: Boolean,
    default: false,
  },
})

const DEFAULT_PENALTY_SECONDS = 30

// game progress, kept in a saveable form: pool indices instead of object urls, timestamps instead of counters
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const symbolSelectionPassed = reactive({})
const startedAt = ref(null)
const finishedAt = ref(null)
const penaltyEndsAt = ref(null)

// flow control
const activeRiddle = ref(null)
const answerInput = ref('')
const answerState = ref('idle')
const riddlePhase = ref('riddle')
const shuffledSymbolEntries = ref([])
const isStartConfirmOpen = ref(false)

// clock that drives the timer and the penalty countdown
const now = ref(Date.now())
let tickIntervalId = null

/**
 * Checks if the player has confirmed the start screen.
 * @returns {boolean} True once the game has started.
 */
const isGameStarted = computed(function () {
  return startedAt.value !== null
})

/**
 * Computes the elapsed game time, frozen once the game is finished.
 * @returns {number} Whole seconds since the start.
 */
const elapsedSeconds = computed(function () {
  if (startedAt.value === null) return 0
  const endedAt = finishedAt.value ?? now.value
  return Math.floor((endedAt - startedAt.value) / 1000)
})

/**
 * Checks if the final-riddle penalty countdown is running.
 * @returns {boolean} True while the penalty is active.
 */
const isPenaltyActive = computed(function () {
  return penaltyEndsAt.value !== null
})

/**
 * Computes the remaining penalty time.
 * @returns {number} Whole seconds left, rounded up.
 */
const penaltySecondsLeft = computed(function () {
  if (penaltyEndsAt.value === null) return 0
  return Math.max(0, Math.ceil((penaltyEndsAt.value - now.value) / 1000))
})

/**
 * Maps each assigned pool index to its preview url.
 * @returns {Object<string, string>} Map of riddle id to symbol preview url.
 */
const assignedSymbolPreviews = computed(function () {
  const previews = {}
  for (const riddleId in assignedSymbols) {
    previews[riddleId] = props.symbolPool[assignedSymbols[riddleId]].preview
  }
  return previews
})

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
    return assignedSymbolPreviews.value[activeRiddle.value.id] || null
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

/** Starts updating the clock every second. */
function startClock() {
  clearInterval(tickIntervalId)
  now.value = Date.now()
  tickIntervalId = setInterval(tick, 1000)
}

/** Stops updating the clock. */
function stopClock() {
  clearInterval(tickIntervalId)
  tickIntervalId = null
}

/** Updates the clock and ends the penalty once its time is up. */
function tick() {
  now.value = Date.now()
  if (isPenaltyActive.value && now.value >= penaltyEndsAt.value) {
    endPenalty()
  }
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
  const penaltySeconds = props.config.finalRiddlePenalty || DEFAULT_PENALTY_SECONDS
  // restart the clock so its ticks line up with the penalty and it ends on time
  startClock()
  penaltyEndsAt.value = now.value + penaltySeconds * 1000
}

/** Ends the penalty and reopens the final riddle. */
function endPenalty() {
  penaltyEndsAt.value = null

  // reopen the riddle dialog automatically since that's all that's left
  onRiddleClick({
    id: props.config.finalRiddleId,
    riddle: props.config.nodes[props.config.finalRiddleId].riddle,
  })
}

/** Marks the game as started and starts the clock. */
function startGame() {
  isStartConfirmOpen.value = false
  startedAt.value = Date.now()
  startClock()
}

/**
 * Collects the pool indices already assigned to a riddle.
 * @returns {Object<number, boolean>} Map of used pool index to true.
 */
function getUsedSymbolIndices() {
  const used = {}
  for (const riddleId in assignedSymbols) {
    used[assignedSymbols[riddleId]] = true
  }
  return used
}

/**
 * Assigns the next unused pool symbol to a riddle, once, for the final riddle's symbol-picker phase.
 * @param {string} riddleId - Riddle id to assign a symbol to.
 */
function assignFinalRiddleSymbol(riddleId) {
  if (riddleId in assignedSymbols) return

  const poolIndex = drawFinalRiddleSymbol(props.symbolPool, getUsedSymbolIndices())
  if (poolIndex !== null) assignedSymbols[riddleId] = poolIndex
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
  shuffledSymbolEntries.value = buildShuffledSymbolEntries(assignedSymbolPreviews.value)
}

/**
 * Assigns a random unused pool symbol to a riddle.
 * @param {string} riddleId - riddle id to assign a symbol to.
 */
function assignRandomSymbol(riddleId) {
  const poolIndex = drawRandomSymbol(props.symbolPool, getUsedSymbolIndices())
  if (poolIndex !== null) assignedSymbols[riddleId] = poolIndex
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

/** Watches for the game to finish so that the timer is frozen */
watch(isAllComplete, function (done) {
  // a restored finished game keeps its saved finish time
  if (done && finishedAt.value === null) {
    finishedAt.value = Date.now()
    stopClock()
  }
})

/**
 * Collects the saveable game progress.
 * @returns {Object} progress in the shape gameProgress.js stores.
 */
function getProgress() {
  return {
    startedAt: startedAt.value,
    finishedAt: finishedAt.value,
    penaltyEndsAt: penaltyEndsAt.value,
    completedRiddles: completedRiddles,
    assignedSymbols: assignedSymbols,
    symbolSelectionPassed: symbolSelectionPassed,
  }
}

/** Continues a saved game, if there is one for this config. */
function restoreProgress() {
  const saved = loadProgress(props.config, Date.now())
  if (saved === null) return

  Object.assign(completedRiddles, saved.completedRiddles)
  Object.assign(assignedSymbols, saved.assignedSymbols)
  Object.assign(symbolSelectionPassed, saved.symbolSelectionPassed)
  startedAt.value = saved.startedAt
  finishedAt.value = saved.finishedAt

  // a penalty that ran out while the page was closed just ends, the player is back on the map
  if (saved.penaltyEndsAt !== null && saved.penaltyEndsAt > Date.now()) {
    penaltyEndsAt.value = saved.penaltyEndsAt
  }

  // shortcut: a restored penalty may end up to 1s late since ticks are not aligned to it, fine for a countdown
  if (finishedAt.value === null) startClock()
}

if (props.persistProgress) {
  restoreProgress()

  watch(
    getProgress,
    function (progress) {
      if (progress.startedAt !== null) saveProgress(props.config, progress)
    },
    { deep: true },
  )
}

onUnmounted(function () {
  stopClock()
})
</script>

<template>
  <BaseModal title="Vorschau" width="90vw" height="90vh" @close="emit('close')">
    <div class="relative flex-1 overflow-hidden">
      <div
        v-if="!allComplete"
        class="pointer-events-none absolute top-3 right-3 z-10 rounded-lg bg-white/90 px-3 py-1 font-mono text-sm text-gray-700 shadow-sm"
      >
        {{ formatTime(elapsedSeconds) }}
      </div>

      <PreviewMap
        :config="config"
        :completedRiddles="completedRiddles"
        @raetselClick="onRaetselClick"
      />

      <div v-if="allComplete && !activeRiddle" class="absolute inset-0 flex items-center justify-center bg-black/50">
        <div
          class="flex w-96 max-h-[80vh] flex-col items-center rounded-xl bg-white p-8 text-center shadow-2xl"
        >
          <div class="min-h-0 flex-1 overflow-y-auto">
            <h3 class="mb-1 text-lg font-semibold text-gray-900">Alle Rätsel gelöst!</h3>
            <p v-if="completionMessage" class="mt-1 text-sm text-gray-500">{{ completionMessage }}</p>
            <p class="mt-2 font-mono text-2xl font-semibold text-gray-800">
              {{ formatTime(elapsedSeconds) }}
            </p>
          </div>
          <div class="mt-5 flex gap-2">
            <BaseButton @click="emit('close')">Vorschau schließen</BaseButton>
            <BaseButton @click="emit('reset')">Neu starten</BaseButton>
          </div>
        </div>
      </div>

      <div
        v-if="penaltyActive"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
      >
        <div
          class="flex w-96 flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-2xl"
        >
          <p class="text-base font-semibold text-red-600">Falsche Auswahl!</p>
          <p class="text-sm text-gray-500">Du kannst es erneut versuchen in:</p>
          <p class="font-mono text-4xl font-semibold text-gray-800">
            {{ formatTime(penaltySecondsLeft) }}
          </p>
        </div>
      </div>

      <div
        v-if="activeRiddle"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
        @click.self="closeDialog"
      >
        <div class="flex w-96 max-h-[80vh] flex-col rounded-xl bg-white p-6 shadow-2xl">
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div class="mb-5">
              <p class="mb-1 font-mono text-xs text-gray-400">
                {{ activeRiddle.id }}
              </p>

              <h3
                v-if="!(isAbschlussRaetsel && riddlePhase === 'symbol')"
                class="text-base font-semibold text-gray-900"
              >
                {{ activeRiddle.riddle.question }}
              </h3>
            </div>

            <!-- Phase 1: Symbol selection (AbschlussRätsel only) -->
            <template v-if="isAbschlussRaetsel && riddlePhase === 'symbol'">
              <div v-if="answerState !== 'symbolCorrect'" class="flex flex-col gap-2">
                <p v-if="symbolPickerData.prompt" class="text-sm text-gray-700">
                  {{ symbolPickerData.prompt }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <img
                    v-for="entry in shuffledSymbolEntries"
                    :key="entry.riddleId"
                    :src="entry.preview"
                    alt="Symbol"
                    class="h-16 w-16 cursor-pointer rounded-lg border-2 border-transparent object-cover hover:border-blue-400"
                    @click="onSymbolClick(entry.riddleId)"
                  />
                </div>
              </div>
              <div v-else class="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <p class="text-sm text-green-800">{{ symbolPickerData.successText }}</p>
              </div>
            </template>

            <!-- Phase 2 or regular riddle -->
            <template v-else>
              <div v-if="answerState !== 'correct'" class="flex flex-col gap-1">
                <label for="previewAnswer" class="text-sm font-medium text-gray-700">
                  Deine Antwort
                </label>

                <input
                  id="previewAnswer"
                  v-model="answerInput"
                  type="text"
                  autofocus
                  class="w-full rounded-lg border px-3 py-2 text-sm"
                  :class="answerState === 'wrong' ? 'border-red-400' : 'border-gray-300'"
                  placeholder="Antwort eingeben..."
                  @keydown.enter="submitAnswer"
                />

                <p v-if="answerState === 'wrong'" class="mt-0.5 text-xs text-red-600">
                  Falsche Antwort. Versuch es nochmal!
                </p>
              </div>

              <div v-else class="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <img
                  v-if="activeRiddleIconPreview"
                  :src="activeRiddleIconPreview"
                  alt="Symbol"
                  class="mb-3 h-16 w-16 rounded-lg object-cover"
                />
                <p class="text-sm text-green-800">
                  {{ activeRiddle.riddle.successText }}
                </p>
              </div>
            </template>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <!-- Phase 1 footer -->
            <template v-if="isAbschlussRaetsel && riddlePhase === 'symbol'">
              <BaseButton @click="closeDialog">Schließen</BaseButton>
              <BaseButton v-if="answerState === 'symbolCorrect'" @click="proceedToRiddle">
                Weiter
              </BaseButton>
            </template>

            <!-- Phase 2 / regular riddle footer -->
            <template v-else>
              <BaseButton v-if="!(allComplete && answerState === 'correct')" @click="closeDialog">
                Schließen
              </BaseButton>
              <BaseButton v-if="allComplete && answerState === 'correct'" @click="closeDialog">
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
import { ref, reactive, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import {
  ELEMENTS_DATA,
  SELECTED_MODE,
  SYMBOL_POOL,
  ABSCHLUSS_RAETSEL_ID,
  ABSCHLUSS_PENALTY,
  SYMBOL_PICKER_DATA,
  COMPLETION_MESSAGE,
} from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import PreviewMap from './PreviewMap.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'

const emit = defineEmits(['close', 'reset'])

const elementsData = inject(ELEMENTS_DATA)
const selectedMode = inject(SELECTED_MODE)
const symbolPickerData = inject(SYMBOL_PICKER_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const symbolPool = inject(SYMBOL_POOL)
const abschlussRaetselId = inject(ABSCHLUSS_RAETSEL_ID)
const abschlussRaetselPenalty = inject(ABSCHLUSS_PENALTY)

// create the JSON file
const config = computed(function () {
  return buildRiddleConfig(
    elementsData.value,
    selectedMode.value,
    symbolPool.value,
    abschlussRaetselId.value,
    abschlussRaetselPenalty.value,
    symbolPickerData.value,
    completionMessage.value,
  )
})

// probalby need to refactor this --> lowkey breaking my brain how to reset this
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const usedSymbolIndices = {}
const symbolSelectionPassed = reactive({})

// gotta be an easier way
const raetselCount = computed(function () {
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

watch(allComplete, function (done) {
  if (done) {
    stopTimer()
  }
})

const elapsedSeconds = ref(0)
let intervalId = null

function formatTime(s) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return m + ':' + sec
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

const penaltyActive = ref(false)
const penaltySecondsLeft = ref(0)
let penaltyIntervalId = null

function startPenalty() {
  closeDialog()
  penaltySecondsLeft.value = abschlussRaetselPenalty.value
  penaltyActive.value = true

  penaltyIntervalId = setInterval(function () {
    penaltySecondsLeft.value--

    if (penaltySecondsLeft.value <= 0) {
      clearInterval(penaltyIntervalId)
      penaltyIntervalId = null
      penaltyActive.value = false

      // reopen the AbschlussRätsel dialog automatically since that's all that's left
      // maybe ask if we should allow players to revisit riddles to see their rewards (?)
      onRaetselClick({
        id: abschlussRaetselId.value,
        riddle: config.value.nodes[abschlussRaetselId.value].riddle,
      })
    }
  }, 1000)
}

onMounted(startTimer)
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

  if (selectedMode.value === 'Spezial') {
    // AbschlussRätsel Phase 2 has no symbol reward
    if (isAbschlussRaetsel.value) return null
    return assignedSymbols[activeRiddle.value.id] || null
  }

  const entry = elementsData.value[activeRiddle.value.id]
  if (!entry || !entry.riddle) return null
  return entry.riddle.iconPreview || null
})

// true when AbschlussRätsel in Spezial mode: used for symbol grid
const isAbschlussRaetsel = computed(function () {
  if (!activeRiddle.value) return false
  if (selectedMode.value !== 'Spezial') return false
  return activeRiddle.value.id === abschlussRaetselId.value
})

// holds the shuffled symbol entries for the AbschlussRätsel grid
const shuffledSymbolEntries = ref([])

function onRaetselClick(riddleElement) {
  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'

  if (selectedMode.value === 'Spezial' && riddleElement.id === abschlussRaetselId.value) {
    if (symbolSelectionPassed[riddleElement.id]) {
      riddlePhase.value = 'riddle'
      return
    }

    riddlePhase.value = 'symbol'

    // assign symbol to AbschlussRätsel if not yet done (it's the correct answer in the grid)
    if (!assignedSymbols[riddleElement.id]) {
      for (let i = 0; i < symbolPool.value.length; i++) {
        if (!usedSymbolIndices[i]) {
          usedSymbolIndices[i] = true
          assignedSymbols[riddleElement.id] = symbolPool.value[i].preview
          break
        }
      }
    }

    // shuffle all assigned symbols (including AbschlussRätsel's) into the grid
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

    // maybe I should block the preview if there aren't enough symbols (?)
    // AbschlussRätsel gets its symbol pre-assigned in onRaetselClick so we skip it here
    if (
      selectedMode.value === 'Spezial' &&
      symbolPool.value.length > 0 &&
      solvedRiddleId !== abschlussRaetselId.value
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
  if (riddleId === abschlussRaetselId.value) {
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

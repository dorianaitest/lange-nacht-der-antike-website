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

      <div v-if="allComplete" class="absolute inset-0 flex items-center justify-center bg-black/50">
        <div
          class="flex w-96 flex-col items-center gap-5 rounded-xl bg-white p-8 text-center shadow-2xl"
        >
          <div>
            <h3 class="mb-1 text-lg font-semibold text-gray-900">Alle Rätsel gelöst!</h3>
            <p class="text-sm text-gray-500">
              {{
                config.completionMessage ||
                'Du hast alle ' + raetselCount + ' Rätsel dieser Vorschau abgeschlossen.'
              }}
            </p>
            <p class="mt-2 font-mono text-2xl font-semibold text-gray-800">
              {{ formatTime(elapsedSeconds) }}
            </p>
          </div>
          <div class="flex gap-2">
            <BaseButton @click="emit('close')">Vorschau schließen</BaseButton>
            <BaseButton @click="emit('reset')">Neu starten</BaseButton>
          </div>
        </div>
      </div>

      <div
        v-if="activeRiddle"
        class="absolute inset-0 flex items-center justify-center bg-black/40"
        @click.self="closeDialog"
      >
        <div class="flex w-96 flex-col gap-5 rounded-xl bg-white p-6 shadow-2xl">
          <div>
            <p class="mb-1 font-mono text-xs text-gray-400">
              {{ activeRiddle.id }}
            </p>

            <h3 class="text-base font-semibold text-gray-900">
              {{ activeRiddle.riddle.question }}
            </h3>
          </div>

          <div v-if="answerState !== 'correct'" class="flex flex-col gap-1">
            <template v-if="!isAbschlussRaetsel">
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
            </template>

            <template v-else>
              <div class="flex flex-wrap gap-2">
                <img
                  v-for="entry in assignedSymbolEntries"
                  :key="entry.riddleId"
                  :src="entry.preview"
                  alt="Symbol"
                  class="h-16 w-16 cursor-pointer rounded-lg border-2 border-transparent object-cover hover:border-blue-400"
                  @click="onSymbolClick(entry.riddleId)"
                />
              </div>
            </template>

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

          <div class="flex justify-end gap-2">
            <BaseButton @click="closeDialog">Schließen</BaseButton>

            <BaseButton
              v-if="answerState !== 'correct' && !isAbschlussRaetsel"
              @click="submitAnswer"
            >
              Prüfen
            </BaseButton>
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
  COMPLETION_MESSAGE,
  SELECTED_MODE,
  SYMBOL_POOL,
  ABSCHLUSS_RAETSEL_ID,
} from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import PreviewMap from './PreviewMap.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'

const emit = defineEmits(['close', 'reset'])

const elementsData = inject(ELEMENTS_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const selectedMode = inject(SELECTED_MODE)
const symbolPool = inject(SYMBOL_POOL)
const abschlussRaetselId = inject(ABSCHLUSS_RAETSEL_ID)

// create the JSON file
const config = computed(function () {
  return buildRiddleConfig(
    elementsData.value,
    completionMessage.value,
    selectedMode.value,
    symbolPool.value,
    abschlussRaetselId.value,
  )
})

// probalby need to refactor this --> lowkey breaking my brain how to reset this
const completedRiddles = reactive({})
const assignedSymbols = reactive({})
const usedSymbolIndices = {}

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
    closeDialog()
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

onMounted(startTimer)
onUnmounted(stopTimer)

const activeRiddle = ref(null)
const answerInput = ref('')
const answerState = ref('idle')

const activeRiddleIconPreview = computed(function () {
  if (!activeRiddle.value) return null

  // show the randomly assigned symbol instead of the per-riddle icon
  if (selectedMode.value === 'Spezial') {
    return assignedSymbols[activeRiddle.value.id] || null //this safeguard can be deleted later
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

// simplifies v-for iteration
const assignedSymbolEntries = computed(function () {
  const entries = []
  for (const riddleId in assignedSymbols) {
    entries.push({ riddleId: riddleId, preview: assignedSymbols[riddleId] })
  }
  return entries
})

function onRaetselClick(riddleElement) {
  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'

  // assigns last symbol to the abschlussRätsel immediately
  if (
    selectedMode.value === 'Spezial' &&
    riddleElement.id === abschlussRaetselId.value &&
    !assignedSymbols[riddleElement.id]
  ) {
    for (let i = 0; i < symbolPool.value.length; i++) {
      if (!usedSymbolIndices[i]) {
        usedSymbolIndices[i] = true
        assignedSymbols[riddleElement.id] = symbolPool.value[i].preview
        break
      }
    }
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
    answerState.value = 'correct'
    completedRiddles[activeRiddle.value.id] = true
  } else {
    answerState.value = 'wrong'
  }
}

function closeDialog() {
  activeRiddle.value = null
  answerInput.value = ''
  answerState.value = 'idle'
}
</script>

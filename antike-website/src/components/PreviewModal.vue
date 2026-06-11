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
        @raetsel-click="onRaetselClick"
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

          <div class="flex justify-end gap-2">
            <BaseButton @click="closeDialog">Schließen</BaseButton>

            <BaseButton v-if="answerState !== 'correct'" @click="submitAnswer"> Prüfen </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { ELEMENTS_DATA, COMPLETION_MESSAGE, SELECTED_MODE, SYMBOL_POOL } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import PreviewMap from './PreviewMap.vue'
import { buildRiddleConfig } from '../utils/buildRiddleConfig.js'

const emit = defineEmits(['close', 'reset'])

const elementsData = inject(ELEMENTS_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)
const selectedMode = inject(SELECTED_MODE)
const symbolPool = inject(SYMBOL_POOL)

// create the JSON file
const config = computed(function () {
  return buildRiddleConfig(elementsData.value, completionMessage.value, selectedMode.value, symbolPool.value)
})

// probalby need to refactor this --> lowkey breaking my brain how to reset this
const completedRiddles = reactive({})

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

  const entry = elementsData.value[activeRiddle.value.id]
  if (!entry) return null

  if (!entry.riddle) return null

  return entry.riddle.iconPreview || null
})

function onRaetselClick(riddleElement) {
  activeRiddle.value = {
    id: riddleElement.id,
    riddle: riddleElement.riddle,
  }

  answerInput.value = ''
  answerState.value = 'idle'
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

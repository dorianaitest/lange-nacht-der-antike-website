<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
    <template v-if="entry">
      <div class="flex shrink-0 items-center justify-between px-6 pt-6 pb-0">
        <h2 class="truncate text-lg font-semibold text-gray-900" :title="selectedId">
          {{ selectedId }}
        </h2>
        <button
          class="cursor-pointer text-xl text-gray-400 hover:text-gray-600"
          @click="setSelectedElement(null)"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
        <!-- Rätsel-Template -->
        <template v-if="entry.elementArt === 'Rätsel'">
          <div class="flex flex-col gap-4">
            <p class="text-xs text-gray-400">* Pflichtfeld</p>

            <div class="flex flex-col gap-2">
              <label for="riddleQuestion" class="text-sm font-medium text-gray-700"> Frage* </label>

              <textarea
                id="riddleQuestion"
                v-model="riddle.question"
                rows="3"
                required
                class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                placeholder="Rätsel oder Frage eingeben..."
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="riddleAnswer" class="text-sm font-medium text-gray-700"> Antwort* </label>

              <textarea
                id="riddleAnswer"
                v-model="riddle.answer"
                rows="3"
                required
                class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                placeholder="Korrekte Antwort..."
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="riddleSuccess" class="text-sm font-medium text-gray-700">
                Erfolgstext*
              </label>

              <textarea
                id="riddleSuccess"
                v-model="riddle.successText"
                rows="3"
                required
                class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                placeholder="Text nach richtiger Antwort..."
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700">Symbol</label>

              <input
                ref="iconInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="iconSelected"
              />

              <div v-if="riddle.iconPreview">
                <img
                  :src="riddle.iconPreview"
                  alt="Symbol Vorschau"
                  class="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
              </div>

              <BaseButton @click="openIconDialogue">
                {{ riddle.iconPreview ? 'Symbol ersetzen' : 'Symbol hochladen' }}
              </BaseButton>
            </div>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-gray-400">NOTHING YET.</p>
        </template>
      </div>
    </template>

    <!-- When no Element selected -->
    <template v-else>
      <div class="flex flex-1 items-center justify-center px-6">
        <p class="text-center text-sm text-gray-400">
          Klicke auf ein Element der Karte, um es zu konfigurieren
        </p>
      </div>
    </template>
  </aside>
</template>

<script setup>
//computed allows to recalculate easily once selectedId changes
import { ref, computed, inject } from 'vue'
import { SELECTED_ELEMENT_ID, SET_SELECTED_ELEMENT, ELEMENTS_DATA } from '../injectionKeys.js'
import BaseButton from './BaseButton.vue'

const selectedId = inject(SELECTED_ELEMENT_ID)
const setSelectedElement = inject(SET_SELECTED_ELEMENT)
const elementsData = inject(ELEMENTS_DATA)

const iconInput = ref(null)

const entry = computed(function () {
  if (!selectedId.value) return null

  return elementsData.value[selectedId.value]
})

const riddle = computed(function () {
  return entry.value?.riddle
})

function openIconDialogue() {
  iconInput.value.click()
}

function iconSelected(e) {
  const file = e.target.files?.[0]

  const reader = new FileReader()

  reader.readAsDataURL(file)

  reader.onload = function (e) {
    riddle.value.iconPreview = e.target.result
    riddle.value.iconFile = file
  }

  e.target.value = ''
}
</script>

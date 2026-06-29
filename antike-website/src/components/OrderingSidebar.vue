<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
    <div class="flex shrink-0 items-center justify-between px-6 pt-6 pb-0">
      <h2 class="text-lg font-semibold text-gray-900">Reihenfolge</h2>
      <button
        class="cursor-pointer text-xl text-gray-400 hover:text-gray-600"
        aria-label="Schließen"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <section v-if="selectedMode === 'Symbolraetsel' && raetselEntries.length > 0" class="mt-6">
        <p class="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
          Abschluss Rätsel
        </p>
        <p class="mb-3 text-sm text-gray-500">
          Dieses Rätsel zeigt dem Spieler alle Symbole und fragt, welches er noch nicht gesehen hat.
        </p>
        <select v-model="abschlussRaetselId" :class="SELECT_CLASS">
          <option :value="null">Keines</option>
          <option v-for="[id] in raetselEntries" :key="id" :value="id">{{ id }}</option>
        </select>

        <div class="mt-3 flex items-center gap-3">
          <p class="text-sm text-gray-500">Zeitstrafe bei falscher Antwort:</p>
          <select v-model="abschlussRaetselPenalty" :class="SELECT_CLASS">
            <option :value="15">15s</option>
            <option :value="30">30s</option>
            <option :value="45">45s</option>
            <option :value="60">60s</option>
            <option :value="90">90s</option>
          </select>
        </div>
      </section>

      <section class="mt-6">
        <p class="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">Freischaltung</p>

        <p v-if="raetselEntries.length === 0" class="text-sm text-gray-400">
          Noch keine Rätsel-Elemente vorhanden.
        </p>

        <div v-else class="flex flex-col gap-2">
          <template v-for="[id, entry] in raetselEntries" :key="id">
            <div
              v-if="id !== abschlussRaetselId"
              class="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <span class="truncate font-mono text-sm text-gray-800" :title="id">
                {{ id }}
                <span v-if="entry.riddle.unlockAfterIds.length === 0" class="font-sans text-xs font-normal text-green-600">(START)</span>
              </span>

              <p class="text-xs text-gray-500">Freigeschaltet durch:</p>

              <p v-if="otherRaetsel(id).length === 0" class="text-xs text-gray-400 italic">
                Kein anderes Rätsel verfügbar. Ab Start zugänglich
              </p>

              <div v-else class="flex flex-col gap-1">
                <label
                  v-for="[otherId] in otherRaetsel(id)"
                  :key="otherId"
                  class="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    :value="otherId"
                    v-model="entry.riddle.unlockAfterIds"
                    class="cursor-pointer"
                  />
                  <span class="truncate font-mono" :title="otherId">{{ otherId }}</span>
                </label>
              </div>
            </div>
          </template>
        </div>
      </section>

      <section class="mt-6">
        <p class="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
          Startbildschirm
        </p>
        <div class="flex flex-col gap-2">
          <input
            v-model="startScreenData.titel"
            type="text"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder="Titel des Rätsels..."
          />
          <textarea
            v-model="startScreenData.beschreibung"
            rows="3"
            class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder="Einleitungstext / Anweisungen..."
          />
        </div>
      </section>

      <section class="mt-6">
        <p class="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
          Abschlussnachricht
        </p>
        <textarea
          v-model="completionMessage"
          rows="3"
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          placeholder="Du hast es geschafft! Nun hast du ..."
        />
      </section>
    </div>
  </aside>
</template>

<script setup>
import { computed, inject, watch } from 'vue'
import {
  ELEMENTS_DATA,
  SELECTED_MODE,
  ABSCHLUSS_RAETSEL_ID,
  ABSCHLUSS_PENALTY,
  COMPLETION_MESSAGE,
  START_SCREEN_DATA,
} from '../injectionKeys.js'

const emit = defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)
const selectedMode = inject(SELECTED_MODE)
const completionMessage = inject(COMPLETION_MESSAGE)
const startScreenData = inject(START_SCREEN_DATA)
const abschlussRaetselId = inject(ABSCHLUSS_RAETSEL_ID)
const abschlussRaetselPenalty = inject(ABSCHLUSS_PENALTY)

const LAST_ELEMENT = '[last]'

watch(abschlussRaetselId, function (newId) {
  if (!newId) return

  if (elementsData.value[newId]) {
    elementsData.value[newId].riddle.unlockAfterIds = [LAST_ELEMENT]
  }

  for (const id in elementsData.value) {
    if (id === newId) continue

    const current = elementsData.value[id].riddle.unlockAfterIds
    const filtered = []

    for (const parentId of current) {
      if (parentId !== newId) {
        filtered.push(parentId)
      }
    }

    elementsData.value[id].riddle.unlockAfterIds = filtered
  }
})

function otherRaetsel(currentId) {
  const result = []

  for (const [id, entry] of raetselEntries.value) {
    if (id !== currentId && id !== abschlussRaetselId.value) {
      result.push([id, entry])
    }
  }

  return result
}

const raetselEntries = computed(function () {
  const result = []

  for (const id in elementsData.value) {
    const entry = elementsData.value[id]

    if (entry.elementArt === 'Rätsel') {
      result.push([id, entry])
    }
  }

  return result
})

const SELECT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
</script>

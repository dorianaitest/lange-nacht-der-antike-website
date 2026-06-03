<template>
  <aside class="flex h-full w-80 shrink-0 flex-col border-l border-gray-200 bg-white">
    <template v-if="selectedId && elementsData[selectedId]">
      <div class="flex shrink-0 items-center justify-between px-6 pt-6 pb-0">
        <h2 class="truncate text-lg font-semibold text-gray-900" :title="selectedId">
          {{ selectedId }}
        </h2>
        <button
          class="cursor-pointer text-xl text-gray-400 hover:text-gray-600"
          @click="setSelectedElement(null)"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <!-- STUMP: will be changed to Rätsel Creation or Dekoration Config -->
      <div class="flex flex-col gap-2 px-6 pt-6">
        <span class="text-xs font-medium text-gray-500 uppercase">Type</span>
        <div class="flex flex-col gap-2">
          <!-- conditional styling for diff: selected type and others -->
          <button
            v-for="type in types"
            :key="type"
            :class="[
              'cursor-pointer rounded-lg px-4 py-2.5 text-left text-sm font-medium',
              elementsData[selectedId].elementArt === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
            @click="elementsData[selectedId].elementArt = type"
          >
            {{ type }}
          </button>
        </div>
      </div>
    </template>

    <!-- When no Element selected -->
    <template v-else>
      <div class="flex flex-1 items-center justify-center px-6">
        <p class="text-center text-sm text-gray-400">
          Clicke auf ein Element der Karte, um es zu konfigurieren
        </p>
      </div>
    </template>
  </aside>
</template>

<script setup>
import { inject } from 'vue'
import { SELECTED_ELEMENT_ID, SET_SELECTED_ELEMENT, ELEMENTS_DATA } from '../injectionKeys.js'

const selectedId = inject(SELECTED_ELEMENT_ID)
const setSelectedElement = inject(SET_SELECTED_ELEMENT)
const elementsData = inject(ELEMENTS_DATA)

const types = ['deaktiviert', 'Rätsel', 'Dekoration']
</script>

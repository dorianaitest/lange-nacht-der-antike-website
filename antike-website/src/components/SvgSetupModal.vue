<template>
  <BaseModal title="Ebenen" width="90vw" height="90vh" @close="$emit('close')">
    <div class="flex flex-1 overflow-hidden">
      <ul class="flex-1 divide-y divide-gray-100 overflow-y-auto">
        <li
          v-for="(entry, id) in elementsData"
          :key="id"
          class="flex items-center gap-6 px-5 py-3"
          @mouseenter="onListEnter(id, entry)"
          @mouseleave="onListLeave(id)"
        >
          <span class="w-40 shrink-0 truncate font-mono text-sm text-gray-700" :title="id">{{
            id
          }}</span>
          <div class="flex gap-4">
            <label
              v-for="option in options"
              :key="option"
              class="flex cursor-pointer items-center gap-1.5 text-sm text-gray-600"
            >
              <input
                type="radio"
                :name="id"
                :value="option"
                v-model="entry.elementArt"
                class="cursor-pointer"
              />
              {{ option }}
            </label>
          </div>
        </li>
      </ul>

      <div class="flex-1 overflow-hidden border-l border-gray-200">
        <SvgMap ref="svgMap" class="h-full w-full" />
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, provide, inject } from 'vue'
import BaseModal from './BaseModal.vue'
import SvgMap from './SvgMap.vue'
import { ELEMENTS_DATA, EXTRACT_ELEMENTS } from '../injectionKeys.js'

defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)
provide(EXTRACT_ELEMENTS, () => {}) // prevent EXTRACT_ELEMENT from resetting elementsData; cleanup later

const options = ['deaktiviert', 'Rätsel', 'Dekoration']

const HIGHLIGHT_CLASS = {
  Rätsel: 'highlight-raetsel',
  Dekoration: 'highlight-dekoration',
  deaktiviert: 'highlight-deaktiviert',
}

const svgMap = ref(null)

function onListEnter(id, entry) {
  const svgElement = svgMap.value?.elements[id]
  if (!svgElement) return
  svgElement.classList.add(HIGHLIGHT_CLASS[entry.elementArt])
}

function onListLeave(id) {
  const svgElement = svgMap.value?.elements[id]
  if (!svgElement) return
  for (const cls in HIGHLIGHT_CLASS) {
    svgElement.classList.remove(HIGHLIGHT_CLASS[cls])
  }
}
</script>

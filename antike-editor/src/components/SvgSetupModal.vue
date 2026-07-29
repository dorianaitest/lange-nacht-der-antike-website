<template>
  <BaseModal title="Ebenen" width="90vw" height="90vh" @close="$emit('close')">
    <div class="flex flex-1 overflow-hidden">
      <ul class="flex-1 divide-y divide-border-subtle overflow-y-auto">
        <li class="px-5 py-3 text-sm text-ink-muted">
          Weise jedem Element eine Rolle zu: <span class="font-medium text-ink-secondary">Rätsel</span> (spielbar),
          <span class="font-medium text-ink-secondary">dynamische Dekoration</span> (reagiert auf den Zustand verknüpfter Rätsel) oder
          <span class="font-medium text-ink-secondary">Inaktiv</span> (wird ignoriert).
        </li>
        <li
          v-for="(entry, id) in elementsData"
          :key="id"
          class="flex items-center gap-6 px-5 py-3"
          @mouseenter="onListEnter(id, entry)"
          @mouseleave="onListLeave(id)"
        >
          <span class="w-40 shrink-0 truncate font-mono text-sm text-ink-secondary" :title="id">{{
            id
          }}</span>
          <div class="flex gap-4">
            <label
              v-for="option in options"
              :key="option"
              class="flex cursor-pointer items-center gap-1.5 text-sm text-ink-secondary"
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

      <div class="flex-1 overflow-hidden border-l border-border-subtle">
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
provide(EXTRACT_ELEMENTS, () => {}) // prevent EXTRACT_ELEMENTS from resetting elementsData; cleanup later

const options = ['Inaktiv', 'Rätsel', 'dynamische Dekoration']

const HIGHLIGHT_CLASS = {
  Rätsel: 'highlight-riddle',
  'dynamische Dekoration': 'highlight-decoration',
  Inaktiv: 'highlight-inactive',
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
  for (const elementType in HIGHLIGHT_CLASS) {
    svgElement.classList.remove(HIGHLIGHT_CLASS[elementType])
  }
}
</script>

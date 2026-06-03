<template>
  <div class="h-screen w-screen">
    <input ref="fileInput" type="file" accept=".svg" class="hidden" @change="onFileSelected" />

    <template v-if="svgText">
      <div class="flex h-full w-full">
        <!-- toolbar + map + hover -->
        <div class="flex h-full min-w-0 flex-1 flex-col">
          <div class="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-2">
            <BaseButton>Aktion 1</BaseButton>
            <BaseButton>Aktion 2</BaseButton>
            <BaseButton>Aktion 3</BaseButton>
            <BaseButton>Aktion 4</BaseButton>
          </div>

          <SvgMap class="min-w-0 flex-1" @hoverChange="hoveredElementId = $event" />

          <p class="shrink-0 border-t border-gray-200 px-4 py-2 text-sm text-gray-500">
            hervorgehobenes Element:
            <span class="font-mono text-gray-800">{{ hoveredElementId }}</span>
          </p>
        </div>

        <EditorSidebar />
      </div>

      <SvgSetupModal v-if="setupModalOpen" @close="setupModalOpen = false" />
    </template>

    <template v-else>
      <div class="flex h-full w-full items-center justify-center bg-gray-50">
        <BaseButton @click="openFilePicker">Wähle eine SVG Datei</BaseButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import SvgMap from './components/SvgMap.vue'
import EditorSidebar from './components/EditorSidebar.vue'
import SvgSetupModal from './components/SvgSetupModal.vue'
import BaseButton from './components/BaseButton.vue'
import {
  PLAIN_SVG_TEXT,
  ELEMENTS_DATA,
  EXTRACT_ELEMENTS,
  SELECTED_ELEMENT_ID,
  SET_SELECTED_ELEMENT,
} from './injectionKeys.js'

const fileInput = ref(null)
// better than using the ?component from before multiple times
const svgText = ref(null)
const elementsData = ref({})
const selectedElementId = ref(null)
const setupModalOpen = ref(false)
const hoveredElementId = ref(null)

provide(PLAIN_SVG_TEXT, svgText)
provide(ELEMENTS_DATA, elementsData)
provide(EXTRACT_ELEMENTS, (ids) => {
  for (const id of ids) {
    elementsData.value[id] = { elementArt: 'deaktiviert' }
  }
})
provide(SELECTED_ELEMENT_ID, selectedElementId)
provide(SET_SELECTED_ELEMENT, (id) => {
  selectedElementId.value = id
})

function openFilePicker() {
  fileInput.value.click()
}

function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = (e) => {
    svgText.value = e.target.result
    setupModalOpen.value = true
  }
}
</script>

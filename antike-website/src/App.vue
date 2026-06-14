<template>
  <div class="h-screen w-screen">
    <input ref="fileInput" type="file" accept=".svg" class="hidden" @change="onFileSelected" />

    <template v-if="svgText">
      <div class="flex h-full w-full">
        <!-- toolbar + map + hover -->
        <div class="flex h-full min-w-0 flex-1 flex-col">
          <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2">
            <div class="flex items-center gap-2">
              <BaseButton @click="setupModalOpen = true">Ebenen</BaseButton>
              <BaseButton @click="highlightAllElements = !highlightAllElements">Elemente hervorheben</BaseButton>
              <BaseButton @click="orderingOpen = true">Reihenfolge</BaseButton>
              <BaseButton v-if="selectedMode === 'Spezial'" @click="symboleOpen = true">Symbole</BaseButton>
            </div>

            <span class="text-sm text-gray-600">Modus: {{ selectedMode }}</span>

            <div class="flex items-center gap-2">
              <BaseButton @click="openPreview">Vorschau</BaseButton>
              <BaseButton @click="openExport">Exportieren</BaseButton>
            </div>
          </div>

          <SvgMap
            class="min-w-0 flex-1"
            :highlightAll="highlightAllElements"
            @hoverChange="hoveredElementId = $event"
          />

          <p class="shrink-0 border-t border-gray-200 px-4 py-2 text-sm text-gray-500">
            Hervorgehobenes Element:
            <span class="font-mono text-gray-800">{{ hoveredElementId }}</span>
          </p>
        </div>

        <EditorSidebar />
      </div>

      <ModePickerModal v-if="modePickerOpen" @pick="onModePicked" @close="modePickerOpen = false" />

      <SvgSetupModal v-if="setupModalOpen" @close="setupModalOpen = false" />

      <OrderingModal v-if="orderingOpen" @close="orderingOpen = false" />

      <ExportModal v-if="exportOpen" @close="exportOpen = false" />

      <PreviewModal v-if="previewOpen" @close="previewOpen = false" @reset="resetPreview" />

      <SymboleModal v-if="symboleOpen" @close="symboleOpen = false" />

      <ValidationModal
        v-if="validationModalOpen"
        :errors="validationErrors"
        :warnings="validationWarnings"
        @close="validationModalOpen = false"
        @proceed="onValidationProceed"
      />
    </template>

    <template v-else>
      <div class="flex h-full w-full items-center justify-center bg-gray-50">
        <BaseButton @click="openFilePicker">Wähle eine SVG Datei</BaseButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, provide, nextTick } from 'vue'
import { validateConfig } from './utils/validateConfig.js'
import ValidationModal from './components/ValidationModal.vue'
import SvgMap from './components/SvgMap.vue'
import EditorSidebar from './components/EditorSidebar.vue'
import SvgSetupModal from './components/SvgSetupModal.vue'
import OrderingModal from './components/OrderingModal.vue'
import ExportModal from './components/ExportModal.vue'
import PreviewModal from './components/PreviewModal.vue'
import ModePickerModal from './components/ModePickerModal.vue'
import SymboleModal from './components/SymboleModal.vue'
import BaseButton from './components/BaseButton.vue'
import {
  PLAIN_SVG_TEXT,
  ELEMENTS_DATA,
  EXTRACT_ELEMENTS,
  SELECTED_ELEMENT_ID,
  SET_SELECTED_ELEMENT,
  COMPLETION_MESSAGE,
  SELECTED_MODE,
  SYMBOL_POOL,
  ABSCHLUSS_RAETSEL_ID,
  ABSCHLUSS_PENALTY,
} from './injectionKeys.js'

const fileInput = ref(null)
// better than using the ?component from before multiple times
const svgText = ref(null)
const completionMessage = ref('')
const elementsData = ref({})
const selectedElementId = ref(null)
const modePickerOpen = ref(false)
const symboleOpen = ref(false)
const selectedMode = ref(null)
const setupModalOpen = ref(false)
const orderingOpen = ref(false)
const exportOpen = ref(false)
const previewOpen = ref(false)
const validationModalOpen = ref(false)
const validationErrors = ref([])
const validationWarnings = ref([])
const pendingModalOpen = ref(null)
const hoveredElementId = ref(null)
const highlightAllElements = ref(false)
const symbolPool = ref([])
const abschlussRaetselId = ref(null)
const abschlussRaetselPenalty = ref(30)

provide(PLAIN_SVG_TEXT, svgText)
provide(ELEMENTS_DATA, elementsData)
provide(EXTRACT_ELEMENTS, function (ids) {
  for (const id of ids) {
    // for now all elements get the riddle attribute CHANGE LATER
    elementsData.value[id] = {
      elementArt: 'deaktiviert',
      riddle: {
        question: '',
        answer: '',
        successText: '',
        iconFile: null,
        iconPreview: null,
        unlockAfterId: null,
      },
      deco: { linkedElement: null, stateBefore: 'hidden', stateAfter: 'none' },
    }
  }
})
provide(COMPLETION_MESSAGE, completionMessage)
provide(SELECTED_MODE, selectedMode)
provide(SYMBOL_POOL, symbolPool)
provide(ABSCHLUSS_RAETSEL_ID, abschlussRaetselId)
provide(ABSCHLUSS_PENALTY, abschlussRaetselPenalty)
provide(SELECTED_ELEMENT_ID, selectedElementId)
provide(SET_SELECTED_ELEMENT, (id) => {
  selectedElementId.value = id
})

function openWithValidation(requestedModal) {
  const result = validateConfig(elementsData.value, selectedMode.value, abschlussRaetselId.value, symbolPool.value, completionMessage.value)
  if (result.errors.length > 0 || result.warnings.length > 0) {
    validationErrors.value = result.errors
    validationWarnings.value = result.warnings
    pendingModalOpen.value = requestedModal
    validationModalOpen.value = true
  } else {
    openModalAfterValidation(requestedModal)
  }
}

function openModalAfterValidation(requestedModal) {
  if (requestedModal === 'preview') {
    previewOpen.value = true
  } else if (requestedModal === 'export') {
    exportOpen.value = true
  }
}

function onValidationProceed() {
  validationModalOpen.value = false
  openModalAfterValidation(pendingModalOpen.value)
  pendingModalOpen.value = null
}

function openPreview() {
  openWithValidation('preview')
}

function openExport() {
  openWithValidation('export')
}

// need to refactor (if I can figure out how to reset a reactive component object..)
async function resetPreview() {
  previewOpen.value = false
  await nextTick()
  previewOpen.value = true
}

function openFilePicker() {
  fileInput.value.click()
}

function onModePicked(mode) {
  selectedMode.value = mode
  modePickerOpen.value = false
  setupModalOpen.value = true
}

function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = (e) => {
    svgText.value = e.target.result
    modePickerOpen.value = true
  }
}
</script>

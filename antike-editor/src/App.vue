<template>
  <div class="h-screen w-screen">
    <input ref="fileInput" type="file" accept=".svg" class="hidden" @change="onFileSelected" />

    <template v-if="svgText">
      <div class="flex h-full w-full">
        <!-- toolbar + map + hover -->
        <div class="flex h-full min-w-0 flex-1 flex-col">
          <div
            class="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-2"
          >
            <div class="flex items-center gap-2">
              <BaseButton variant="secondary" @click="isSetupModalOpen = true">Ebenen</BaseButton>
              <BaseButton
                variant="secondary"
                :isActive="isHighlightAllElements"
                @click="isHighlightAllElements = !isHighlightAllElements"
                >Elemente hervorheben</BaseButton
              >
              <BaseButton variant="secondary" :isActive="isOrderingOpen" @click="toggleOrdering"
                >Spielkonfiguration</BaseButton
              >
              <BaseButton variant="secondary" v-if="selectedMode === 'SymbolRiddle'" @click="isSymbolsModalOpen = true"
                >Symbole</BaseButton
              >
              <BaseButton variant="secondary" @click="isStylingModalOpen = true">Darstellung</BaseButton>
            </div>

            <span class="text-sm text-ink-secondary">Modus: {{ selectedMode }}</span>

            <div class="flex items-center gap-2">
              <BaseButton variant="secondary" @click="openPreview">Vorschau</BaseButton>
              <BaseButton @click="openExport">Exportieren</BaseButton>
            </div>
          </div>

          <SvgMap
            class="min-w-0 flex-1"
            :highlightAll="isHighlightAllElements"
            @hoverChange="hoveredElementId = $event"
          />

          <p class="shrink-0 border-t border-border-subtle px-4 py-2 text-sm text-ink-muted">
            Hervorgehobenes Element:
            <span class="font-mono text-ink">{{ hoveredElementId }}</span>
          </p>
        </div>

        <OrderingSidebar v-if="isOrderingOpen" @close="isOrderingOpen = false" />
        <EditorSidebar v-else />
      </div>

      <ModePickerModal v-if="isModePickerOpen" @pick="onModePicked" @close="onModePickerClose" />

      <SvgSetupModal v-if="isSetupModalOpen" @close="isSetupModalOpen = false" />

      <ExportModal v-if="isExportOpen" @close="isExportOpen = false" />

      <PreviewModal v-if="isPreviewOpen" @close="isPreviewOpen = false" @reset="resetPreview" />

      <SymbolsModal v-if="isSymbolsModalOpen" @close="isSymbolsModalOpen = false" />
      <StylingModal v-if="isStylingModalOpen" @close="isStylingModalOpen = false" />

      <ValidationModal
        v-if="isValidationModalOpen"
        :errors="validationErrors"
        :warnings="validationWarnings"
        @close="isValidationModalOpen = false"
        @proceed="onValidationProceed"
      />
    </template>

    <template v-else>
      <div class="flex h-full w-full items-center justify-center bg-canvas">
        <BaseButton @click="openFilePicker">Wähle eine SVG Datei</BaseButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, provide, watch, nextTick } from 'vue'
import { validateConfig } from './utils/validateConfig.js'
import ValidationModal from './components/ValidationModal.vue'
import SvgMap from './components/SvgMap.vue'
import EditorSidebar from './components/EditorSidebar.vue'
import SvgSetupModal from './components/SvgSetupModal.vue'
import OrderingSidebar from './components/OrderingSidebar.vue'
import ExportModal from './components/ExportModal.vue'
import PreviewModal from './components/PreviewModal.vue'
import ModePickerModal from './components/ModePickerModal.vue'
import SymbolsModal from './components/SymbolsModal.vue'
import StylingModal from './components/StylingModal.vue'
import BaseButton from './components/BaseButton.vue'
import {
  PLAIN_SVG_TEXT,
  ELEMENTS_DATA,
  EXTRACT_ELEMENTS,
  SELECTED_ELEMENT_ID,
  SET_SELECTED_ELEMENT,
  SELECTED_MODE,
  SYMBOL_POOL,
  FINAL_RIDDLE_ID,
  FINAL_RIDDLE_PENALTY,
  SYMBOL_PICKER_DATA,
  COMPLETION_MESSAGE,
  START_SCREEN_DATA,
  STYLING_CONFIG,
} from './injectionKeys.js'

const fileInput = ref(null)
// better than using the ?component from before multiple times
const svgText = ref(null)
const symbolPickerData = ref({ prompt: '', successText: '' })
const completionMessage = ref('')
const startScreenData = ref({ title: '', description: '' })
const elementsData = ref({})
const selectedElementId = ref(null)
const isModePickerOpen = ref(false)
const isSymbolsModalOpen = ref(false)
const isStylingModalOpen = ref(false)
const selectedMode = ref(null)
const isSetupModalOpen = ref(false)
const isOrderingOpen = ref(false)
const isExportOpen = ref(false)
const isPreviewOpen = ref(false)
const isValidationModalOpen = ref(false)
const validationErrors = ref([])
const validationWarnings = ref([])
const pendingModalType = ref(null)
const hoveredElementId = ref(null)
const isHighlightAllElements = ref(false)
const symbolPool = ref([])
const stylingConfig = reactive({ highlightColor: '#8c7b3e', highlightStrokeWidth: 1, shroudedOpacity: 0.2 })
const finalRiddleId = ref(null)
const finalRiddlePenalty = ref(30)

provide(PLAIN_SVG_TEXT, svgText)
provide(ELEMENTS_DATA, elementsData)
provide(EXTRACT_ELEMENTS, function (ids) {
  for (const id of ids) {
    // for now all elements get the riddle attribute CHANGE LATER
    elementsData.value[id] = {
      elementArt: 'Inaktiv',
      riddle: {
        question: '',
        answers: [''],
        successText: '',
        iconFile: null,
        iconPreview: null,
        unlockAfterIds: [],
        style: { locked: 'shrouded', accessible: 'highlighted', completed: 'none' },
      },
      deco: { linkedElements: [], style: { locked: 'hidden', accessible: 'shrouded', completed: 'none' } },
    }
  }
})
provide(SYMBOL_PICKER_DATA, symbolPickerData)
provide(COMPLETION_MESSAGE, completionMessage)
provide(START_SCREEN_DATA, startScreenData)
provide(SELECTED_MODE, selectedMode)
provide(SYMBOL_POOL, symbolPool)
provide(FINAL_RIDDLE_ID, finalRiddleId)
provide(FINAL_RIDDLE_PENALTY, finalRiddlePenalty)
provide(STYLING_CONFIG, stylingConfig)
provide(SELECTED_ELEMENT_ID, selectedElementId)
provide(SET_SELECTED_ELEMENT, (id) => {
  selectedElementId.value = id
})

function toggleOrdering() {
  isOrderingOpen.value = !isOrderingOpen.value
  if (isOrderingOpen.value) {
    selectedElementId.value = null
  }
}

watch(selectedElementId, function (id) {
  if (!id || !isOrderingOpen.value) return

  const entry = elementsData.value[id]
  if (entry && (entry.elementArt === 'Rätsel' || entry.elementArt === 'dynamische Dekoration')) {
    isOrderingOpen.value = false
  }
})

function openWithValidation(requestedModal) {
  const result = validateConfig(
    elementsData.value,
    selectedMode.value,
    finalRiddleId.value,
    symbolPool.value,
  )
  if (result.errors.length > 0 || result.warnings.length > 0) {
    validationErrors.value = result.errors
    validationWarnings.value = result.warnings
    pendingModalType.value = requestedModal
    isValidationModalOpen.value = true
  } else {
    openModalAfterValidation(requestedModal)
  }
}

function openModalAfterValidation(requestedModal) {
  if (requestedModal === 'preview') {
    isPreviewOpen.value = true
  } else if (requestedModal === 'export') {
    isExportOpen.value = true
  }
}

function onValidationProceed() {
  isValidationModalOpen.value = false
  openModalAfterValidation(pendingModalType.value)
  pendingModalType.value = null
}

function openPreview() {
  openWithValidation('preview')
}

function openExport() {
  openWithValidation('export')
}

// need to refactor (if I can figure out how to reset a reactive component object..)
async function resetPreview() {
  isPreviewOpen.value = false
  await nextTick()
  isPreviewOpen.value = true
}

function openFilePicker() {
  fileInput.value.click()
}

function onModePickerClose() {
  isModePickerOpen.value = false
  svgText.value = null
  selectedMode.value = null
  elementsData.value = {}
  selectedElementId.value = null
  symbolPool.value = []
  finalRiddleId.value = null
  finalRiddlePenalty.value = 30
  startScreenData.value = { title: '', description: '' }
  completionMessage.value = ''
  symbolPickerData.value = { prompt: '', successText: '' }
}

function onModePicked(mode) {
  selectedMode.value = mode
  isModePickerOpen.value = false
  isSetupModalOpen.value = true
}

function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = (loadEvent) => {
    svgText.value = loadEvent.target.result
    isModePickerOpen.value = true
  }
}
</script>

<template>
  <div class="bg-background flex h-screen w-full flex-col items-center overflow-hidden">
    <div class="flex h-[8%] w-[80%] items-center justify-start gap-4 rounded-2xl bg-gray-100">
      <BaseButton @click="toggleIdList"> Show SVG Id List </BaseButton>
      <BaseButton @click="toggleClickableHighlighting">Highlight Clickable Elements</BaseButton>
      <BaseButton @click="createDefaultRiddleList">Insert Default</BaseButton>
      <BaseButton @click="togglePreview">Open Preview</BaseButton>
    </div>

    <svgMap
      @click="svgClicked"
      @mouseover="svgMouseOver"
      @mouseout="svgMouseOut"
      class="max-h-[80%] w-auto max-w-[80%]"
    />

    <div class="flex h-[8%] w-[80%] items-center justify-start gap-4 rounded-2xl bg-gray-100">
      <p class="text-2xl">Hovered Element: {{ hoveredElement }}</p>
    </div>

    <IDListModal
      v-if="currentWindow.idListModal"
      @toggleElementStatus="toggleElementStatus"
      @toggleIdList="toggleIdList"
      @toggleMode="toggleCurrentMode"
      @changeUnlockIdForId="changeUnlockIdForId"
      :ids="ids"
      :mode="currentMode"
    />

    <ClickedElementModal
      v-if="currentWindow.clickedElementModal"
      @cancel="closeAllModals"
      @toggleRiddleCreation="toggleRiddleCreation"
      @togglePathCreation="togglePathCreation"
    />
    <RiddleCreationModal
      v-if="currentWindow.riddleCreationModal"
      :id="clickedElement"
      :riddleList="riddleList"
      @riddleSaved="addRiddleToList"
      @cancel="closeAllModals"
    />
    <ConditionalRenderingModal
      v-if="currentWindow.conditionalRenderingModal"
      :id="clickedElement"
      :riddleList="riddleList"
      @cancel="closeAllModals"
    />
    <PreviewModal
      v-if="currentWindow.previewModal"
      @cancelPreview="cancelPreview"
      @riddleAnswered="riddleAnswered"
      :validElements="ids"
      :riddleList="riddleList"
      :mode="currentMode"
    />
  </div>
</template>

<script setup>
import svgMap from './assets/background.svg?component'
import BaseButton from './components/BaseButton.vue'
import IDListModal from './components/IDListModal.vue'
import ClickedElementModal from './components/ClickedElementModal.vue'
import svgRaw from './assets/background.svg?raw'
import RiddleCreationModal from './components/ConditionalRenderingModal.vue'
import ConditionalRenderingModal from './components/ConditionalRenderingModal.vue'
import PreviewModal from './components/PreviewModal.vue'

import { reactive, ref, computed } from 'vue'

const currentWindow = reactive({
  idListModal: false,
  clickedElementModal: false,
  riddleCreationModal: false,
  conditionalRenderingModal: false,
  previewModal: false,
})

const currentMode = ref('unordered')

const highlightingEnabled = ref(false)

const riddleList = reactive({})

const hoveredElement = ref(null)
const clickedElement = ref(null)

const matches = svgRaw.matchAll(/\bid=["']([^"']+)["']/g) // Match all ids inside svg and only save the matched element
const ids = reactive({}) //ensures reactivity of map

// very ugly: will be refactored in v2
const types = reactive({})

for (const match of matches) {
  const id = match[1]
  ids[id] = '' // empty string = enabled and starter node
  types[id] = 'riddle' //this is for different node types: REFACTOR INTO SINGLE OBJECT LATER
}

//HARDCODE REMOVE LATER!
ids['Landkarte'] = null
ids['Ebene_29'] = null

const defaultRiddles = {
  Genua: {
    riddle: 'I guard the northern sea routes and thrive through trade. What city am I?',
    answer: 'Genua',
    completed: false,
  },

  Brundisium: {
    riddle: 'Travelers crossing from Greece often arrive at my busy harbor. Which city am I?',
    answer: 'Brundisium',
    completed: false,
  },

  Cannae: {
    riddle: 'I am remembered for a disastrous Roman defeat against Hannibal. What place am I?',
    answer: 'Cannae',
    completed: false,
  },

  Cumae: {
    riddle: 'I am home to a famous oracle who spoke cryptic prophecies. Which city am I?',
    answer: 'Cumae',
    completed: false,
  },

  Syracusae: {
    riddle: 'I am a wealthy Sicilian city where Archimedes once lived. What city am I?',
    answer: 'Syracusae',
    completed: false,
  },

  Roma: {
    riddle: 'All roads are said to lead to me. Which city am I?',
    answer: 'Roma',
    completed: false,
  },

  Alpen: {
    riddle: 'Crossing me with elephants made Hannibal legendary. What am I?',
    answer: 'Alpen',
    completed: false,
  },

  Rubico: {
    riddle: 'Caesar crossed me and changed Roman history forever. What river am I?',
    answer: 'Rubico',
    completed: false,
  },

  Pompei: {
    riddle: 'Mount Vesuvius buried me beneath ash in a single day. Which city am I?',
    answer: 'Pompei',
    completed: false,
  },

  Sardinia: {
    riddle: 'I am the large Mediterranean island west of Italy. What am I?',
    answer: 'Sardinia',
    completed: false,
  },
}

function getSvgElement(event) {
  return event.target.closest('[id]')
}

function svgClicked(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (ids[id] === null) return

  clickedElement.value = id
  toggleClickedElementModal()
}

function svgMouseOver(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (ids[id] === null) return

  hoveredElement.value = id
  element.classList.add('hovered-svg-element')
}

function svgMouseOut(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id

  if (hoveredElement.value === id) {
    hoveredElement.value = null
  }
  element.classList.remove('hovered-svg-element')
}

function toggleElementStatus(id, enabled) {
  ids[id] = enabled ? '' : null
}

function changeUnlockIdForId(id, unlockAfterId) {
  ids[id] = unlockAfterId
}

function toggleIdList() {
  currentWindow.idListModal = !currentWindow.idListModal
}

function toggleClickedElementModal() {
  currentWindow.clickedElementModal = !currentWindow.clickedElementModal
}

function toggleRiddleCreation() {
  if (currentWindow.clickedElementModal) currentWindow.clickedElementModal = false
  currentWindow.riddleCreationModal = !currentWindow.riddleCreationModal
}

function togglePathCreation() {
  if (currentWindow.clickedElementModal) currentWindow.clickedElementModal = false
  currentWindow.conditionalRenderingModal = !currentWindow.conditionalRenderingModal
}

function closeAllModals() {
  for (const key in currentWindow) {
    currentWindow[key] = false
  }
}

function addRiddleToList(riddleObject) {
  riddleList[riddleObject.id] = {
    riddle: riddleObject.riddle,
    answer: riddleObject.answer,
    completed: false,
  }
}

function toggleClickableHighlighting() {
  highlightingEnabled.value = !highlightingEnabled.value
  if (highlightingEnabled.value) {
    for (const id in ids) {
      if (ids[id] === null) continue
      const element = document.getElementById(id)

      element.classList.add('highlight-svg-element')
    }
  } else {
    for (const id in ids) {
      const element = document.getElementById(id)

      element.classList.remove('highlight-svg-element')
    }
  }
}

function createDefaultRiddleList() {
  Object.assign(riddleList, defaultRiddles)
  console.log(riddleList)
}

function toggleCurrentMode() {
  if (currentMode.value === 'unordered') {
    currentMode.value = 'ordered'
  } else if (currentMode.value === 'ordered') {
    currentMode.value = 'unordered'
  }
}

const calculateMaxElementStepNumber = computed(() => {
  let currentMax = 0
  for (const id in ids) {
    if (currentMax < ids[id]) currentMax = ids[id]
  }
  return currentMax + 1
})

function changeOrderForId(id, order) {
  ids[id] = order
  console.log(calculateMaxElementStepNumber.value)
}

function togglePreview() {
  currentWindow['previewModal'] = !currentWindow['previewModal']
}

function riddleAnswered(id) {
  riddleList[id].completed = true
}

function cancelPreview() {
  for (const id in riddleList) {
    riddleList[id].completed = false
  }
  closeAllModals()
}
</script>

<style scoped></style>

<template>
  <div class="bg-background flex h-screen w-full flex-col items-center overflow-hidden">
    <div class="flex h-[8%] w-[80%] items-center justify-start gap-4 rounded-2xl bg-gray-100">
      <BaseButton @click="toggleIdList"> Show SVG Id List </BaseButton>
      <p>Hovered Element: {{ hoveredElement }}</p>
    </div>

    <svgMap
      @click="svgClicked"
      @mouseover="svgMouseOver"
      @mouseout="svgMouseOut"
      class="h-[90%] w-auto max-w-[80%]"
    />
    <IDListModal v-if="currentWindow.idListModal" @toggleId="toggleId" @toggleIdList="toggleIdList" :ids="ids" />
    <ClickedElementModal
      v-if="currentWindow.clickedElementModal"
      @cancel="closeAllModals"
      @toggleRiddleCreation="toggleRiddleCreation"
      @togglePathCreation="togglePathCreation"
    />
    <RiddleCreationModal v-if="currentWindow.riddleCreationModal" @cancel="closeAllModals"/>
    <PathCreationModal v-if="currentWindow.pathCreationModal" @cancel="closeAllModals"/>
  </div>
</template>

<script setup>
import svgMap from './assets/background.svg?component'
import BaseButton from './components/BaseButton.vue'
import IDListModal from './components/IDListModal.vue'
import ClickedElementModal from './components/ClickedElementModal.vue'
import svgRaw from './assets/background.svg?raw'
import RiddleCreationModal from './components/RiddleCreationModal.vue'
import PathCreationModal from './components/PathCreationModal.vue'

import { reactive, ref } from 'vue'

const currentWindow = reactive({
  idListModal: false,
  clickedElementModal: false,
  riddleCreationModal: false,
  pathCreationModal: false,
})
/*
const showIdList = ref(false)
const currentWindow.clickedElementModal = ref(false)
const currentWindow.riddleCreationModal = ref(false)
const currentWindow.pathCreationModal = ref(false)
*/
const hoveredElement = ref(null)

const matches = svgRaw.matchAll(/\bid=["']([^"']+)["']/g) // Match all ids inside svg and only save the matched element
const ids = reactive({}) //ensures reactivity of map

for (const match of matches) {
  const id = match[1] //The plain id
  ids[id] = true //all ids are enabled by default
}

function getSvgElement(event) {
  return event.target.closest('[id]')
}

function svgClicked(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (ids[id] !== true) return

  //insert open Riddle Creation or Handle Streets here
  toggleClickedElementModal()
}

function svgMouseOver(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (ids[id] !== true) return

  hoveredElement.value = id
}

function svgMouseOut(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id

  if (hoveredElement.value === id) {
    hoveredElement.value = null
  }
}

function toggleId(id, checked) {
  ids[id] = checked
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
  currentWindow.pathCreationModal = !currentWindow.pathCreationModal
}

function closeAllModals() {
  for (const key in currentWindow) {
    currentWindow[key] = false
  }
}

</script>

<style scoped></style>

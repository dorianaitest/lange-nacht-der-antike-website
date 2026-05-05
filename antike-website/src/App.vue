<template>
  <div class="bg-background h-screen w-full overflow-hidden flex flex-col items-center ">
    <div class="h-[8%] flex items-center justify-center bg-gray-100 w-[80%] rounded-2xl"> 
      <BaseButton @click="toggleIdList">
        Show SVG Id List  
      </BaseButton>
      <p>Hovered Element: {{ hoveredElement }}</p>
    </div>

    <svgMap @click="svgClicked" @mouseover="svgMouseOver" @mouseout="svgMouseOut" class="h-[90%] max-w-[80%] w-auto" />
    <IDListModal v-if="showIdList" @toggleId="toggleId" @toggleIdList="toggleIdList" :ids="ids"/>
  </div>
</template>

<script setup>
import svgMap from './assets/background.svg?component'
import BaseButton from './components/BaseButton.vue';
import IDListModal from './components/IDListModal.vue';
import svgRaw from '@/assets/background.svg?raw'

import { reactive, ref } from 'vue'

const showIdList = ref(false)

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
  console.log(id)
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
  showIdList.value = !showIdList.value 
}
</script>

<style scoped></style>

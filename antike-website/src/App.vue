<template>
  <div class="bg-background h-screen w-full overflow-hidden flex flex-col items-center ">
    <div class="h-[8%] flex items-center justify-center bg-gray-100 w-[80%] rounded-2xl"> 
      <BaseButton @click="toggleIdList">
        Test 
      </BaseButton>
    </div>

    <svgMap class="h-[90%] max-w-[80%] w-auto" />
    <IDListModal v-if="showIdList" @toggleID="toggleId" @toggleIdList="toggleIdList" :ids="ids"/>
  </div>
</template>

<script setup>
import svgMap from './assets/background.svg?component'
import BaseButton from './components/BaseButton.vue';
import IDListModal from './components/IDListModal.vue';
import svgRaw from '@/assets/background.svg?raw'

import { reactive, ref } from 'vue'

const showIdList = ref(false)

const matches = svgRaw.matchAll(/\bid=["']([^"']+)["']/g) // Match all ids inside svg and only save the matched element
const ids = reactive({}) //ensures reactivity of map

for (const match of matches) {
  const id = match[1] //The plain id
  ids[id] = true //all ids are enabled by default
}

function toggleId(id, checked) {
ids[id] = checked 
}

function toggleIdList() {
  showIdList.value = !showIdList.value 
}
</script>

<style scoped></style>

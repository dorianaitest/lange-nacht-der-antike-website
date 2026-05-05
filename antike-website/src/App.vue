<template>
  <div class="bg-background h-screen w-full overflow-hidden flex flex-col items-center ">
    <div class="h-[8%] flex items-center justify-center bg-gray-100 w-[80%] rounded-2xl"> 
      <BaseButton @click="testModal">
        Test 
      </BaseButton>
    </div>

    <svgMap class="h-[90%] max-w-[80%] w-auto" />
    <BaseModal v-if="modal">
      <h1>Modal Test</h1>
      <BaseButton @click="testModal">Test</BaseButton>
    </BaseModal>
  </div>
</template>

<script setup>
import svgMap from './assets/background.svg?component'
import BaseButton from './components/BaseButton.vue';
import BaseModal from './components/BaseModal.vue'

import { ref } from 'vue'

const modal = ref(false)

function testModal() {
  modal.value = !modal.value
}
</script>

<style scoped></style>

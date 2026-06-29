<template>
  <BaseModal title="Symbole" width="70vw" height="70vh" @close="emit('close')">
    <div class="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <p class="text-sm leading-relaxed text-gray-500">
        Lade für jedes Rätsel-Element ein Symbol hoch.
      </p>

      <div
        class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
        :class="{
          'bg-green-50 text-green-700': countStatus === 'ok',
          'bg-amber-50 text-amber-700': countStatus === 'warning',
          'bg-gray-50 text-gray-500': countStatus === 'none',
        }"
      >
        <span v-if="riddleCount === 0">Noch keine Rätsel-Elemente definiert.</span>
        <span v-else>{{ uploadedCount }} von {{ riddleCount }} Symbolen hochgeladen</span>
      </div>

      <div v-if="symbolPool.length > 0" class="flex flex-wrap gap-3">
        <div v-for="(symbol, index) in symbolPool" :key="index" class="group relative">
          <img
            :src="symbol.preview"
            :alt="symbol.file.name"
            :title="symbol.file.name"
            class="h-20 w-20 rounded-lg border border-gray-200 object-cover"
          />
          <button
            class="absolute top-0 right-0 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-xs text-white"
            @click="removeSymbol(index)"
          >
            ✕
          </button>
        </div>
      </div>

      <p v-else class="text-sm text-gray-400">Noch keine Symbole hochgeladen.</p>

      <div>
        <input
          ref="symbolInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onSymbolsSelected"
        />
        <BaseButton @click="openPicker">Symbole hochladen</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { ELEMENTS_DATA, SYMBOL_POOL } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const emit = defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)
const symbolPool = inject(SYMBOL_POOL)

const symbolInput = ref(null)

const riddleCount = computed(function () {
  let count = 0
  for (const element of Object.values(elementsData.value)) {
    if (element.elementArt === 'Rätsel') {
      count++
    }
  }
  return count
})

const uploadedCount = computed(function () {
  return symbolPool.value.length
})

const countStatus = computed(function () {
  if (riddleCount.value === 0) return 'none'
  return uploadedCount.value === riddleCount.value ? 'ok' : 'warning'
})

function openPicker() {
  symbolInput.value.click()
}

function onSymbolsSelected(event) {
  const files = Array.from(event.target.files)
  if (!files.length) return
  event.target.value = ''
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = function (e) {
      symbolPool.value.push({ file, preview: e.target.result })
    }
    reader.readAsDataURL(file)
  }
}

function removeSymbol(index) {
  if (!confirm('Symbol entfernen?')) return
  symbolPool.value.splice(index, 1)
}
</script>

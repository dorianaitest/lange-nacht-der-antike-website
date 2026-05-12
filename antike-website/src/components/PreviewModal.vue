<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex h-full max-h-[90%] w-full max-w-[90%] flex-col items-center justify-between rounded-xl p-6 shadow-xl"
    >
      <h2 class="text-xl">Preview Modal</h2>
      <SvgMap
        @click="svgClicked"
        @mouseover="svgMouseOver"
        @mouseout="svgMouseOut"
        class="w-100% max-h-[80%] w-auto"
      />
      <BaseButton @click="emit('cancel')">Exit Preview</BaseButton>
    </div>
    <PreviewRiddleModal
      v-if="riddleClicked"
      :item="props.riddleList[clickedElement]"
      :id="clickedElement"
      @cancel="toggleRiddleModal"
    />
  </BaseModal>
</template>

<script setup>
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'
import SvgMap from '@/assets/background.svg?component'
import { ref } from 'vue'
import PreviewRiddleModal from './PreviewRiddleModal.vue'

const emit = defineEmits(['cancel'])

const props = defineProps({
  validElements: {
    type: Object,
    required: true,
  },
  riddleList: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
})

const clickedElement = ref('')
const hoveredElement = ref('')
const riddleClicked = ref(false)

function getSvgElement(event) {
  return event.target.closest('[id]')
}

function svgClicked(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (props.validElements[id] === 0) return

  clickedElement.value = id
  toggleRiddleModal()
}

function svgMouseOver(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (props.validElements[id] === 0) return

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

function toggleRiddleModal() {
  riddleClicked.value = !riddleClicked.value
}
</script>

<style lang="scss" scoped></style>

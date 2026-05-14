<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex h-full max-h-[90%] w-full max-w-[90%] flex-col items-center justify-between rounded-xl p-6 shadow-xl"
    >
      <div class="flex items-end gap-4">
        <h2 class="text-xl">Preview Modal</h2>
        <p>Mode: ({{ mode }})</p>
        <BaseButton @click="debug">DEBUG</BaseButton>
      </div>
      <SvgMap
        @click="svgClicked"
        @mouseover="svgMouseOver"
        @mouseout="svgMouseOut"
        class="w-100% max-h-[80%] w-auto"
      />
      <BaseButton @click="emit('cancelPreview')">Exit Preview</BaseButton>
    </div>
    <PreviewRiddleModal
      v-if="riddleClicked"
      :item="props.riddleList[clickedElement]"
      :id="clickedElement"
      @cancel="toggleRiddleModal"
      @riddleAnswered="riddleAnswered"
    />
  </BaseModal>
</template>

<script setup>
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'
import SvgMap from '@/assets/background.svg?component'
import PreviewRiddleModal from './PreviewRiddleModal.vue'
import { ref } from 'vue'

const emit = defineEmits(['cancelPreview', 'riddleAnswered'])

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
const clickedSvgElement = ref('')
const hoveredElement = ref('')
const riddleClicked = ref(false)
const currentRiddleStep = ref('1')

function getSvgElement(event) {
  return event.target.closest('[id]')
}

function svgClicked(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (!props.riddleList[id]) return

  if (props.riddleList[id].completed) return

  if (props.validElements[id] > currentRiddleStep.value) return

  clickedElement.value = id
  clickedSvgElement.value = element
  toggleRiddleModal()
}

function svgMouseOver(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id
  if (!props.riddleList[id]) return

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

function riddleAnswered(id) {
  clickedSvgElement.value.classList.add('answered-svg-element')
  // clickedSvgElement.value.classList.add('locked-svg-element')
  emit('riddleAnswered', id)
  toggleRiddleModal()
}

function debug() {
  console.log(props.validElements)
}
</script>

<style lang="scss" scoped></style>

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

      <div id="previewmap" class="flex max-h-[80%] w-full justify-center">
        <SvgMap
          @click="svgClicked"
          @mouseover="svgMouseOver"
          @mouseout="svgMouseOut"
          class="max-h-full w-auto max-w-full"
        />
      </div>

      <BaseButton @click="emit('cancelPreview')"> Exit Preview </BaseButton>
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
import { ref, onMounted } from 'vue'

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

onMounted(applyLockedStyling)

function getSvgElement(event) {
  return event.target.closest('[id]')
}

function isElementEnabled(id) {
  return props.validElements[id] !== null && props.validElements[id] !== undefined
}

function isElementCompleted(id) {
  return props.riddleList[id]?.completed === true
}

function isElementUnlocked(id) {
  const unlockAfterId = props.validElements[id]

  if (!isElementEnabled(id)) {
    return false
  }

  if (props.mode === 'unordered') {
    return true
  }

  if (unlockAfterId === '') {
    return true
  }

  return props.riddleList[unlockAfterId]?.completed === true
}

function svgClicked(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id

  if (!props.riddleList[id]) return
  if (isElementCompleted(id)) return
  if (!isElementUnlocked(id)) return

  clickedElement.value = id
  clickedSvgElement.value = element

  toggleRiddleModal()
}

function svgMouseOver(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id

  if (!props.riddleList[id]) return
  if (isElementCompleted(id)) return
  if (!isElementUnlocked(id)) return

  hoveredElement.value = id
  element.classList.add('hovered-svg-element')
}

function svgMouseOut(event) {
  const element = getSvgElement(event)
  if (!element) return

  const id = element.id

  if (hoveredElement.value === id) {
    hoveredElement.value = ''
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
  applyLockedStyling()
}

function applyLockedStyling() {
  const mapElement = document.getElementById('previewmap')
  for (const id in props.validElements) {
    if (props.validElements[id] === null) continue
    if (props.validElements[id] === '') continue

    const element = mapElement.querySelector(`#${CSS.escape(id)}`) // # + id doesn't work because of id naming with ':'
    if (isElementUnlocked(id)) {
      element.classList.remove('locked-svg-element')
    } else {
      element.classList.add('locked-svg-element')
    }
  }
}

function debug() {
  console.log(props.validElements)
}
</script>

<style lang="scss" scoped></style>

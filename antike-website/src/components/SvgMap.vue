<template>
  <!-- v-html because we need to inject the svg as html not text -->
  <div ref="container" class="h-full w-full" v-html="svgText" />
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue'
import {
  PLAIN_SVG_TEXT,
  ELEMENTS_DATA,
  EXTRACT_ELEMENTS,
  SET_SELECTED_ELEMENT,
} from '../injectionKeys.js'

const svgText = inject(PLAIN_SVG_TEXT, ref(''))
const elementsData = inject(ELEMENTS_DATA, ref({}))
const extractElements = inject(EXTRACT_ELEMENTS, () => {})
const setSelectedElement = inject(SET_SELECTED_ELEMENT, () => {})

const emit = defineEmits(['hoverChange'])

const container = ref(null)

// maps id to SVG-Element
const elements = ref({})

const HIGHLIGHT_CLASS = {
  Rätsel: 'highlight-raetsel',
  Dekoration: 'highlight-dekoration',
}

function setupHoverListeners() {
  const entries = Object.entries(elements.value)

  for (const [id, svgElement] of entries) {
    addListenersToElement(id, svgElement)
  }
}

function addListenersToElement(id, svgElement) {
  function getArt() {
    return elementsData.value?.[id]?.elementArt
  }

  function onEnter() {
    const art = getArt()

    if (art !== 'deaktiviert') {
      svgElement.classList.add(HIGHLIGHT_CLASS[art])
      emit('hoverChange', id)
    }
  }

  function onLeave() {
    for (const cls in HIGHLIGHT_CLASS) {
      svgElement.classList.remove(HIGHLIGHT_CLASS[cls])
    }
    emit('hoverChange', null)
  }

  function onClick() {
    const art = getArt()

    if (art !== 'deaktiviert') {
      setSelectedElement(id)
    }
  }

  svgElement.addEventListener('mouseenter', onEnter)
  svgElement.addEventListener('mouseleave', onLeave)
  svgElement.addEventListener('click', onClick)

  svgElement.style.cursor = 'pointer'
}

function extractSvgElements() {
  if (!svgText) return false
  const svg = container.value.querySelector('svg')

  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')

  const found = {}

  const svgElements = svg.querySelectorAll('[id]')

  for (const svgElement of svgElements) {
    found[svgElement.id] = svgElement
  }

  elements.value = found

  extractElements(Object.keys(found))
  setupHoverListeners()

  return true
}

//once the svg is shown for the first time extract the elements
onMounted(async function () {
  await nextTick()
  extractSvgElements()
})
defineExpose({ elements }) // needed for SvgSetupModal to access svg DOM-Elements
</script>

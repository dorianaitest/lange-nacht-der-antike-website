<template>
  <!-- v-html because we need to inject the svg as html not text -->
  <div ref="container" class="h-full w-full" v-html="svgText" />
</template>

<script setup>
import { ref, onMounted, nextTick, inject, watch, toRef } from 'vue'
import {
  PLAIN_SVG_TEXT,
  ELEMENTS_DATA,
  EXTRACT_ELEMENTS,
  SET_SELECTED_ELEMENT,
} from '../injectionKeys.js'

const svgText = inject(PLAIN_SVG_TEXT)
const elementsData = inject(ELEMENTS_DATA)
const extractElements = inject(EXTRACT_ELEMENTS, () => {})
const setSelectedElement = inject(SET_SELECTED_ELEMENT, () => {})

const emit = defineEmits(['hoverChange'])

const props = defineProps({
  highlightAll: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const container = ref(null)

// maps id to SVG-Element
const elements = ref({})

const HIGHLIGHT_CLASS = {
  Rätsel: 'highlight-riddle',
  'dynamische Dekoration': 'highlight-decoration',
}

function setupHoverListeners() {
  const entries = Object.entries(elements.value)

  for (const [id, svgElement] of entries) {
    addListenersToElement(id, svgElement)
  }
}

function getElementType(id) {
  return elementsData.value?.[id]?.elementArt
}

function addListenersToElement(id, svgElement) {
  function onEnter() {
    const elementType = getElementType(id)

    if (elementType !== 'Inaktiv') {
      svgElement.style.cursor = 'pointer'
      applyHighlight(svgElement, elementType)
      emit('hoverChange', id)
    } else {
      svgElement.style.cursor = 'default'
    }
  }

  function onLeave() {
    svgElement.style.cursor = ''
    //need to ensure we don't remove the highlighting if highlightAll is enabled
    if (!props.highlightAll) {
      removeHighlight(svgElement)
    }

    emit('hoverChange', null)
  }

  function onClick() {
    const elementType = getElementType(id)

    if (elementType !== 'Inaktiv') {
      setSelectedElement(id)
    }
  }

  svgElement.addEventListener('mouseenter', onEnter)
  svgElement.addEventListener('mouseleave', onLeave)
  svgElement.addEventListener('click', onClick)
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

//these helpers are new: maybe need to update other parts of code
function removeHighlight(svgElement) {
  for (const elementType in HIGHLIGHT_CLASS) {
    svgElement.classList.remove(HIGHLIGHT_CLASS[elementType])
  }
}

function applyHighlight(svgElement, elementType) {
  removeHighlight(svgElement)
  svgElement.classList.add(HIGHLIGHT_CLASS[elementType])
}

function updateAllHighlights(isHighlightActive) {
  const entries = Object.entries(elements.value)

  for (const [id, svgElement] of entries) {
    removeHighlight(svgElement)

    if (isHighlightActive) {
      const elementType = getElementType(id)
      applyHighlight(svgElement, elementType)
    }
  }
}

// need to make the boolean reactive; feels inefficient--> maybe debug later
const highlightAllRef = toRef(props, 'highlightAll')

watch(highlightAllRef, function (highlightAllIsActive) {
  updateAllHighlights(highlightAllIsActive)
})

// fixed bug where updating elementType didnt update highlighting (deep because it's a nested obj)
watch(
  elementsData,
  function () {
    if (props.highlightAll) {
      updateAllHighlights(true)
    }
  },
  { deep: true },
)

//once the svg is shown for the first time extract the elements
onMounted(async function () {
  await nextTick()
  extractSvgElements()
})

defineExpose({ elements }) // needed for SvgSetupModal to access svg DOM-Elements
</script>

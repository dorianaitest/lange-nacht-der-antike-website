<template>
  <!-- v-html because we need to inject the svg as html not text -->
  <div ref="container" class="h-full w-full min-h-0" v-html="svgText" />
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

/**
 * hover and click listeners for extracted SVG elements
 */
function setupHoverListeners() {
  const entries = Object.entries(elements.value)

  for (const [id, svgElement] of entries) {
    addListenersToElement(id, svgElement)
  }
}
/**
 * Returns configured role for SVG id.
 * @param {string} id - SVG element id.
 * @returns {string|undefined} 'Inaktiv' | 'Rätsel' | 'dynamische Dekoration', or undefined if the id isn't in elementsData.
 */
function getElementType(id) {
  return elementsData.value?.[id]?.elementArt
}

/**
 * mouseenter / mouseleave / click on one SVG element: hover highlights it
 * and emits 'hoverChange', click selects it. doesn't work for 'Inaktiv' elements.
 * @param {string} id - SVG element id.
 * @param {SVGElement} svgElement - DOM node.
 */
function addListenersToElement(id, svgElement) {
  /** Highlight + pointer cursor on hover, unless the element is inactive. */
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
  /** Clear the hover highlight (kept if "highlight all" is on) and the cursor. */
  function onLeave() {
    svgElement.style.cursor = ''
    if (!props.highlightAll) {
      removeHighlight(svgElement)
    }

    emit('hoverChange', null)
  }
  /** Select the element on click, unless it's inactive. */
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

/**
 * Reads the injected SVG once it's in the DOM. every '[id]' node mapped to
 * 'elements', uses ELEMENTS_DATA to extract elements into extractElements,
 * and sets up hover listeners.
 * @returns {boolean} False if no SVG text yet, true once processed.
 */
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

/**
 * Removes every highlight class from an SVG element.
 * @param{SVGElement} svgElement - element to clear.
 */
function removeHighlight(svgElement) {
  for (const elementType in HIGHLIGHT_CLASS) {
    svgElement.classList.remove(HIGHLIGHT_CLASS[elementType])
  }
}

/**
 * Applies highlight class for an element type, clearing any previous
 * @param {SVGElement} svgElement - element to highlight.
 * @param {string} elementType - 'Rätsel' | 'dynamische Dekoration'.
 */
function applyHighlight(svgElement, elementType) {
  removeHighlight(svgElement)
  svgElement.classList.add(HIGHLIGHT_CLASS[elementType])
}

/**
 * applies or clears highlights on every element, for the "Elemente
 * hervorheben" toggle.
 * @param {boolean} isHighlightActive - Whether the toggle is on.
 */
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

// need to make the boolean reactive
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

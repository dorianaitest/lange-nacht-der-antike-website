<template>
  <div ref="container" class="h-full w-full" :style="cssVars" v-html="props.svgText" />
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { isAccessible, getRiddleState, getDecorationState } from '@shared/gameLogic.js'

const props = defineProps({
  svgText: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  completedRiddles: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['riddleClick'])

const container = ref(null)

/**
* Build custom CSS properties for highlight and shroud styling of the SVG map.
* @returns {Object} A map of CSS variable name to their string values or defaults
*/
const cssVars = computed(function () {
  const styles = props.config.styles || {}
  return {
    '--preview-highlight-color': styles.highlightColor || 'var(--color-accent)',
    '--preview-highlight-stroke-width': (styles.highlightStrokeWidth ?? 1) + 'px',
    '--preview-shrouded-opacity': styles.shroudedOpacity ?? 0.2,
  }
})

// id -> SVGElement
const elements = {}

const ELEMENT_CLASSES = [
  'preview-riddle-accessible',
  'preview-riddle-completed',
  'preview-riddle-locked',
  'preview-riddle-hover',
  'preview-deco-hidden',
  'preview-deco-shrouded',
  'preview-deco-highlighted',
]

/**
 * Strips all preview-state CSS classes from an SVG element before reapplying the current one.
 * @param {SVGElement} svgElement - The element to clean up.
 */
function removeElementClasses(svgElement) {
  for (const className of ELEMENT_CLASSES) {
    svgElement.classList.remove(className)
  }
}

/**
 * Adds the CSS class matching a style value ('hidden' | 'shrouded' | 'highlighted').
 * @param {SVGElement} svgElement - element to style
 * @param {string} value - string value from elements style config
 */
function applyVisualClass(svgElement, value) {
  if (value === 'hidden') svgElement.classList.add('preview-deco-hidden')
  else if (value === 'shrouded') svgElement.classList.add('preview-deco-shrouded')
  else if (value === 'highlighted') svgElement.classList.add('preview-deco-highlighted')
}

/**
 * Applies the correct preview class and style to a riddle node based on its
 * current completed/accessible/locked state.
 * @param {string} id - riddle node id.
 * @param {SVGElement} svgElement - corresponding SVG element.
 */
function updateRiddleVisual(id, svgElement) {
  const element = props.config.nodes[id]
  const style = element.style || { locked: 'shrouded', accessible: 'highlighted', completed: 'none' }

  const state = getRiddleState(id, props.config, props.completedRiddles)
  svgElement.classList.add('preview-riddle-' + state)
  applyVisualClass(svgElement, style[state])
}

/**
 * Applies a decoration's style based on the most advanced state among its linked riddles.
 * @param {Object} element - decoration node config.
 * @param {SVGElement} svgElement - corresponding SVG element.
 */
function updateDecorationVisual(element, svgElement) {
  const state = getDecorationState(element, props.config, props.completedRiddles)
  applyVisualClass(svgElement, element.style[state])
}

/**
 * Refreshes the preview visuals for every node in the map to match the current completion state.
 */
function updateVisuals() {
  const entries = Object.entries(props.config.nodes)

  for (const [id, element] of entries) {
    const svgElement = elements[id]
    if (!svgElement) continue

    removeElementClasses(svgElement)

    if (element.type === 'riddle') {
      updateRiddleVisual(id, svgElement)
    } else if (element.type === 'decoration') {
      updateDecorationVisual(element, svgElement)
    }
  }
}

/**
 * Attaches click/hover listeners to every riddle node's SVG element.
 */
function setupListeners() {
  const entries = Object.entries(props.config.nodes)

  for (const [id, element] of entries) {
    if (element.type !== 'riddle') continue

    const svgElement = elements[id]
    if (!svgElement) continue

    function onClick() {
      if (!isAccessible(id, props.config, props.completedRiddles)) return

      emit('riddleClick', {
        id,
        riddle: element.riddle,
      })
    }

    function onEnter() {
      if (!isAccessible(id, props.config, props.completedRiddles)) return

      svgElement.classList.add('preview-riddle-hover')
      svgElement.style.cursor = 'pointer'
    }

    function onLeave() {
      svgElement.classList.remove('preview-riddle-hover')
    }

    svgElement.addEventListener('click', onClick)
    svgElement.addEventListener('mouseenter', onEnter)
    svgElement.addEventListener('mouseleave', onLeave)
  }
}

/**
 * Prepares the mounted SVG for interaction. Sets size, indexes its elements,
 * and wires up listeners and initial visuals.
 */
function initGame() {
  if (!container.value) return

  const svg = container.value.querySelector('svg')
  if (!svg) return

  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')

  const svgElements = svg.querySelectorAll('[id]')

  for (const svgElement of svgElements) {
    elements[svgElement.id] = svgElement
  }

  setupListeners()
  updateVisuals()
}

onMounted(async function () {
  await nextTick()
  initGame()
})

watch(props.completedRiddles, updateVisuals)

</script>

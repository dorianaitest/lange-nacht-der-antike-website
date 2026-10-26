<template>
  <div ref="container" class="h-full w-full" :style="cssVars" v-html="svgText" />
</template>

<script setup>
import { ref, computed, inject, watch, nextTick, onMounted } from 'vue'
import { PLAIN_SVG_TEXT } from '../injectionKeys.js'
import { isAccessible, getRiddleState, getDecorationState } from '@shared/gameLogic.js'

const svgText = inject(PLAIN_SVG_TEXT)

const props = defineProps({
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
 * Inline CSS custom properties that pass the styling config (highlight colour,
 * stroke width, shrouded opacity) into the preview stylesheet.
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

const PREVIEW_CLASSES = [
  'preview-riddle-accessible',
  'preview-riddle-completed',
  'preview-riddle-locked',
  'preview-riddle-hover',
  'preview-deco-hidden',
  'preview-deco-shrouded',
  'preview-deco-highlighted',
]

/**
 * Strips every preview-state class from an element before the current one is
 * reapplied.
 * @param {SVGElement} svgElement - element to clear.
 */
function removePreviewClasses(svgElement) {
  for (const className of PREVIEW_CLASSES) {
    svgElement.classList.remove(className)
  }
}
/**
 * Adds the decoration class matching a style value
 * 'none' or unknown value adds nothing.
 * @param {SVGElement} svgElement - element to style.
 * @param {string} value - 'hidden' | 'shrouded' | 'highlighted' | 'none'.
 */
function applyVisualClass(svgElement, value) {
  if (value === 'hidden') svgElement.classList.add('preview-deco-hidden')
  else if (value === 'shrouded') svgElement.classList.add('preview-deco-shrouded')
  else if (value === 'highlighted') svgElement.classList.add('preview-deco-highlighted')
}

/**
 * Applies the preview class and configured style for a riddle node based on its
 * current completed / accessible / locked state.
 * @param {string} id - The node id.
 * @param {SVGElement} svgElement - The matching element.
 */
function updateRiddleVisual(id, svgElement) {
  const element = props.config.nodes[id]
  const style = element.style || { locked: 'shrouded', accessible: 'highlighted', completed: 'none' }

  const state = getRiddleState(id, props.config, props.completedRiddles)
  svgElement.classList.add('preview-riddle-' + state)
  applyVisualClass(svgElement, style[state])
}

/**
 * Styles a decoration by most advanced state among linked riddles.
 * @param{Object} element - decoration node config.
 *@param {SVGElement} svgElement - matching element.
 */
function updateDecorationVisual(element, svgElement) {
  const state = getDecorationState(element, props.config, props.completedRiddles)
  applyVisualClass(svgElement, element.style[state])
}
/**
 * reapplies the preview visuals for every node to match the
 * current completion state.
 */
function updateVisuals() {
  const entries = Object.entries(props.config.nodes)

  for (const [id, element] of entries) {
    const svgElement = elements[id]
    if (!svgElement) continue

    removePreviewClasses(svgElement)

    if (element.type === 'riddle') {
      updateRiddleVisual(id, svgElement)
    } else if (element.type === 'decoration') {
      updateDecorationVisual(element, svgElement)
    }
  }
}
/**
* Attaches click and hover listeners to each riddle element. Clicks emit
* 'riddleClick'.
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
 * setup once the SVG is in the DOM: indexes every '[id]' element,
 * setup listeners and set initial visuals.
 */
function initPreview() {
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
  initPreview()
})

watch(props.completedRiddles, updateVisuals)
</script>

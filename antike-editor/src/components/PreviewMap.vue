<template>
  <div ref="container" class="h-full w-full" :style="cssVars" v-html="svgText" />
</template>

<script setup>
import { ref, computed, inject, watch, nextTick, onMounted } from 'vue'
import { PLAIN_SVG_TEXT } from '../injectionKeys.js'

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
 * Whether a riddle has been solved.
 * @param {string} id - node id.
 * @returns {boolean}
 */
function isCompleted(id) {
  return props.completedRiddles[id] === true
}

/**
 * Whether riddle node is currently unlocked and not yet completed.
 * The final riddle unlocks only once every other riddle is done.
 * any other node unlocks when it has no prerequisites or
 * any one of them is completed.
 * @param {string} id - The node id.
 * @returns {boolean}
 */
function isAccessible(id) {
  if (isCompleted(id)) return false

  const element = props.config.nodes[id]
  if (!element) return false
  if (element.type !== 'riddle') return false

  if (props.config.ordering === 'unordered') {
    return true
  }

  if (props.config.finalRiddleId && id === props.config.finalRiddleId) {
    for (const [nodeId, node] of Object.entries(props.config.nodes)) {
      if (nodeId !== id && node.type === 'riddle' && !isCompleted(nodeId)) {
        return false
      }
    }
    return true
  }

  if (!element.unlockAfterIds || element.unlockAfterIds.length === 0) {
    return true
  }

  for (const parentId of element.unlockAfterIds) {
    if (isCompleted(parentId)) return true
  }
  return false
}
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

  if (isCompleted(id)) {
    svgElement.classList.add('preview-riddle-completed')
    applyVisualClass(svgElement, style.completed)
    return
  }

  if (isAccessible(id)) {
    svgElement.classList.add('preview-riddle-accessible')
    applyVisualClass(svgElement, style.accessible)
    return
  }

  svgElement.classList.add('preview-riddle-locked')
  applyVisualClass(svgElement, style.locked)
}

/**
 * Maps a linked riddle's state to a decoration level: 0 locked, 1 accessible,
 * 2 completed.
 * @param {string} linkedId - linked riddle's node id.
 * @returns {number}
*/
function decorationLevel(linkedId) {
  if (isCompleted(linkedId)) return 2
  if (isAccessible(linkedId)) return 1
  return 0
}

const DECORATION_LEVEL_KEYS = ['locked', 'accessible', 'completed']
/**
 * Styles a decoration by most advanced state among linked riddles.
 * @param{Object} element - decoration node config.
 *@param {SVGElement} svgElement - matching element.
 */
function updateDecorationVisual(element, svgElement) {
  const linked = element.linkedElements || []

  let maxLevel = 0
  for (const linkedId of linked) {
    const level = decorationLevel(linkedId)
    if (level > maxLevel) maxLevel = level
  }

  applyVisualClass(svgElement, element.style[DECORATION_LEVEL_KEYS[maxLevel]])
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
      if (!isAccessible(id)) return

      emit('riddleClick', {
        id,
        riddle: element.riddle,
      })
    }

    function onEnter() {
      if (!isAccessible(id)) return

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

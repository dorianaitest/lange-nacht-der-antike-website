<template>
  <div ref="container" class="h-full w-full" :style="cssVars" v-html="props.svgText" />
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'

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
* Checks if a riddle has already been solved.
* @param {string} the riddle id to check
* returns {boolean} True if riddle is completed
*/
function isCompleted(id) {
  return props.completedRiddles[id] === true
}

/** 
* Determines if a node is currently unlocked and not completed.
* @param {string} the riddle id to check
* @param {Object} the full riddle config
* @param {Object} map of riddle id to completion status
* @returns {boolean} True if riddle is unlocked and not completed
*/
function isAccessible(id, config, completedRiddles) {
  if (completedRiddles[id] === true) return false

  const element = config.nodes[id]
  if (!element) return false
  if (element.type !== 'riddle') return false

  if (config.ordering === 'unordered') {
    return true
  }

  if (config.finalRiddleId && id === config.finalRiddleId) {
    return isFinalRiddleFullyUnlocked(id, config, completedRiddles)
  }

  if (!element.unlockAfterIds || element.unlockAfterIds.length === 0) {
    return true
  }

  for (const parentId of element.unlockAfterIds) {
    if (completedRiddles[parentId] === true) return true
  }
  return false
}

/**
 * Checks if every other riddle has been completed, the unlock condition
 * for the final riddle.
 * @param {string} final riddle's id
 * @param {Object} The full riddle config
 * @param {Object} map of riddle id to completed status
 * @returns {boolean} True if all other riddles are completed.
 */
function isFinalRiddleFullyUnlocked(id, config, completedRiddles) {
  for (const [nodeId, node] of Object.entries(config.nodes)) {
    if (nodeId !== id && node.type === 'riddle' && completedRiddles[nodeId] !== true) {
      return false
    }
  }
  return true
}

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
 * @param {SVGElement} element to style
 * @param {string} string value from elements style config
 */
function applyVisualClass(svgElement, value) {
  if (value === 'hidden') svgElement.classList.add('preview-deco-hidden')
  else if (value === 'shrouded') svgElement.classList.add('preview-deco-shrouded')
  else if (value === 'highlighted') svgElement.classList.add('preview-deco-highlighted')
}

/**
 * Applies the correct preview class and style to a riddle node based on its
 * current completed/accessible/locked state.
 * @param {string} riddle node id.
 * @param {SVGElement} corresponding SVG element.
 */
function updateRiddleVisual(id, svgElement) {
  const element = props.config.nodes[id]
  const style = element.style || { locked: 'shrouded', accessible: 'highlighted', completed: 'none' }

  if (isCompleted(id)) {
    svgElement.classList.add('preview-riddle-completed')
    applyVisualClass(svgElement, style.completed)
    return
  }

  if (isAccessible(id, props.config, props.completedRiddles)) {
    svgElement.classList.add('preview-riddle-accessible')
    applyVisualClass(svgElement, style.accessible)
    return
  }

  svgElement.classList.add('preview-riddle-locked')
  applyVisualClass(svgElement, style.locked)
}

/**
 * Maps a linked riddle's state to a decoration level (0 = locked, 1 = accessible, 2 = completed).
 * @param {string} linked riddle's node id.
 * @returns {number} decoration level.
 */
function decorationLevel(linkedId) {
  if (isCompleted(linkedId)) return 2
  if (isAccessible(linkedId, props.config, props.completedRiddles)) return 1
  return 0
}

const DECORATION_LEVEL_KEYS = ['locked', 'accessible', 'completed']

/**
 * Applies a decoration's style based on the most advanced state among its linked riddles.
 * @param {Object} decoration node config.
 * @param {SVGElement} corresponding SVG element.
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

/**
 * INSIDE DEV SERVER ONLY
 * Runs test for isAccessible against known scenarios
 * (final riddle unlocking, prerequisite-based unlocking) 
 */
function checkIsAccessibleBehavior() {
  const symbolRiddleFixtureConfig = {
    finalRiddleId: 'Roma',
    nodes: {
      Alpen: { type: 'riddle', unlockAfterIds: [] },
      Genua: { type: 'riddle', unlockAfterIds: ['Alpen'] },
      Rubico: { type: 'riddle', unlockAfterIds: ['Alpen'] },
      Roma: { type: 'riddle', unlockAfterIds: ['[last]'] },
    },
  }
  console.assert(
    isAccessible('Roma', symbolRiddleFixtureConfig, { Alpen: true, Genua: true, Rubico: false }) === false,
    'isAccessible: final riddle should stay locked until every other riddle is completed',
  )
  console.assert(
    isAccessible('Roma', symbolRiddleFixtureConfig, { Alpen: true, Genua: true, Rubico: true }) === true,
    'isAccessible: final riddle should unlock once every other riddle is completed',
  )

  const standardFixtureConfig = {
    nodes: {
      Alpen: { type: 'riddle', unlockAfterIds: [] },
      Genua: { type: 'riddle', unlockAfterIds: ['Alpen'] },
      Rubico: { type: 'riddle', unlockAfterIds: ['Alpen'] },
      Roma: { type: 'riddle', unlockAfterIds: ['Rubico', 'Genua'] },
    },
  }
  console.assert(
    isAccessible('Roma', standardFixtureConfig, { Alpen: true, Genua: false, Rubico: false }) === false,
    'isAccessible: riddle should stay locked until at least one prerequisite is completed',
  )
  console.assert(
    isAccessible('Roma', standardFixtureConfig, { Alpen: true, Genua: true, Rubico: false }) === true,
    'isAccessible: riddle should unlock once any one of its prerequisites is completed',
  )
  console.assert(
    isAccessible('Alpen', standardFixtureConfig, {}) === true,
    'isAccessible: a riddle with no prerequisites should always be accessible',
  )
}

if (import.meta.env.DEV) {
  checkIsAccessibleBehavior()
}
</script>

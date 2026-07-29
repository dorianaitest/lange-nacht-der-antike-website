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

function isCompleted(id) {
  return props.completedRiddles[id] === true
}

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

function removePreviewClasses(svgElement) {
  for (const className of PREVIEW_CLASSES) {
    svgElement.classList.remove(className)
  }
}

function applyVisualClass(svgElement, value) {
  if (value === 'hidden') svgElement.classList.add('preview-deco-hidden')
  else if (value === 'shrouded') svgElement.classList.add('preview-deco-shrouded')
  else if (value === 'highlighted') svgElement.classList.add('preview-deco-highlighted')
}

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

function decorationLevel(linkedId) {
  if (isCompleted(linkedId)) return 2
  if (isAccessible(linkedId)) return 1
  return 0
}

const DECORATION_LEVEL_KEYS = ['locked', 'accessible', 'completed']

function updateDecorationVisual(element, svgElement) {
  const linked = element.linkedElements || []

  let maxLevel = 0
  for (const linkedId of linked) {
    const level = decorationLevel(linkedId)
    if (level > maxLevel) maxLevel = level
  }

  applyVisualClass(svgElement, element.style[DECORATION_LEVEL_KEYS[maxLevel]])
}

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

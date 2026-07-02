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

const emit = defineEmits(['raetselClick'])

const container = ref(null)

const cssVars = computed(function () {
  const s = props.config.styles || {}
  return {
    '--preview-highlight-color': s.highlightColor || 'var(--color-accent)',
    '--preview-highlight-stroke-width': (s.highlightStrokeWidth ?? 1) + 'px',
    '--preview-shrouded-opacity': s.shroudedOpacity ?? 0.2,
  }
})

// id -> SVGElement
const elements = {}

const PREVIEW_CLASSES = [
  'preview-raetsel-accessible',
  'preview-raetsel-completed',
  'preview-raetsel-locked',
  'preview-raetsel-hover',
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
  if (element.type !== 'rätsel') return false

  if (props.config.ordering === 'unordered') {
    return true
  }

  if (props.config.abschlussRaetselId && id === props.config.abschlussRaetselId) {
    for (const [nodeId, node] of Object.entries(props.config.nodes)) {
      if (nodeId !== id && node.type === 'rätsel' && !isCompleted(nodeId)) {
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
  for (const cls of PREVIEW_CLASSES) {
    svgElement.classList.remove(cls)
  }
}

function applyVisualClass(svgElement, value) {
  if (value === 'hidden') svgElement.classList.add('preview-deco-hidden')
  else if (value === 'shrouded') svgElement.classList.add('preview-deco-shrouded')
  else if (value === 'highlighted') svgElement.classList.add('preview-deco-highlighted')
}

function updateRiddleVisual(id, svgElement) {
  const element = props.config.nodes[id]
  const style = element.style || { gesperrt: 'shrouded', zugaenglich: 'highlighted', geloest: 'none' }

  if (isCompleted(id)) {
    svgElement.classList.add('preview-raetsel-completed')
    applyVisualClass(svgElement, style.geloest)
    return
  }

  if (isAccessible(id)) {
    svgElement.classList.add('preview-raetsel-accessible')
    applyVisualClass(svgElement, style.zugaenglich)
    return
  }

  svgElement.classList.add('preview-raetsel-locked')
  applyVisualClass(svgElement, style.gesperrt)
}

function updateDecorationVisual(element, svgElement) {
  let style = element.stateBefore

  const linked = element.linkedElements || []
  for (const linkedId of linked) {
    if (isCompleted(linkedId)) {
      style = element.stateAfter
      break
    }
  }

  if (style === 'hidden') {
    svgElement.classList.add('preview-deco-hidden')
  } else if (style === 'shrouded') {
    svgElement.classList.add('preview-deco-shrouded')
  } else if (style === 'highlighted') {
    svgElement.classList.add('preview-deco-highlighted')
  }
}

function updateVisuals() {
  const entries = Object.entries(props.config.nodes)

  for (const [id, element] of entries) {
    const svgElement = elements[id]
    if (!svgElement) continue

    removePreviewClasses(svgElement)

    if (element.type === 'rätsel') {
      updateRiddleVisual(id, svgElement)
    } else if (element.type === 'dekoration') {
      updateDecorationVisual(element, svgElement)
    }
  }
}

function setupListeners() {
  const entries = Object.entries(props.config.nodes)

  for (const [id, element] of entries) {
    if (element.type !== 'rätsel') continue

    const svgElement = elements[id]
    if (!svgElement) continue

    function onClick() {
      if (!isAccessible(id)) return

      emit('raetselClick', {
        id,
        riddle: element.riddle,
      })
    }

    function onEnter() {
      if (!isAccessible(id)) return

      svgElement.classList.add('preview-raetsel-hover')
      svgElement.style.cursor = 'pointer'
    }

    function onLeave() {
      svgElement.classList.remove('preview-raetsel-hover')
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

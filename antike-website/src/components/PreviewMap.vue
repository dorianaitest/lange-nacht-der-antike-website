<script setup>
import { ref, inject, watch, nextTick, onMounted } from 'vue'
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

const emit = defineEmits(['raetsel-click'])

const container = ref(null)

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

  if (!element.unlockAfterId) {
    return true
  }

  return isCompleted(element.unlockAfterId)
}

function removePreviewClasses(svgElement) {
  for (const cls of PREVIEW_CLASSES) {
    svgElement.classList.remove(cls)
  }
}

function updateRiddleVisual(id, svgElement) {
  if (isCompleted(id)) {
    svgElement.classList.add('preview-raetsel-completed')
    return
  }

  if (isAccessible(id)) {
    svgElement.classList.add('preview-raetsel-accessible')
    return
  }

  svgElement.classList.add('preview-raetsel-locked')
}

function updateDecorationVisual(element, svgElement) {
  let style = element.stateBefore

  if (element.linkedElement && isCompleted(element.linkedElement)) {
    style = element.stateAfter
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

      emit('raetsel-click', {
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

<template>
  <div ref="container" class="h-full w-full" v-html="svgText" />
</template>

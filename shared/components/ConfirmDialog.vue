<template>
  <div class="modal-overlay">
    <div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
      <div class="scroll-body">
        <h3 id="confirmDialogTitle" class="mb-3 text-lg font-semibold text-ink">{{ title }}</h3>
        <p class="text-sm text-ink-secondary">{{ message }}</p>
      </div>
      <div class="mt-5 flex gap-2">
        <BaseButton ref="cancelButton" variant="secondary" @click="emit('cancel')">{{ cancelLabel }}</BaseButton>
        <BaseButton @click="emit('confirm')">{{ confirmLabel }}</BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BaseButton from './BaseButton.vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  cancelLabel: { type: String, default: 'Abbrechen' },
})

const emit = defineEmits(['confirm', 'cancel'])

const cancelButton = ref(null)

/**
 * Cancels on Escape, wherever the focus is (a click on the card moves it to the body).
 * @param {KeyboardEvent} event - the pressed key.
 */
function onKeydown(event) {
  if (event.key === 'Escape') emit('cancel')
}

// focus starts on cancel, so a double click or Enter on the opening button does not confirm right away
onMounted(function () {
  cancelButton.value.$el.focus()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(function () {
  window.removeEventListener('keydown', onKeydown)
})
</script>

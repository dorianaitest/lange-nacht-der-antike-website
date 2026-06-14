<template>
  <!-- emit close for UX behavior -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <!-- :style handles the transform from string to css value -->
    <div class="flex flex-col rounded-xl bg-white" :style="{ width, height, maxHeight }">
      <div class="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
        <h2 class="text-base font-bold text-gray-800">{{ title }}</h2>
        <BaseButton @click="emit('close')">✕</BaseButton>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
import BaseButton from './BaseButton.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  width: {
    type: String,
    default: '50vw',
  },
  height: {
    type: String,
    default: '50vh',
  },
  maxHeight: {
    type: String,
    default: undefined,
  },
})

const emit = defineEmits(['close'])
</script>

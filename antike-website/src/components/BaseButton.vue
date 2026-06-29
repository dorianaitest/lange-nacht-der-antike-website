<template>
  <button
    class="cursor-pointer rounded-lg px-4 py-2 text-white"
    :class="active ? 'bg-blue-800 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})
</script>

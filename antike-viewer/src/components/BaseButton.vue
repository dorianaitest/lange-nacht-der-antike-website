<template>
  <button
    :class="[
      'btn-' + variant,
      { 'btn-active': isActive && variant === 'primary' },
      { 'btn-secondary-active': isActive && variant === 'secondary' },
    ]"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'primary',
  },
})
</script>

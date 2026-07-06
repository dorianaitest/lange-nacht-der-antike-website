<template>
  <button
    :class="[
      'btn-' + variant,
      { 'btn-active': active && variant === 'primary' },
      { 'btn-secondary-active': active && variant === 'secondary' },
    ]"
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
  variant: {
    type: String,
    default: 'primary',
  },
})
</script>

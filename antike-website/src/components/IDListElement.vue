<template>
  <label class="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      :checked="checked"
      @change="emit('toggle', $event.target.checked)"
      class="h-4 w-4"
    />
    <p class="text-text">
      <slot />
    </p>
  </label>
</template>

<script setup>
defineProps({
  checked: {
    type: Boolean,
    required: true,
  }
})

const emit = defineEmits(['toggle'])
</script>

<style lang="scss" scoped></style>
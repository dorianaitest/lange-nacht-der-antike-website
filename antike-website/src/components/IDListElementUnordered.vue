<template>
  <label class="flex cursor-pointer items-center gap-2">
    <input
      type="checkbox"
      :checked="checked !== 0"
      @change="emit('toggleElementStatus', $event.target.checked)"
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
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleElementStatus'])
</script>

<style lang="scss" scoped></style>

<template>
  <div class="flex justify-between">
    <label class="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        :checked="order !== 0"
        @change="emit('toggleElementStatus', $event.target.checked)"
        class="h-4 w-4"
      />
      <p class="text-text">
        <slot />
      </p>
    </label>
    <div>
      <select
        :disabled="order === 0"
        :value="order"
        @change="emit('changeOrder', Number($event.target.value))"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2"
      >
        <option disabled value="">Select the Order of the Element</option>
        <option v-for="elementOrder in maxElementOrder" :key="elementOrder" :value="elementOrder">
          {{ elementOrder }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
defineProps({
  order: {
    type: Number,
    required: true,
  },
  maxElementOrder: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleElementStatus', 'changeOrder'])
</script>

<style lang="scss" scoped></style>

<template>
  <div class="flex justify-between">
    <label class="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        :checked="props.unlockAfterId !== null"
        @change="emit('toggleElementStatus', $event.target.checked)"
        class="h-4 w-4"
      />

      <p class="text-text">
        <slot />
      </p>
    </label>

    <div>
      <select
        :disabled="props.unlockAfterId === null"
        :value="props.unlockAfterId ?? ''"
        @change="emit('changeUnlockId', $event.target.value)"
        class="rounded-lg border border-gray-300 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Start</option>

        <option v-for="[id, dependency] in enabledIds" :key="id" :value="id">
          {{ id }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ownId: {
    type: String,
    required: true,
  },

  unlockAfterId: {
    type: [String, null],
    required: true,
  },

  ids: {
    type: Object,
    required: true,
  },
})

const enabledIds = computed(() =>
  Object.entries(props.ids).filter(([id, unlockAfterId]) => {
    return unlockAfterId !== null && id !== props.ownId
  }),
)

const emit = defineEmits(['toggleElementStatus', 'changeUnlockId'])
</script>

<style lang="scss" scoped></style>

<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex max-h-[80%] min-h-[50%] w-full max-w-[80%] flex-col rounded-xl p-6 shadow-xl"
    >
      <h2 class="text-text text-xl">List of IDs for clickable Elements</h2>
      <p class="text-text">Check / Uncheck the boxes to make the elements clickable</p>
      <div>
        <p>Current Mode: {{ mode }}</p>
        <BaseButton @click="emit('toggleMode')">Change Mode</BaseButton>
      </div>
      <div v-if="mode === 'unordered'" class="m-3 overflow-y-auto rounded-2xl bg-gray-200 p-3">
        <IDListElementUnordered
          v-for="(order, id) in ids"
          :key="id"
          :order="order"
          @toggleElementStatus="emit('toggleElementStatus', id, $event)"
        >
          {{ id }}
        </IDListElementUnordered>
      </div>
      <div v-if="mode === 'ordered'" class="m-3 overflow-y-auto rounded-2xl bg-gray-200 p-3">
        <IDListElementOrdered
          v-for="(order, id) in ids"
          :key="id"
          :order="order"
          :maxElementOrder="maxElementOrder"
          @toggleElementStatus="emit('toggleElementStatus', id, $event)"
        >
          {{ id }}
        </IDListElementOrdered>
      </div>
      <BaseButton @click="emit('toggleIdList')">Exit</BaseButton>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import IDListElementUnordered from './IDListElementUnordered.vue'
import IDListElementOrdered from './IDListElementOrdered.vue'

defineProps({
  ids: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  maxElementOrder: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['toggleElementStatus', 'toggleIdList', 'toggleMode'])
</script>

<style lang="scss" scoped></style>

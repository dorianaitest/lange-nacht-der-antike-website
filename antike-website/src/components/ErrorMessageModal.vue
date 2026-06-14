<template>
  <BaseModal title="Konfigurationsfehler" width="40vw" height="auto" @close="emit('close')">
    <div class="flex flex-col gap-4 px-5 py-4">
      <p class="text-sm text-gray-600">
        Bitte behebe die folgenden Probleme, bevor du fortfährst:
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="(error, index) in errors"
          :key="index"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {{ error }}
        </li>
      </ul>

    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  errors: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['close'])
</script>

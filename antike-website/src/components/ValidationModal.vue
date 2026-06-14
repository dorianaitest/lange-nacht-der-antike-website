<template>
  <BaseModal title="Konfiguration prüfen" width="40vw" height="auto" maxHeight="80vh" @close="emit('close')">
    <div class="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
      <p class="shrink-0 text-sm text-gray-600">
        Bitte prüfe die folgenden Hinweise, bevor du fortfährst:
      </p>

      <ul class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        <li
          v-for="(error, index) in errors"
          :key="'err' + index"
          class="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {{ error }}
        </li>
        <li
          v-for="(warning, index) in warnings"
          :key="'warn' + index"
          class="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
        >
          {{ warning }}
        </li>
      </ul>

      <div v-if="errors.length === 0" class="shrink-0 flex justify-end">
        <BaseButton @click="emit('proceed')">Trotzdem fortfahren</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

defineProps({
  errors: {
    type: Array,
    required: true,
  },
  warnings: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['close', 'proceed'])
</script>

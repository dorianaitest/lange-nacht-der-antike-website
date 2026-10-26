<template>
  <BaseModal title="Konfiguration prüfen" width="40vw" height="auto" maxHeight="80vh" @close="emit('close')">
    <div class="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
      <p class="shrink-0 text-sm text-ink-secondary">
        Bitte prüfe die folgenden Hinweise, bevor du fortfährst:
      </p>

      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <div v-if="errors.length" class="flex flex-col gap-2">
          <p class="text-xs"><span class="font-semibold text-danger-600">Fehler:</span> <span class="text-ink-muted">Export nicht möglich, muss zuerst behoben werden.</span></p>
          <ul class="flex flex-col gap-2">
            <li
              v-for="(error, index) in errors"
              :key="'err' + index"
              class="shrink-0 alert-error"
            >
              <span class="font-semibold text-danger-600">Fehler:</span> {{ error }}
            </li>
          </ul>
        </div>

        <div v-if="warnings.length" class="flex flex-col gap-2">
          <p class="text-xs"><span class="font-semibold text-warning-800">Hinweis:</span> <span class="text-ink-muted">Export möglich, sollte aber geprüft werden.</span></p>
          <ul class="flex flex-col gap-2">
            <li
              v-for="(warning, index) in warnings"
              :key="'warn' + index"
              class="shrink-0 alert-warning"
            >
              <span class="font-semibold text-warning-800">Hinweis:</span> {{ warning }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="errors.length === 0 && canProceed" class="shrink-0 flex justify-end">
        <BaseButton variant="danger" @click="emit('proceed')">Trotzdem fortfahren</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'

defineProps({
  errors: {
    type: Array,
    required: true,
  },
  warnings: {
    type: Array,
    required: true,
  },
  canProceed: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close', 'proceed'])
</script>

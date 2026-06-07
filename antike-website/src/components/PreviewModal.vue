<template>
  <BaseModal title="Vorschau" width="90vw" height="90vh" @close="$emit('close')">
    <div class="flex overflow-hidden">
      <SvgMap class="h-full w-full" />
    </div>
  </BaseModal>
</template>

<script setup>
import { provide } from 'vue'
import { EXTRACT_ELEMENTS, SELECTED_ELEMENT_ID } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'
import SvgMap from './SvgMap.vue'

defineEmits(['close'])

provide(EXTRACT_ELEMENTS, () => {})
provide(SELECTED_ELEMENT_ID, () => {})
</script>

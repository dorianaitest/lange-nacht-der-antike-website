<template>
  <BaseModal title="Modus wählen" :closeable="false">
    <div class="flex items-center justify-center gap-4 p-8">
      <BaseButton @click="emit('pick', 'Einfach')">Einfach</BaseButton>
      <BaseButton @click="emit('pick', 'Spezial')">Spezial</BaseButton>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const emit = defineEmits(['pick', 'close'])
</script>

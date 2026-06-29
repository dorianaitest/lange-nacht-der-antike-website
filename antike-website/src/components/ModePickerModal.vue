<template>
  <BaseModal title="Rätselmodus wählen" :closeable="false" width="auto" height="auto">
    <div class="flex gap-6 p-8">
      <button
        class="w-52 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-blue-500 hover:bg-blue-50"
        @click="emit('pick', 'Standard')"
      >
        <p class="text-base font-semibold text-gray-900">Standard</p>
        <p class="mt-2 text-sm leading-relaxed text-gray-500">
          Jedes Rätsel hat eine Frage, Antwort und ein Symbol als Belohnung. Die Reihenfolge ist
          frei konfigurierbar.
        </p>
      </button>
      <button
        class="w-52 cursor-pointer rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-blue-500 hover:bg-blue-50"
        @click="emit('pick', 'Symbolraetsel')"
      >
        <p class="text-base font-semibold text-gray-900">Symbolrätsel</p>
        <p class="mt-2 text-sm leading-relaxed text-gray-500">
          Wie Standard, aber mit einem Abschluss-Rätsel: Spieler sammeln Symbole und identifizieren
          am Ende das fehlende.
        </p>
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['pick', 'close'])
</script>

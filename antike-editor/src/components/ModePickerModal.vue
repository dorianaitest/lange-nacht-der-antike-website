<template>
  <BaseModal title="Rätselmodus wählen" :isCloseable="false" width="auto" height="auto">
    <div class="flex gap-6 p-8">
      <button
        class="mode-card"
        @click="emit('pick', 'Standard')"
      >
        <p class="dialog-title">Standard</p>
        <p class="mode-description">
          Jedes Rätsel hat eine Frage, Antwort und ein Symbol als Belohnung. Die Reihenfolge ist
          frei konfigurierbar.
        </p>
      </button>
      <button
        class="mode-card"
        @click="emit('pick', 'SymbolRiddle')"
      >
        <p class="dialog-title">Symbolrätsel</p>
        <p class="mode-description">
          Wie Standard, aber mit einem Abschluss-Rätsel: Spieler sammeln Symbole und identifizieren
          am Ende das fehlende.
        </p>
      </button>
    </div>
    <div class="pb-6 text-center">
      <button
        class="cursor-pointer text-sm text-ink-subtle hover:text-ink-secondary"
        @click="emit('close')"
      >
        Andere Datei wählen
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['pick', 'close'])
</script>

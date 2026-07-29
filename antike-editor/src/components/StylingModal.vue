<template>
  <BaseModal title="Darstellung" @close="emit('close')">
    <div class="flex flex-col gap-6 px-5 py-5">
      <div class="form-group">
        <label for="highlight-color" class="form-label">Farbe für hervorgehobene Elemente</label>
        <input
          id="highlight-color"
          type="color"
          v-model="stylingConfig.highlightColor"
          class="h-9 w-16 cursor-pointer rounded border border-border"
        />
      </div>

      <div class="form-group">
        <div class="flex items-center justify-between">
          <label for="stroke-width" class="form-label">Strichstärke</label>
          <span class="font-mono text-xs text-ink">{{ stylingConfig.highlightStrokeWidth }}px</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-8 text-right text-xs text-ink-muted">dünn</span>
          <input
            id="stroke-width"
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            v-model.number="stylingConfig.highlightStrokeWidth"
            class="flex-1"
          />
          <span class="w-8 text-xs text-ink-muted">dick</span>
        </div>
      </div>

      <div class="form-group">
        <div class="flex items-center justify-between">
          <label for="shrouded-opacity" class="form-label">Sichtbarkeit gesperrter Elemente</label>
          <span class="font-mono text-xs text-ink">{{ Math.round(stylingConfig.shroudedOpacity * 100) }}%</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-16 text-right text-xs text-ink-muted">unsichtbar</span>
          <input
            id="shrouded-opacity"
            type="range"
            min="0"
            max="1"
            step="0.05"
            v-model.number="stylingConfig.shroudedOpacity"
            class="flex-1"
          />
          <span class="w-24 text-xs text-ink-muted">voll sichtbar</span>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { inject } from 'vue'
import { STYLING_CONFIG } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['close'])

const stylingConfig = inject(STYLING_CONFIG)
</script>

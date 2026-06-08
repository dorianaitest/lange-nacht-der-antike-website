<template>
  <BaseModal title="Reihenfolge" width="70vw" height="70vh" @close="emit('close')">
    <div class="flex-1 overflow-y-auto p-6">
      <section>
        <p class="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">Freischaltung</p>

        <p v-if="raetselEntries.length === 0" class="text-sm text-gray-400">
          Noch keine Rätsel-Elemente vorhanden.
        </p>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="[id, entry] in raetselEntries"
            :key="id"
            class="flex items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <span class="min-w-0 flex-1 truncate font-mono text-sm text-gray-800" :title="id">
              {{ id }}
            </span>

            <div class="flex shrink-0 items-center gap-2">
              <span class="text-sm whitespace-nowrap text-gray-500"> Freischalten nach: </span>

              <select v-model="entry.riddle.unlockAfterId" :class="SELECT_CLASS">
                <option :value="null">Start</option>

                <option
                  v-for="[otherId] in raetselEntries"
                  :key="otherId"
                  :value="otherId"
                  :disabled="otherId === id"
                >
                  {{ otherId }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-6">
        <p class="mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
          Abschlussnachricht
        </p>
        <textarea
          v-model="completionMessage"
          rows="3"
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          placeholder="Du hast es geschaft! Nun hast du ..."
        />
      </section>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, inject } from 'vue'
import { ELEMENTS_DATA, COMPLETION_MESSAGE } from '../injectionKeys.js'
import BaseModal from './BaseModal.vue'

const emit = defineEmits(['close'])

const elementsData = inject(ELEMENTS_DATA)
const completionMessage = inject(COMPLETION_MESSAGE)

const raetselEntries = computed(function () {
  const result = []

  for (const id in elementsData.value) {
    const entry = elementsData.value[id]

    if (entry.elementArt === 'Rätsel') {
      result.push([id, entry])
    }
  }

  return result
})

const SELECT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 cursor-pointer'
</script>

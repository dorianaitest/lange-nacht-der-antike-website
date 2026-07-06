<template>
  <aside class="sidebar-panel">
    <template v-if="entry">
      <div class="sidebar-header">
        <h2 class="sidebar-title truncate" :title="selectedId">
          {{ selectedId }}
        </h2>
        <button
          class="icon-btn"
          @click="setSelectedElement(null)"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
        <!-- Rätsel-Template -->
        <template v-if="entry.elementArt === 'Rätsel'">
          <div class="flex flex-col gap-4">
            <p class="text-xs text-ink-subtle">* Pflichtfeld</p>

            <div class="form-group">
              <label for="riddleQuestion" class="form-label"> Frage* </label>

              <textarea
                id="riddleQuestion"
                v-model="riddle.question"
                rows="3"
                required
                class="form-input"
                placeholder="Rätsel oder Frage eingeben..."
              />
            </div>

            <div class="form-group">
              <label for="riddleAnswer" class="form-label"> Antwort* </label>

              <textarea
                id="riddleAnswer"
                v-model="riddle.answer"
                rows="3"
                required
                class="form-input"
                placeholder="Korrekte Antwort..."
              />
            </div>

            <div class="form-group">
              <label for="riddleSuccess" class="form-label">
                Erfolgstext*
              </label>

              <textarea
                id="riddleSuccess"
                v-model="riddle.successText"
                rows="3"
                required
                class="form-input"
                placeholder="Text nach richtiger Antwort..."
              />
            </div>
            <div v-if="selectedMode !== 'Symbolraetsel'" class="form-group">
              <label class="form-label">Symbol</label>

              <input
                ref="iconInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="iconSelected"
              />

              <div v-if="riddle.iconPreview">
                <img
                  :src="riddle.iconPreview"
                  alt="Symbol Vorschau"
                  class="h-16 w-16 rounded-lg border border-border-subtle object-cover"
                />
              </div>

              <BaseButton variant="secondary" @click="openIconDialogue">
                {{ riddle.iconPreview ? 'Symbol ersetzen' : 'Symbol hochladen' }}
              </BaseButton>
            </div>

            <div
              v-if="selectedMode === 'Symbolraetsel' && selectedId === abschlussRaetselId"
              class="form-section"
            >
              <p class="section-header">Symbolauswahl</p>

              <div class="form-group">
                <label for="symbolPickerPrompt" class="form-label">
                  Hinweistext
                </label>
                <textarea
                  id="symbolPickerPrompt"
                  v-model="symbolPickerData.prompt"
                  rows="3"
                  class="form-input"
                  placeholder="Hinweistext über den Symbolen..."
                />
              </div>

              <div class="form-group">
                <label for="symbolPickerSuccess" class="form-label">
                  Erfolgstext
                </label>
                <textarea
                  id="symbolPickerSuccess"
                  v-model="symbolPickerData.successText"
                  rows="3"
                  class="form-input"
                  placeholder="Text nach richtiger Symbolauswahl..."
                />
              </div>
            </div>

            <div class="form-section">
              <p class="section-header">Erscheinung</p>

              <div class="form-group">
                <p class="text-sm text-ink-secondary">Gesperrt:</p>
                <select v-model="riddle.style.gesperrt" class="form-select">
                  <option v-for="style in DECO_STYLES" :key="style.value" :value="style.value">
                    {{ style.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <p class="text-sm text-ink-secondary">Zugänglich:</p>
                <select v-model="riddle.style.zugaenglich" class="form-select">
                  <option v-for="style in RAETSEL_STYLES_ZUGAENGLICH" :key="style.value" :value="style.value">
                    {{ style.label }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <p class="text-sm text-ink-secondary">Gelöst:</p>
                <select v-model="riddle.style.geloest" class="form-select">
                  <option v-for="style in DECO_STYLES" :key="style.value" :value="style.value">
                    {{ style.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </template>

        <!-- Dekoration-Template -->
        <template v-if="entry.elementArt === 'dynamische Dekoration'">
          <div class="flex flex-col gap-4">
            <div class="form-group">
              <p class="text-sm text-ink-secondary">Freigeschaltet durch Rätsel (eines davon reicht):</p>

              <p v-if="raetselIds.length === 0" class="hint-text">
                Noch keine Rätsel vorhanden.
              </p>

              <div v-else class="flex flex-col gap-1">
                <label
                  v-for="id in raetselIds"
                  :key="id"
                  class="checkbox-label"
                >
                  <input
                    type="checkbox"
                    :value="id"
                    v-model="deco.linkedElements"
                    class="cursor-pointer"
                  />
                  <span class="mono-truncate" :title="id">{{ id }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <p class="text-sm text-ink-secondary">Dekoration vor Freischaltung:</p>
              <select v-model="deco.stateBefore" class="form-select">
                <option v-for="style in DECO_STYLES" :key="style.value" :value="style.value">
                  {{ style.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <p class="text-sm text-ink-secondary">Dekoration nach Freischaltung:</p>
              <select v-model="deco.stateAfter" class="form-select">
                <option v-for="style in DECO_STYLES" :key="style.value" :value="style.value">
                  {{ style.label }}
                </option>
              </select>
            </div>
          </div>
        </template>
      </div>
    </template>
    <template v-else>
      <!-- Empty state -->
      <div class="flex flex-1 items-center justify-center px-6">
        <p class="text-center text-sm text-ink-subtle">
          Klicke ein Rätsel oder eine dynamische Dekoration auf der Karte, um es zu konfigurieren.
          Elemente werden zuerst im Ebenen-Panel einer Rolle zugewiesen.
        </p>
      </div>
    </template>
  </aside>
</template>

<script setup>
//computed allows to recalculate easily once selectedId changes
import { ref, computed, inject } from 'vue'
import { SELECTED_ELEMENT_ID, SET_SELECTED_ELEMENT, ELEMENTS_DATA, SELECTED_MODE, ABSCHLUSS_RAETSEL_ID, SYMBOL_PICKER_DATA } from '../injectionKeys.js'
import BaseButton from './BaseButton.vue'

const selectedId = inject(SELECTED_ELEMENT_ID)
const setSelectedElement = inject(SET_SELECTED_ELEMENT)
const elementsData = inject(ELEMENTS_DATA)
const selectedMode = inject(SELECTED_MODE)
const abschlussRaetselId = inject(ABSCHLUSS_RAETSEL_ID)
const symbolPickerData = inject(SYMBOL_PICKER_DATA)

const iconInput = ref(null)

const DECO_STYLES = [
  { value: 'hidden', label: 'versteckt' },
  { value: 'none', label: 'normal' },
  { value: 'shrouded', label: 'verschleiert' },
  { value: 'highlighted', label: 'hervorgehoben' },
]

const RAETSEL_STYLES_ZUGAENGLICH = [
  { value: 'none', label: 'normal' },
  { value: 'shrouded', label: 'verschleiert' },
  { value: 'highlighted', label: 'hervorgehoben' },
]

const entry = computed(function () {
  if (!selectedId.value) return null

  return elementsData.value[selectedId.value]
})

const riddle = computed(function () {
  return entry.value?.riddle
})

const deco = computed(function () {
  return entry.value?.deco
})

const raetselIds = computed(function () {
  const entries = Object.entries(elementsData.value)
  const result = []

  for (const [id, element] of entries) {
    if (element.elementArt === 'Rätsel') result.push(id)
  }
  return result
})

function openIconDialogue() {
  iconInput.value.click()
}

function iconSelected(e) {
  const file = e.target.files?.[0]

  const reader = new FileReader()

  reader.readAsDataURL(file)

  reader.onload = function (e) {
    riddle.value.iconPreview = e.target.result
    riddle.value.iconFile = file
  }

  e.target.value = ''
}
</script>

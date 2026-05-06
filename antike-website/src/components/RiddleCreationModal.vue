<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex max-h-[80%] min-h-[50%] w-full max-w-lg flex-col justify-around rounded-xl p-6 shadow-xl"
    >
      <h2 class="text-2xl">Riddle Creation for: {{ id }}</h2>
      <h3 class="text-xl">Riddle</h3>
      <input
        v-model="riddle"
        type="text"
        placeholder="What is always spelled incorrectly in a dictionary?"
      />
      <h3 class="text-xl">Answer</h3>
      <input v-model="answer" type="text" placeholder="incorrectly" />
      <BaseButton
        @click="
          emit('riddleSaved', { id: id, riddle: riddle, answer: answer });
          cancel()
        "
        >Save</BaseButton
      >
      <BaseButton @click="cancel">Cancel</BaseButton>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { ref } from 'vue'

const riddle = ref('')
const answer = ref('')

function cancel() {
  riddle.value = ''
  answer.value = ''
  emit('cancel')
}

const emit = defineEmits(['riddleSaved', 'cancel'])

defineProps({
  id: {
    type: String,
    required: true,
  },
})
</script>

<style lang="scss" scoped></style>

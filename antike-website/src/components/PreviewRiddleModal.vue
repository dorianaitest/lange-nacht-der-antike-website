<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex max-h-[80%] min-h-[50%] w-full max-w-lg flex-col justify-around rounded-xl p-6 shadow-xl"
    >
      <h2 class="text-2xl">Riddle for: {{ props.id }}</h2>
      <h3 class="text-xl">{{ riddle }}</h3>
      <h3 class="text-xl">Answer</h3>
      <input v-model="answer" type="text" placeholder="Enter your answer here" />
      <BaseButton @click="checkAnswer">Try</BaseButton>
      <BaseButton @click="cancel">Leave</BaseButton>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import { ref } from 'vue'

function cancel() {
  answer.value = ''
  emit('cancel')
}

const emit = defineEmits(['riddleAnswered', 'cancel'])

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  item: {
    type: Object,
    required: true,
  },
})

function checkAnswer() {
  if (answer.value === props.item.answer) {
    alert('CORRECT!')
    emit('riddleAnswered', props.id)
  } else {
    alert('Try Again!')
    answer.value = ''
  }
}

const riddle = props.item.riddle

const answer = ref('')
</script>

<style lang="scss" scoped></style>

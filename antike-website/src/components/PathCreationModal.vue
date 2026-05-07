<template>
  <BaseModal>
    <div
      class="bg-background mx-4 flex max-h-[80%] min-h-[50%] w-full max-w-lg flex-col justify-around rounded-xl p-6 shadow-xl"
    >
      <h2 class="text-2xl">Path Creation for: {{ id }}</h2>
      <p>After which Riddle should this path unlock?</p>
      <select class="rounded-lg border border-gray-300 bg-white px-3 py-2">
        <option disabled value="">Select the Node</option>
        <option v-for="(value, key) in props.riddleList" :key="key">{{ key }}</option>
      </select>
      <BaseButton>Save</BaseButton>
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

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  riddleList: {
    type: Object,
    required: true, //NEED TO PASS THIS FROM PARENT STILL!!!! select only id from riddleList
  },
})
</script>

<style lang="scss" scoped></style>

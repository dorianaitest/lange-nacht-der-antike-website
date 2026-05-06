<template>
    <BaseModal>
        <div class="min-h-[50%] max-h-[80%] flex flex-col justify-around bg-background rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 class="text-2xl">Riddle Creation for: AREA HERE</h2>
            <h3 class="text-xl">Riddle</h3>
            <input v-model="riddle" type="text" placeholder="What is always spelled incorrectly in a dictionary?">
            <h3 class="text-xl">Answer</h3>
            <input v-model="answer" type="text" placeholder="incorrectly">
            <BaseButton @click="emit('riddleSaved', { riddle: riddle.value, answer: answer.value })">Save</BaseButton>
            <BaseButton @click="cancel">Cancel</BaseButton>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import { ref } from 'vue'

const riddle = ref('')
const answer = ref('')

function cancel() {
    riddle.value = ''
    answer.value = ''
    emit('cancel')
}

const emit = defineEmits(["riddleSaved", "cancel"])
</script>

<style lang="scss" scoped>

</style>
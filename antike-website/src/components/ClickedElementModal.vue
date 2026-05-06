<template>
    <BaseModal>
        <div class="min-h-[50%] max-h-[80%] flex flex-col justify-around bg-background rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <BaseButton @click="emit('toggleRiddleCreation')">Create Riddle</BaseButton>
            <BaseButton @click="emit('togglePathCreation')">Create Path</BaseButton>
            <BaseButton @click="emit('cancel')">Cancel</BaseButton>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';

const emit = defineEmits(['toggleRiddleCreation', 'togglePathCreation', 'cancel'])
</script>

<style lang="scss" scoped>

</style>
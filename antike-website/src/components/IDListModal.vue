<template>
    <BaseModal>
        <div class="min-h-[50%] max-h-[80%] flex flex-col bg-background rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 class="text-xl text-text">List of IDs for clickable Elements</h2>
            <p class="text-text">Check / Uncheck the boxes to make the elements clickable</p>
            <div class="overflow-y-auto m-3 p-3 bg-gray-200 rounded-2xl">
                <IDListElement 
                    v-for="(checked, id) in ids" 
                    :key="id" 
                    :checked="checked" 
                    @toggle="emit('toggleId', id, $event)"
                >
                        {{ id }}
                </IDListElement>
            </div>
            <BaseButton @click="emit('toggleIdList')">Exit</BaseButton>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue';
import BaseButton from './BaseButton.vue';
import IDListElement from './IDListElement.vue';

defineProps({
    ids: {
        type: Object,
        required: true,
    }
})

const emit = defineEmits(['toggleId', 'toggleIdList'])
</script>

<style lang="scss" scoped>

</style>
<template>
<v-btn variant="flat" size="large" height="50"
  style="background: rgba(255,255,255,0.2);
         backdrop-filter: blur(10px);
         border-radius: 15px;"
>
  <p class="text-subtitle-1 text-white font-weight-bold">{{ props.text }}</p>
</v-btn>
</template>

<script setup>
const props = defineProps({
  text: {type: String, default: ''}
})
</script>

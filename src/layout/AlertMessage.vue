<template>
<div class="d-flex justify-center align-center">
  <p class="text-h6 font-weight-bold"> {{ props.text }} </p>
</div>
</template>
<script setup>
const props = defineProps({
  text: {
    type: String,
    default: ''
  }
})
</script>
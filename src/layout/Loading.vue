<template>
<!-- waiting dialog -->
<v-dialog v-model="Wait" persistent width="auto"
  style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
  class="d-flex justify-center align-center"
>
  <div style="width: 200px; height: 60px;"
    class="d-flex flex-column align-center justify-center"
  >
    <p class="text-h6 mb-2 text-white">{{ props.Text }}</p>
    <v-progress-linear   
      rounded
      height="6"
      indeterminate
      color="white"
    />
  </div>
</v-dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  Text: {
    type: String,
    default: 'Loading'
  }
})

const Wait = ref(false);

defineExpose({
  hide: () => {
    Wait.value = false;
  },
  show: () => {
    Wait.value = true;
  }
})
</script>
<template>
<v-btn v-for="(value, key) in props.targets"
  style="width: 100%;"
  rounded="lg"
  size="regluar"
  class="d-flex justify-start my-1 px-2 py-1"
  :variant="Selected === key ? 'flat' : 'text'"
  :color="Selected === key ? props.color : 'black'"
  @click="onClick(key)"
>
  <v-icon size="large"
    :color="Selected === key ? 'white' : props.color"
  >
    {{ value.icon }}
  </v-icon>
  <p class="ml-2 text-subtitle-1">
    {{ value.tag }}
  </p>
</v-btn>
</template>

<script setup>
import {ref} from 'vue';
const Selected = ref(null)

const props = defineProps({
  targets: {
    type: Object, default: {}
  },
  color: {
    type: String, default: 'primary'
  },
  action: {
    type: Function, default: () => {}
  }
})

function onClick(key) {
  Selected.value = key;
  props.action(key);
}

defineExpose({
  Selected: Selected,
  onClick
})

</script>
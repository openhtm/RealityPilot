<template>
<div class="d-flex flex-column justify-center" style="width: 102px;">
  <v-card rounded="lg" elevation="0"
    @click="props.onClick"
  >
    <v-img src="https://fakeimg.pl/120x150/ffffff/"
      width="102"
      height="136"
      cover
    />
  </v-card>
  <p class="text-subtitle-2 font-weight-bold align-self-center">
    {{props.title}}
  </p>
  <p :class="subclass">
    {{props.time}}
  </p>
  <p :class="subclass">
    {{props.size}} MB
  </p>
  
</div>
</template>

<script setup>
import { ref } from 'vue';

const subclass = "text-caption text-grey-darken-1 font-weight-medium align-self-center"

const props = defineProps({
  uid: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Scene Capture'
  },
  time: {
    type: String,
    default: '01-23 00:00'
  },
  size: {
    type: String,
    default: 'Zero'
  },
  onClick: {
    type: Function,
    default: () => {}
  }
})
</script>
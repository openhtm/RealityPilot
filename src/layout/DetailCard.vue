<template>
<div width="100%" style="position: relative;">
  <v-btn 
    style="position: absolute; right:25px; top:25px; z-index: 3;"
    icon="mdi-trash-can-outline" color="warning" size="small" elevation="0"
    @click="remove"
  />

  <v-card variant="flat"
    rounded="lg"
    class="mt-2 mb-2 px-5"
    @click="click"
    :disabled="props.value.status < 3"
  >
    <div class="mt-4"></div>
    <p class="text-caption font-weight-bold">{{ Text }}</p>
    <p class="text-h5 font-weight-bold">{{ props.value.id }}</p>

    <div class="mt-2"></div>
    <p class="text-caption">Created at {{ props.value.time }}</p>
    <p class="text-caption">With <strong>{{ props.value.nmps }}</strong> map points + <strong>{{ props.value.nkfs }}</strong> keyframes</p>
    <div class="mt-4"></div>
  </v-card>
</div>

</template>

<script setup>
import { ref } from 'vue';
import { onMounted } from 'vue';
import {removeScene} from '@/plugins/retrieve'

const Text = ref('')

const props = defineProps({
  onClick: {
    type: Function,
    default: () => {console.log('onClick')}
  },
  value: {
    type: Object,
    default: null,
  },
  onRemove: {
    type: Function,
    default: () => {console.log('onRemove')}
  }
})

function click() {
  const uid = props.value.id;
  props.onClick(uid);
}

function remove(){
  const uid = props.value.id;
  removeScene(uid).then((data) => {
    console.log(data)
    if(data.status) props.onRemove(uid);
  })
}

onMounted(() => {
  let status = props.value.status;
  Text.value = 
    status >= 4 ? "Ready for Reviewing" :
    status == 3 ? "Ready for Processing" :
    status == 2 ? "Texturing Mesh" :
    status == 1 ? "Reconstructing Mesh" :
    status == 0 ? "Denstifying PointCloud" :
    status == -1 ? "Failed on Denstifying" :
    status == -2 ? "Failed on Reconstructing" :
    status == -3 ? "Failed on Texturing" : "Unknown Error"
})

</script>
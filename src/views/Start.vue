<template>
<div class="d-flex flex-column mx-6">
  <div class="mt-3"></div>

  <!-- scanning -->
  <p class="text-h6 font-weight-bold ml-2">Create New Scene</p>
  <v-card variant="flat"
    rounded="lg"
    class="mt-2 px-5"
  >
    <v-btn 
      style="position: absolute; right:25px; top:25px"
      icon="mdi-play" color="primary" size="small" elevation="0"
      @click="openSession"
    />
    
    <div class="mt-4"></div>
    <p class="text-h5 font-weight-bold">Scan the surroundings</p>

    <div class="mt-2"></div>
    <p class="text-caption">Browser-Based WebSFM through <strong class="text-primary">WebRTC</strong></p>
    <p class="text-caption">Reconstructed via ORB-SLAM2 and OpenMVS</p>
    <div class="mt-4"></div>
  </v-card>

  <div class="mt-10"></div>
  
  <!-- tracking -->
  <p class="text-h6 font-weight-bold ml-2">Review Scenes</p>
</div>

</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const Router = useRouter();

function openSession() {
  Router.push('/session/create/0')
}

const Scenes = reactive({

})

onMounted(() => {
})

</script>
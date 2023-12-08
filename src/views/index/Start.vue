<template>
<div class="d-flex flex-column mx-6">
  <div class="mt-1"></div>

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
  <template v-for="(value, key) in Reviews.data">
    <v-card variant="flat"
      rounded="lg"
      class="mt-2 mb-2 px-5"
    >
      <v-btn 
        style="position: absolute; right:25px; top:25px"
        icon="mdi-play" color="primary" size="small" elevation="0"
        @click="openReview(key)"
      />
      
      <div class="mt-4"></div>
      <p class="text-caption font-weight-bold">Ready for Reviewing</p>
      <p class="text-h5 font-weight-bold">{{ value.id }}</p>

      <div class="mt-2"></div>
      <p class="text-caption">Created at {{ value.time }}</p>
      <p class="text-caption">With <strong>{{ value.nmps }}</strong> map points + <strong>{{ value.nkfs }}</strong> keyframes</p>
      <div class="mt-4"></div>
    </v-card>
  </template>
</div>

</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {queryScenes} from '@/plugins/retrieve'

const Router = useRouter();

const Reviews = reactive({
  data:{}
});

function openSession() {
  Router.push('/session/create/0')
}

function openReview(id) {
  Router.push('/session/review/'+id)
}

onMounted(() => {
  Reviews.data = {};
  queryScenes().then(data => {
    // console.log(data);
    // filter
    for(let id in data) {
      let item = data[id];
      if(item.status >= 4)
        Reviews.data[id] = item;
    }
  })
})

</script>
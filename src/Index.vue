<template>
<v-app>
  <!-- navigation -->
  <v-navigation-drawer
    color="background"
    width="280"
    theme="main"
    permanent
    class="px-4 pt-8 d-flex flex-column"
  >
    <p class="text-h4 font-weight-black ml-2">
      Reality Pilot
    </p>

    <div class="mt-2"></div>

    <!-- targets button -->
    <targets-button 
      ref="TargetRef"
      :targets="Targets"
      :action="targetAt"
    />

    <div class="mt-4"></div>

    <!-- info -->
    <p class="text-h6 font-weight-bold ml-2">
      Recent
    </p>

  </v-navigation-drawer>
  <v-main class="pt-8">
    <router-view></router-view>
  </v-main>
</v-app>
</template>

<script setup>
import {ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TargetsButton from '@/layout/TargetsButton.vue';

const Router = useRouter();
const TargetRef = ref(null);

const Targets = {
  overview: {
    tag: 'Overview',
    path: '',
    icon: 'mdi-star-outline'
  },
  start: {
    tag: 'Start',
    path: 'start',
    icon: 'mdi-cube-scan'
  },
  about: {
    tag: 'About',
    path: 'about',
    icon: 'mdi-information-outline',
  }
}

function targetAt(key){
  Router.push('/' + Targets[key].path);
}

onMounted(() => {
  // get router path
  const path = Router.currentRoute.value.path;
  if(path === '/') TargetRef.value.Selected = 'overview';
  else if(path === '/start') TargetRef.value.Selected = 'start';
  else if(path === '/about') TargetRef.value.Selected = 'about';
  else targetAt('overview')
})

</script>
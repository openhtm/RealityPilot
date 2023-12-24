<template>
<v-app>
<v-main class="pa-6">
  <div class="d-flex justify-end align-center">
    <!-- capture -->
    <v-btn rounded="lg" variant="text" icon="" density="comfortable"
      @click="Router.push('/capture')"
    >
      <v-icon color="primary" size="large">mdi-plus</v-icon>
    </v-btn>

    <!-- select -->
    <v-btn rounded="lg" variant="text" class="ml-3" icon="" density="comfortable">
      <v-icon color="primary" size="large">mdi-dots-horizontal-circle-outline</v-icon>
    </v-btn>

    <!-- search -->
    <template v-if="!mobile">
      <div style="width: 20%;" class="ml-3">
        <search-bar rounded="lg" />
      </div>
    </template>
  </div>

  <!-- title -->
  <p class="text-h4 font-weight-black">Reality Pilot</p>

  <!-- search bar for mobile -->
  <template v-if="mobile">
    <search-bar rounded="lg" class="mt-4"/>
  </template>

  <!-- scenes -->
  <v-spacer class="mt-4"></v-spacer>
  <v-row justify="space-around">
    <v-col cols="auto" v-for="i in 9">
      <brief-card
      
      />
    </v-col>
  </v-row>
</v-main>
</v-app>
</template>

<script setup>
import {ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import SearchBar from '@/layout/SearchBar.vue';
import BriefCard from '@/layout/BriefCard.vue';

const Router = useRouter();

const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

const mobile = computed(() => {
  return windowWidth.value < windowHeight.value;
})

onMounted(() => {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
    windowHeight.value = window.innerHeight;
  })
})

</script>
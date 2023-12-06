<template>
<v-app>
  <v-main>
    <!-- session dialog (fullscreen) -->
    <v-dialog v-model="Dialog" persistent fullscreen>
      <v-card class="fill-height overflow-hidden" color="grey-darken-3">
        <Session ref="SessionRef" :onCancel="onCancel" :onComplete="onComplete"/>
      </v-card>
    </v-dialog>

    <!-- waiting dialog -->
    <v-dialog v-model="Waiting" persistent  width="auto"
      style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
      class="d-flex justify-center align-center"
    >
      <div style="width: 200px; height: 60px;"
        class="d-flex flex-column align-center justify-center"
      >
        <p class="text-h6 mb-2 text-white">Wait a moment</p>
        <v-progress-linear   
          rounded
          height="6"
          indeterminate
          color="white"
        />
      </div>
      
    </v-dialog>
  </v-main>
</v-app>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import Session from '@/components/WebSFM.vue'
import { useRouter } from 'vue-router';

const Router = useRouter();
const Type = Router.currentRoute.value.params.type;
const UID = Router.currentRoute.value.params.uid;

const Dialog = ref(true);
const Waiting = ref(false);
const SessionRef = ref(null);

function onCancel() {
  Waiting.value = true;
  setTimeout(() => {
    SessionRef.value.releaseMedia();
    Router.push('/start');
  }, 1200);
}

function onComplete() {
  Waiting.value = true;
  setTimeout(() => {
    SessionRef.value.releaseMedia();
    Router.push('/');
  }, 1200);
}

onMounted(() => {
  Waiting.value = false;
  Dialog.value = true;
  SessionRef.value.getMedia();
})
</script>
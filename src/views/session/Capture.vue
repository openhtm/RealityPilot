<template>
<v-app>
<v-main>
  <!-- session dialog (fullscreen) -->
  <v-dialog v-model="Dialog" persistent fullscreen>
    <v-card class="fill-height overflow-hidden" color="grey-darken-3">
      <!-- SfM session-->
      <capture-session ref="SessionRef" style="width: 100%; height: 100%;"
        :on-end="quit"
      />
    </v-card>
  </v-dialog>

  <!-- waiting dialog -->
  <loading :text="'Wait a moment'" ref="LoadingRef"></loading>

</v-main>
</v-app>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// components
import CaptureSession from '@/components/Capture.vue'
import Loading from '@/layout/Loading.vue';

const Router = useRouter();

///***************************************************************
// Basic Session
const Dialog = ref(true);

const SessionRef = ref(null);
const LoadingRef = ref(null);
var Session = null;

// quit session
function quit() {
  LoadingRef.value.show();
  setTimeout(() => {
    Router.push('/');
  }, 1200);
}

///***************************************************************
// Mounted
onMounted(() => {
  Dialog.value = true;
  Session = SessionRef.value;
})
</script>
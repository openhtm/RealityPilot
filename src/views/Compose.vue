<template>
<v-app>
  <!-- navigation -->
  <v-navigation-drawer
    color="background"
    width="260"
    theme="main"
    permanent
    class="px-4 pt-10 d-flex flex-column"
  >
    <v-btn style="position: absolute; top:0;"
      variant="text" class="px-0 mt-2" rounded="lg" @click="back"
    >
      <v-icon color="primary">mdi-arrow-left-top</v-icon>
      <p class="text-body-2 font-weight-medium text-primary">Back</p>
    </v-btn>
    
    <p class="text-h5 font-weight-black ml-2">
      Reality Composer
    </p>

    <div class="mt-2"></div>

    <!-- preview button -->
    <nav-button 
      ref="PreviewRef"
      :targets="Preview"
      :action="targetAt"
      :disabled="Disabled.data"
    />

    <p class="text-h6 font-weight-bold ml-2 mt-4">
      Steps
    </p>
    <!-- steps button -->
    <nav-button 
      ref="StepsRef"
      :targets="Steps"
      :action="targetAt"
      :disabled="Disabled.data"
    />
    

    <!-- info -->
    <p class="text-h6 font-weight-bold ml-2 mt-4">
      Edit
    </p>

    <!-- edit button -->
    <nav-button 
      ref="EditRef"
      :targets="Edit"
      :action="targetAt"
      :disabled="Disabled.data"
    />

  </v-navigation-drawer>
  <v-main class="pt-8">
    <router-view></router-view>
  </v-main>
</v-app>
</template>

<script setup>
import {ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavButton from '@/layout/NavButton.vue';

const Router = useRouter();
const UID = Router.currentRoute.value.params.uid;

const PreviewRef = ref(null);
const StepsRef = ref(null);
const EditRef = ref(null);

const Disabled = reactive({
  data: ['edit']
});

const Preview = {
  preview: {
    tag: 'Preview',
    icon: 'mdi-hexagon-slice-2',
    path: ''
  },
}

const Steps = {
  define: {
    tag: 'Define',
    icon: 'mdi-shape-square-rounded-plus',
    path: '/define'
  },
  gridding: {
    tag: 'Gridding',
    icon: 'mdi-grid',
    path: '/gridding'
  },
}

const Edit = {
  navigate:{
    tag: 'Navigate',
    icon: 'mdi-map-marker-plus-outline',
    path: '/navigate'
  },
  edit: {
    tag: 'Edit',
    icon: 'mdi-brush-outline',
    path: '/edit'
  }
}

const RefMap = {
  preview: PreviewRef,
  define: StepsRef,
  gridding: StepsRef,
  navigate: EditRef,
  edit: EditRef
}

const TagMap = {
  preview: Preview,
  define: Steps,
  gridding: Steps,
  navigate: Edit,
  edit: Edit
}

function targetAt(key){
  SelectedAt(key);
  Router.push('/compose' + '/' + UID + TagMap[key][key].path);
}

function SelectedAt(key){
  PreviewRef.value.Selected = null;
  StepsRef.value.Selected = null;
  EditRef.value.Selected = null;

  RefMap[key].value.Selected = key;
}

function back() {
  Router.push('/');
}



onMounted(() => {
  // get router path
  const path = Router.currentRoute.value.path;
  var parts = path.split('/');

  if(parts.length == 3) parts.push('preview')

  if(Disabled.data.includes(parts[3])) 
    targetAt('preview')
  else
    SelectedAt(parts[3])
})

</script>
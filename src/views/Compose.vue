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
  <v-main>
    <router-view 
      :UID="UID"
      :targetAt="targetAt"
      :getScene="getScene" 
      :getPointCloud="getPointCloud"
    />
  </v-main>

<!-- waiting dialog -->
<v-dialog v-model="Waiting" persistent  width="auto"
  style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
  class="d-flex justify-center align-center"
>
  <div style="width: 200px; height: 60px;"
    class="d-flex flex-column align-center justify-center"
  >
    <p class="text-h6 mb-2 text-white">Loading Scene</p>
    <v-progress-linear   
      rounded
      height="6"
      v-model="Percentage"
      color="white"
    />
  </div>
  
</v-dialog>

</v-app>
</template>

<script setup>
import {ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavButton from '@/layout/NavButton.vue';
import {loadPointCloud, loadScene} from '@/plugins/retrieve';

const Router = useRouter();
const UID = Router.currentRoute.value.params.uid;

///***************************************************************
// Navigation
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

///***************************************************************
// Mesh
const Waiting = ref(false);
const Percentage = ref(0);
// index 0 for scene, index 1 for pointcloud
let percents = [0,0];
let sharedPromise = [null, null];
let Scene = null;
let PointCloud = null;

async function createScenePromise(alone = false) {
  return new Promise((resolve, reject) => {
    if(Scene) resolve(Scene);
    else {
      Waiting.value = true;
      loadScene(UID, (scene) => {
        percents[0] = 100;
        Percentage.value = (percents[0] + percents[1]) / 2;

        Scene = scene;
        resolve(Scene);

        if(alone || Percentage.value >= 100) Waiting.value = false;
      },
      (xhr) => {
        percents[0] = xhr.loaded / xhr.total * 100;
        Percentage.value = (percents[0] + percents[1]) / 2;
      })
    }
  })

}

async function createPointCloudPromise(alone = false) {
  return new Promise((resolve, reject) => {
    if(PointCloud) resolve(PointCloud);
    else {
      Waiting.value = true;
      loadPointCloud(UID, (pcd, arr) => {
        percents[1] = 100;
        Percentage.value = (percents[0] + percents[1]) / 2;

        PointCloud = {
          geometry: pcd,
          array: arr
        }
        resolve(PointCloud)
        
        if(alone || Percentage.value >= 100) Waiting.value = false;
      },
      (xhr) => {
        percents[1] = xhr.loaded / xhr.total * 100;
        Percentage.value = (percents[0] + percents[1]) / 2;
      })
    }
  })
  
}

function getScene(alone = false) {
  if(!sharedPromise[0]) sharedPromise[0] = createScenePromise(alone);
  return sharedPromise[0];
}

function getPointCloud(alone = false) {
  if(!sharedPromise[1]) sharedPromise[1] = createPointCloudPromise(alone);
  return sharedPromise[1];
}

///***************************************************************
// get part
function getCurrentPart() {
  const path = Router.currentRoute.value.path;
  var parts = path.split('/');

  if(parts.length == 3) parts.push('preview');
  return parts[3]
}
// Mout
onMounted(() => {
  // get router path
  const part = getCurrentPart();

  if(Disabled.data.includes(part)) 
    targetAt('preview')
  else {
    SelectedAt(part)
  }

  // getScene();
  // getPointCloud();
})

</script>
<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 20; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="reset"
    >
      <p class="text-body-1 text-white font-weight-bold">Reset</p>
    </v-btn>
  </div>
  
  <!-- land marks -->
  <div class="fill-height"
    style="position: absolute; z-index: 10; left:20px; 
           padding-top: 70px; padding-bottom: 20px;" 
    :style="'display:' + (Drawer ? 'block;' : 'none;')"
  >
    <v-card 
      style="background: rgba(0,0,0,0.1); backdrop-filter: blur(10px);"
      class="fill-height pa-4 d-flex flex-column"
      width="260"
      rounded="lg"
      elevation="5"
    >
      <p class="text-h5 font-weight-black ml-2">
        Landmarks
      </p>

      <div class="mt-2"></div>
      
      <!-- landmarks -->
      <div class=" overflow-y-auto">
        <template v-for="(item, index) in LandMarks.data">
          <v-btn class="d-flex justify-start my-1 px-2 py-1"
            style="width: 100%;"
            rounded="lg"
            size="regluar"
            :variant="Selected == index ? 'flat' : 'text'"
            :color="Selected == index ? 'primary' : 'info'"
            @click="selectLandMark(index)"
          >
            <v-icon size="large">
              mdi-octahedron
            </v-icon>
            <p class="ml-2 text-subtitle-1">
              {{ item.tag }}
            </p>
          </v-btn>
        </template>
      </div>
      
    </v-card>
  </div>

  <!-- toolkit -->
  <div style="position: absolute; z-index: 10; top:20px; width: 100%;"
    class="d-flex justify-center align-center"
  > 
    <v-btn-group rounded="lg" elevation="0"  density="comfortable" color="white" variant="flat">
      <v-btn size="small" :color="Drawer ? 'primary' : 'white'" 
        @click="Drawer = ! Drawer"
      >
        <p class="text-h6" :class="Drawer ? 'text-white' : 'text-primary'">
          {{ LandMarks.data.length }}
        </p>
      </v-btn>
      <v-btn size="small" @click="newLandMark">
        <v-icon size="x-large" color="primary">
          mdi-flag-variant-plus-outline
        </v-icon>
      </v-btn>
    </v-btn-group>

    <v-btn-group v-if="Selected != null" rounded="lg" elevation="0"  density="comfortable" color="white" class="ml-3">
      <v-btn size="small" @click="unselect">
        <v-icon size="x-large" color="primary">
          mdi-close
        </v-icon>
      </v-btn>
      <v-btn size="small" @click="Dialog = true;">
        <v-icon size="x-large" color="primary">
          mdi-form-textbox
        </v-icon>
      </v-btn>
      <v-btn size="small" @click="deleteLandMark">
        <v-icon size="x-large" color="warning">
          mdi-trash-can-outline
        </v-icon>
      </v-btn>
    </v-btn-group>
  </div>

  <!-- bottom slider -->
  <div style="position: absolute; z-index: 10; bottom:20px; width: 100%;">
    <slide-bar
      :height="40"
      :data="Setting"
    />
  </div>

  <!-- save -->
  <div style="position: absolute; z-index: 10; top:20px; right:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="save"
    >
      <p class="text-body-1 text-white font-weight-bold">Save</p>
    </v-btn>
  </div>

  <!-- render -->
  <render
    style="z-index: 1;"
    ref="SceneRef"
    :orbit="true"
    :far="100"
    :ambient="1"
  />
</div>


<loading ref="LoadingRef" Text="Loading Landmarks" />

<!-- dialog for name change -->
<v-dialog v-model="Dialog" class="d-flex">
  <v-card width="300" class="pa-2 align-self-center" rounded="lg">
    <v-text-field v-model="DialogInput" density="compact" hide-details="true"
      class="mb-2"
      :label="Selected == null ? '' : LandMarks.data[Selected].tag"
    >
    </v-text-field>
    <v-row no-gutters>
      <v-col cols="6">
        <v-btn variant="text" width="100%" density="comfortable"
          @click="Dialog = false; DialogInput = '';"
        >
          <p class="text-subtitle-2 text-warning">Cancel</p>
        </v-btn>
      </v-col>
      <v-col cols="6">
        <v-btn variant="text" width="100%" density="comfortable"
          :disabled="DialogInput.length == 0"
          @click="resetTag"
        >
          <p class="text-subtitle-2 text-primary">Done</p>
        </v-btn>
      </v-col>
    </v-row>
  </v-card>

</v-dialog>

</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import * as THREE from 'three'
import Render from '@/components/Render';
import SlideBar from '@/layout/SlideBar.vue'
import Loading from '@/layout/Loading.vue'
import {queryDetail} from '@/plugins/retrieve'


const props = defineProps({
  UID: {
    type: String,
    required: true
  },
  targetAt: {
    type: Function,
    required: true
  },
  getScene: {
    type: Function,
    required: true
  },
  getPointCloud: null
})

///***************************************************************
const LoadingRef = ref(null);
// Scene
const SceneRef = ref(null);
var Scene;
var Mesh = null;
var GridMesh = null;
var trans_control = null;

var Define = {
  position: {x: 0, y: 0, z: 0},
  rotation: {_x: 0, _y: 0, _z: 0},
  size: 10,
  division: 64,
  array: [[]]
}
var GridHelper = new THREE.GridHelper(10, 64, 0xCCCCCC, 0xCCCCCC);

///***************************************************************
// Land Mark
const Drawer = ref(false);
const Dialog = ref(false);
const DialogInput = ref('');

const Selected = ref(null);
const ModelGeometry = new THREE.OctahedronGeometry(0.3, 0);
const ModelMaterial = new THREE.MeshNormalMaterial({ flatShading: true });
const LandMarks = reactive({
  data: [],
  cnt: 0,
})

function createLandMark(x, z) {
  const mesh = new THREE.Mesh(ModelGeometry, ModelMaterial);
  mesh.position.set(x, 0.3, z);
  Scene.addObject(mesh);
  return mesh;
}

function newLandMark() {
  const len = LandMarks.data.length;
  LandMarks.data.push({
    mesh: createLandMark(0, 0),
    tag: 'Landmark-' + String(len)
  });
  selectLandMark(len);
}

function unselect() {
  Selected.value = null;
  trans_control.detach();
  Scene.render();
}

function selectLandMark(idx) {
  if(Selected.value == idx)
    return unselect();
  else {
    Selected.value = idx;
    trans_control.attach(LandMarks.data[idx].mesh);  
    Scene.render();
  }
}

function resetTag() {
  if(Selected.value == null) return;
  LandMarks.data[Selected.value].tag = DialogInput.value;
  Dialog.value = false;
}

function deleteLandMark() {
  const idx = Selected.value;
  if(idx == null) return;

  unselect();
  Scene.removeObject(toRaw(LandMarks.data[idx].mesh));
  LandMarks.data.splice(idx, 1);
}


///***************************************************************
// grid mesh
const Setting = {
  min: 0, max: 5,
  step: 0.1,
  default: 1,
  onEnd: setGridMeshScale
}

function setGridMeshScale(val) {
  if(GridMesh) {
    GridMesh.scale.set(1, val, 1);
    Scene.render();
  }
}

function createGridMesh() {
  var cnt = 0;
  Define.array.forEach((row, rowid) => {
    row.forEach((col, colid) => {
      if(col == 0) cnt++;
    })
  })
  // define basic
  const half_size = Define.size / 2;
  const resolution = Define.size / Define.division;
  const geometry = new THREE.BoxGeometry(resolution, 0.5, resolution);
  const material = new THREE.MeshPhongMaterial({ color: 0xffffff }); 
  GridMesh = new THREE.InstancedMesh(geometry, material, cnt);
  // fill in the instance
  let instanceIndex = 0;
  Define.array.forEach((row, rowid) => {
    row.forEach((col, colid) => {
      if(col == 0) {
        const x = colid * resolution - half_size + resolution / 2;
        const z = rowid * resolution - half_size + resolution / 2;
        const position = new THREE.Vector3(x, 0.25, z);
        GridMesh.setMatrixAt(instanceIndex++, new THREE.Matrix4().makeTranslation(position.x, position.y, position.z));
      }
    })
  })
  GridMesh.instanceMatrix.needsUpdate = true;
  GridMesh.castShadow = true;
  return GridMesh;
}

///***************************************************************
// save
function save() {
  var landmark_data = []
  LandMarks.data.forEach(item => {
    landmark_data.push({
      tag: item.tag,
      x: item.mesh.position.x,
      z: item.mesh.position.z
    })
  })
  var data = {
    uid: props.UID,
    landmarks: landmark_data
  }
  fetch('/api/landmark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    if(data.status) alert('Save Success');
    else alert(data.msg);
  })
  .catch(err => alert(err))
}

///***************************************************************
function onStart() {
  // add light
  const light = new THREE.DirectionalLight(0xFFFFFF, 3);
  light.position.set(0, 10, 0);
  light.target.position.set(-5, 0, 0)
  Scene.addObject(light);
  Scene.addObject(light.target);
  // transform control
  trans_control = Scene.createTransformControl();
  trans_control.showY = false;
  // camera direction
  Scene.setCameraPosition(2,2,8);
  Scene.setCameraLookAt(0,0,0);
  // add AxesHelper
  Scene.addObject(new THREE.AxesHelper(1));
  // add Main Mesh
  Mesh.position.set(Define.position.x, Define.position.y, Define.position.z);
  Mesh.rotation.set(Define.rotation._x, Define.rotation._y, Define.rotation._z);
  Scene.addObject(Mesh);
  // add GridHelper
  GridHelper = new THREE.GridHelper(Define.size, Define.division, 0xCCCCCC, 0xCCCCCC);
  Scene.addObject(GridHelper);
  // add GridMesh
  GridMesh = createGridMesh();
  Scene.addObject(GridMesh);
  // render
  reset();
  LoadingRef.value.hide();
}

var origin_data = [];

// reset
function reset() {
  unselect();
  // remove current
  LandMarks.data.forEach(item => Scene.removeObject(toRaw(item.mesh)))
  LandMarks.data = [];
  // add from origin
  origin_data.forEach(item => {
    LandMarks.data.push({
      mesh: createLandMark(item.x, item.z),
      tag: item.tag
    });
  })
  
  Scene.render();
}

// Mounted
onMounted(() => {
  const box = document.getElementById('renderbox');
  Scene = SceneRef.value;
  Scene.resetSize({
    width: box.offsetWidth,
    height: box.offsetHeight,
  })
  Scene.start();

  // query basic data
  queryDetail(props.UID)
  .then(data => {
    var define = data['define'];
    var gridinfo = data['grid'];
    var landmarks = data['landmarks'];

    if(define == undefined) {
      alert('Fundamental has not been defined');
      props.targetAt('define');
      return;
    }
    
    if(gridinfo == undefined) {
      alert('Map has not been flatten');
      props.targetAt('define');
      return;
    }

    if(landmarks != undefined)
      origin_data = landmarks;

    Define = define;
    Define.division = gridinfo.division;
    Define.array = gridinfo.array;
    
    // query scene
    props.getScene(true)
    .then((mesh) => {
      Mesh = mesh.clone();
      LoadingRef.value.show();
      onStart();
    })

  })
})


</script>
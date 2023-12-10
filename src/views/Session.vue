<template>
<v-app>
<v-main>
  <!-- session dialog (fullscreen) -->
  <v-dialog v-model="Dialog" persistent fullscreen>
    <v-card class="fill-height overflow-hidden" color="grey-darken-3">
      <!-- THREE.js render -->
      <div id="renderbox" v-if="Type === 'review'" 
        style="position: absolute; width: 100%; height: 100% ;z-index:5;"
      >
        <render-box ref="SceneRef" style="z-index: 5;"
          :onFrame="onFrame"
          :animation="true"
        />
      </div>

      <!-- SfM session-->
      <session-box ref="SessionRef" :Type="Type" :UID="UID" :onCancel="onCancel" :onComplete="onComplete" />
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
import { useRouter } from 'vue-router';
import * as THREE from 'three'
// components
import SessionBox from '@/components/WebSfM.vue'
import RenderBox from '@/components/Render';
// tools
import { loadScene, queryDetail } from '@/plugins/retrieve';

const Router = useRouter();
const Type = Router.currentRoute.value.params.type;
const UID = Router.currentRoute.value.params.uid;

///***************************************************************
// Basic Session
const Dialog = ref(true);
const Waiting = ref(false);
const SessionRef = ref(null);
var Session = null;
// session cancelled
function onCancel() {
  Waiting.value = true;
  setTimeout(() => {
    Session.releaseMedia();
    Router.push('/start');
  }, 1200);
}
// session completed
function onComplete() {
  Waiting.value = true;
  setTimeout(() => {
    Session.releaseMedia();
    Router.push(Type === 'review' ? '/start' : '/');
  }, 1200);
}


///***************************************************************
// Review
const SceneRef = ref(null);
var Scene = null;
// Preset
var Mesh = null;
var Preset = null;
var GridHelper = null;
var MeshLoaded = ref(false);
var PresetLoaded = ref(false);

// Transform
var MatrixTwp = new THREE.Matrix4();
var MatrixTpw = new THREE.Matrix4();

function onFrame() {
  const Twc = Session.getPosition();

  const x = Twc[0][3], y = Twc[1][3], z = Twc[2][3];
  const x_ = x + Twc[0][2], y_ = y + Twc[1][2], z_ = z + Twc[2][2];
  Scene.setCameraPosition(x, y, z);
  Scene.setCameraLookAt(x_, y_, z_);
}

function updateTranform() {
  // set tpw
  const position = Preset.define.position;
  const rotation = Preset.define.rotation;
  console.log(position, rotation);
  MatrixTpw.setPosition(position.x, position.y, position.z);
  var rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(rotation._x, rotation._y, rotation._z, 'XYZ')
    );
  MatrixTpw.multiply(rotationMatrix);
  // set twp
  MatrixTwp.copy(MatrixTpw).invert();
}

function onPresetLoaded() {
  // prepare transform
  updateTranform();
  // load landmarks
  applyLandMarks();
  // set grid helper
  GridHelper = new THREE.GridHelper(Preset.define.size, Preset.define.division, 0xCCCCCC, 0xCCCCCC);
  GridHelper.applyMatrix4(MatrixTwp);
  Scene.addObject(GridHelper);
}

function onMeshLoaded() {
  // Scene.addObject(Mesh);
  // Scene.render();
}

function onReviewInit() {
  // init Scene
  const box = document.getElementById('renderbox');
  Scene = SceneRef.value;
  Scene.resetSize({
    width: box.offsetWidth,
    height: box.offsetHeight,
  })
  Scene.start();

  Scene.addObject(new THREE.AxesHelper(1))

  // load info
  queryDetail(UID)
  .then(data => {
    Preset = data;
    PresetLoaded.value = true;
    onPresetLoaded();
    // load scene
    loadScene(UID, (scene) => {
      Mesh = scene;
      MeshLoaded.value = true;
      onMeshLoaded();
    })
  })
}


///***************************************************************
// Assests
var LandMarks = []
const ModelGeometry = new THREE.OctahedronGeometry(0.3, 0);
const ModelMaterial = new THREE.MeshNormalMaterial({ flatShading: true });

function applyLandMarks() {
  Preset.landmarks.forEach(item => {
    const mesh = createLandMark(item.x, item.z);
    mesh.applyMatrix4(MatrixTwp);
    LandMarks.push({
      mesh: mesh,
      tag: item.tag,
    })
  })

  LandMarks.forEach(item => {
    Scene.addObject(item.mesh);
  })
}

function createLandMark(x, z) {
  const mesh = new THREE.Mesh(ModelGeometry, ModelMaterial);
  mesh.position.set(x, 0.3, z);
  return mesh;
}

///***************************************************************
// Mounted
onMounted(() => {
  Waiting.value = false;
  Dialog.value = true;
  Session = SessionRef.value;
  Session.getMedia();
  if(Type === 'review')
    onReviewInit();
})
</script>
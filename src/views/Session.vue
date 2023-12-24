<template>
<v-app>
<v-main>
  <!-- session dialog (fullscreen) -->
  <v-dialog v-model="Dialog" persistent fullscreen>
    <v-card class="fill-height overflow-hidden" color="grey-darken-3">
      <!-- search path -->
      <v-btn v-if="Type === 'review'"
        style="position: absolute; z-index: 40; bottom:20px; right:20px; background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
        rounded="lg" variant="flat" size="large"
        @click="searchRoute"
      >
        <p class="text-body-1 text-white font-weight-bold">Search</p>
      </v-btn>

      <!-- THREE.js render -->
      <div id="renderbox" v-if="Type === 'review'" 
        style="position: absolute; width: 100%; height: 100% ;z-index:5;"
      >
        <render-box ref="SceneRef" style="z-index: 5;"
          :onFrame="onFrame"
          :animation="true"
          :orbit="false"
        />
      </div>

      <!-- SfM session-->
      <session-box ref="SessionRef" 
        :onCancel="onCancel" 
        :onComplete="onComplete" 
      />
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
import SessionBox from '@/components/Capture.vue'
import RenderBox from '@/components/Render';
// tools
import GridMap from '@/plugins/map'
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
  if(Scene) Scene.stop();
  Waiting.value = true;
  setTimeout(() => {
    Session.releaseMedia();
    Router.push('/start');
  }, 1200);
}
// session completed
function onComplete() {
  if(Scene) Scene.stop();
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
var Camera = null;
var Mesh = null;
var Preset = null;
var GridHelper = null;
var MeshLoaded = ref(false);
var PresetLoaded = ref(false);
// Nav Map
const NavMap = new GridMap();

// Transform
var MatrixTwp = new THREE.Matrix4();
var MatrixTpw = new THREE.Matrix4();
var MatrixRwp = new THREE.Matrix4();
var MatrixRpw = new THREE.Matrix4();
var VectorTwp = new THREE.Vector3();
var VectorTpw = new THREE.Vector3();

function onFrame() {
  const RawData = Session.getPosition();
  
  var Array = [];
  for(let i = 0; i < 4; i++)
    for(let j = 0; j < 4; j++)
      Array.push(RawData[j][i]) // col-order !!!!!!!!!!!

  const R = new THREE.Matrix4();
  R.fromArray(Array);
  const T = new THREE.Vector3(RawData[0][3], RawData[1][3], RawData[2][3]);

  Scene.updateCamera((camrea)=>{
    camrea.position.copy(T);
    camrea.rotation.setFromRotationMatrix(R);
  })
  // if(Camera) {
  //   Camera.position.copy(T);
  //   var r = new THREE.Euler().setFromRotationMatrix(R);
  //   Camera.rotation.copy(r);
  //   console.log(Camera);
  //   Scene.render();
  // }


  // const x = Twc[0][3], y = Twc[1][3], z = Twc[2][3];
  // const x_ = x + Twc[0][2], y_ = y + Twc[1][2], z_ = z + Twc[2][2];
  // Scene.setCameraPosition(x, y, z);
  // Scene.setCameraLookAt(x_, y_, z_);

}

function updateTranform() {
  // set tpw
  const position = Preset.define.position;
  const rotation = Preset.define.rotation;
  VectorTpw.set(position.x, position.y, position.z);
  VectorTwp.set(-position.x, -position.y, -position.z);
  MatrixRpw = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(rotation._x, rotation._y, rotation._z, 'XYZ')
  );
  MatrixRwp.copy(MatrixRpw).invert();
  // MatrixTpw.setPosition(position.x, position.y, position.z);
  // var rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(
  //     new THREE.Euler(rotation._x, rotation._y, rotation._z, 'XYZ')
  //   );
  // MatrixTpw.multiply(rotationMatrix);
  // // set twp
  // MatrixTwp.copy(MatrixTpw).invert();
}

function onPresetLoaded() {
  // prepare transform
  updateTranform();
  // load landmarks
  applyLandMarks();
  // init navigation map
  NavMap.setGrid(Preset.grid.array)
  // set grid helper
  GridHelper = new THREE.GridHelper(Preset.define.size, Preset.define.division, 0xCCCCCC, 0xCCCCCC);
  GridHelper.position.add(VectorTwp);
  GridHelper.rotation.setFromRotationMatrix(MatrixRwp);
  // GridHelper.applyMatrix4(MatrixTwp);
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
  Scene.updateCamera((camera) => {
    camera.position.set(2,3,6);
    camera.lookAt(0,0,-1);
  })

  // Camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 1000);
  // Camera.position.set(0,0,0);
  // Camera.lookAt(0,0,-1);
  // Scene.addObject(Camera)
  // const cam_helper = new THREE.CameraHelper(Camera);
  // Scene.addObject(cam_helper);

  Scene.updateCamera((camera) => {
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
  })

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
    mesh.position.add(VectorTwp);
    mesh.applyMatrix4(MatrixRwp)
    // mesh.rotation.apply
    // mesh.applyMatrix4(MatrixTwp);
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
// Navigation
var NavRoute = null;

function searchRoute() {
  if(Preset.landmarks.length == 0) return;
  const size = Preset.define.size;
  const half_size = size / 2;
  const division = Preset.grid.division;
  const resolution = size / division;
  // end
  let end = Preset.landmarks[0]
  end.x = Math.floor((end.x + half_size) / resolution);
  end.z = Math.floor((end.z + half_size) / resolution);
  // start
  const camera = Scene.getCamera();
  var position = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
  position.add(VectorTpw);
  position.applyMatrix4(MatrixRpw);
  const start = {
    x : Math.floor((position.x + half_size) / resolution),
    z : Math.floor((position.z + half_size) / resolution)
  }
  // search
  const result = NavMap.search(start, end);
  console.log(result);
  var points = []
  result.forEach(item => {
    points.push(new THREE.Vector3(
      item.x * resolution - half_size + resolution / 2,
      0,
      item.y * resolution - half_size + resolution / 2
    ))
  })
  drawRoute(points);
}

function drawRoute(points) {
  if(NavRoute) {
    Scene.removeObject(toRaw(NavRoute));
    NavRoute = null;
  }
  const material = new THREE.LineBasicMaterial({ color: 0x0000FF, linewidth:5 });
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  NavRoute = new THREE.Line(geometry, material);
  NavRoute.position.add(VectorTwp);
  NavRoute.applyMatrix4(MatrixRwp);
  Scene.addObject(NavRoute);
}


///***************************************************************
// Mounted
onMounted(() => {
  Waiting.value = false;
  Dialog.value = true;
  Session = SessionRef.value;
  if(Type === 'review')
    onReviewInit();
})
</script>
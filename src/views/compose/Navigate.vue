<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 20; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click=""
    >
      <p class="text-body-1 text-white font-weight-bold">Reset</p>
    </v-btn>
  </div>

  <!-- toolkit -->
  <div style="position: absolute; z-index: 10; top:20px; width: 100%;"
    class="d-flex justify-center align-center"
  > 
    <v-btn-group rounded="lg" elevation="0"  density="comfortable" color="white">
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

  <!-- render -->
  <render
    style="z-index: 1;"
    ref="SceneRef"
    :orbit="true"
    :far="100"
    :ambient="1"
  />
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import * as THREE from 'three'
import Render from '@/components/Render';
import SlideBar from '@/layout/SlideBar.vue'
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
  }
})

///***************************************************************
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
// grid mesh
const SettingRef = ref(null);
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
function reset() {
  // reset mesh
  
  Scene.render();
}

///***************************************************************
function onStart() {
  // add light
  const light = new THREE.DirectionalLight(0xFFFFFF, 3);
  light.position.set(0, 10, 0);
  light.target.position.set(-5, 0, 0)
  Scene.addObject(light);
  Scene.addObject(light.target);
  // set basic
  trans_control = Scene.createTransformControl();
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

    Define = define;
    Define.division = gridinfo.division;
    Define.array = gridinfo.array;
    
    // query scene
    props.getScene(true)
    .then((mesh) => {
      Mesh = mesh.clone();
      onStart();
    })

  })
})


</script>
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

  <!-- toolkit -->
  <div style="position: absolute; z-index: 10; top:20px; width: 100%;"
    class="d-flex justify-center align-center"
  > 
    <v-btn-group rounded="lg" elevation="0"  density="comfortable" color="white">
      <v-btn size="small" @click="setTransMode('translate')">
        <v-icon size="x-large" color="primary">mdi-axis-arrow</v-icon>
      </v-btn>
      <v-btn size="small" @click="setTransMode('rotate')">
        <v-icon size="x-large" color="primary">mdi-rotate-orbit</v-icon>
      </v-btn>
      <v-btn size="small" @click="step(false)">
        <v-icon size="x-large" color="primary">mdi-minus</v-icon>
      </v-btn>
      <v-btn size="small" @click="step(true)">
        <v-icon size="x-large" color="primary">mdi-plus</v-icon>
      </v-btn>
    </v-btn-group>
  </div>

  <!-- save -->
  <div style="position: absolute; z-index: 10; top:20px; right:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="save"
    >
      <p class="text-body-1 text-white font-weight-bold">Next</p>
    </v-btn>
  </div>

  <!-- render -->
  <render
    style="z-index: 1;"
    ref="SceneRef"
    :orbit="true"
    :far="100"
  />
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import * as THREE from 'three'
import Render from '@/components/Render';

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
  getPointCloud: {
    type: Function,
    required: true
  }
})

const SceneRef = ref(null);
var Scene;
var Mesh = null;
var trans_control = null;

var Size = 10;
var Define = {
  position: {x: 0, y: 0, z: 0},
  rotation: {_x: 0, _y: 0, _z: 0},
  size: Size
}
const RawPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0),0);
var Plane = new THREE.PlaneHelper(RawPlane, Size, 0x333333)

///***************************************************************
// Preview
function reset() {
  Mesh.position.set(Define.position.x, Define.position.y, Define.position.z);
  Mesh.rotation.set(Define.rotation._x, Define.rotation._y, Define.rotation._z);
  resetPlane(Define.size);
  Scene.render();
}

function setTransMode(mode) {
  trans_control.setMode(String(mode));
  Scene.render();
}

function resetPlane(size) {
  if(size < 4) size = 4;
  Size = size;
  Plane.geometry.dispose();
  Scene.removeObject(Plane);
  Plane = new THREE.PlaneHelper(RawPlane, size, 0x333333)
  Scene.addObject(Plane);
  Scene.render();
}

function getStep() {
  if(Size < 8) return 1;
  if(Size < 16) return 2;
  if(Size < 32) return 4;
  if(Size < 64) return 8;
  if(Size < 128) return 16;
  return 32;
}

function step(positive) {
  var st = getStep() * positive ? 1 : -1;
  resetPlane(Size + st);
}

///***************************************************************
// Save and get next
function save() {
  var data = {
    uid: props.UID,
    size: Size,
    position: Mesh.position,
    rotation: Mesh.rotation
  }
  fetch('/api/define', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    if(data.status) props.targetAt('gridding')
    else alert(data.msg)
  })
  .catch(err => alert(err))
}


///***************************************************************
// Mount
onMounted(() => {
  const box = document.getElementById('renderbox');
  Scene = SceneRef.value;
  Scene.resetSize({
    width: box.offsetWidth,
    height: box.offsetHeight,
  })
  Scene.start();

  props.getScene(true)
  .then((mesh) => {
    Mesh = mesh.clone();

    queryDetail(props.UID)
    .then(data => {
      Scene.addObject(Mesh);
      trans_control.attach(Mesh);

      if(data['define'] != undefined)
        Define = data['define'];
      
      reset();
    })
  })

  Scene.addObject(new THREE.AxesHelper(1));
  
  Scene.addObject(Plane);

  Scene.setCameraPosition(0,20,0);
  Scene.setCameraLookAt(0,0,0);
  Scene.render();

  trans_control = Scene.createTransformControl();

})
</script>
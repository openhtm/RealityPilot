<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 10; top:20px; left:20px">
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
        <v-icon color="primary">mdi-axis-arrow</v-icon>
      </v-btn>
      <v-btn size="small" @click="setTransMode('rotate')">
        <v-icon color="primary">mdi-rotate-orbit</v-icon>
      </v-btn>
      <v-btn size="small" @click="step(false)">
        <v-icon color="primary">mdi-minus</v-icon>
      </v-btn>
      <v-btn size="small" @click="step(true)">
        <v-icon color="primary">mdi-plus</v-icon>
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
import { useRouter } from 'vue-router';
import * as THREE from 'three'
import Render from '@/components/Render';

import {queryDetail} from '@/plugins/retrieve'

const Router = useRouter();
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
var Points = []

const RawPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0),0);
var Plane = new THREE.PlaneHelper(RawPlane, 10, 0x333333)
var Size = 10;

///***************************************************************
// Preview
function reset() {
  window.location.reload()
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

  props.getScene()
  .then((mesh) => {
    Mesh = mesh.clone();

    queryDetail(props.UID)
    .then(data => {
      if(data['define'] != undefined) {
        var define = data['define'];
        Mesh.position.set(define.position.x, define.position.y, define.position.z);
        Mesh.rotation.set(define.rotation._x, define.rotation._y, define.rotation._z);
        resetPlane(define.size);
      }

      Scene.addObject(Mesh);
      trans_control.attach(Mesh);
    })
  })

  props.getPointCloud()
  .then((pcd) => {
    Points = pcd.array.concat();
  })


  Scene.addObject(new THREE.AxesHelper(1));
  
  Scene.addObject(Plane);

  Scene.setCameraPosition(0,20,0);
  Scene.setCameraLookAt(0,0,0);
  Scene.render();

  trans_control = Scene.createTransformControl();

})
</script>
<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <div style="position: absolute; z-index: 10; top:20px; right:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="changePcdVisible"
    >
      <p class="text-body-1 text-white font-weight-bold">Points</p>
    </v-btn>
  </div>

  <render
    style="z-index: 1;"
    ref="SceneRef"
    :orbit="true"
    :far=60
    :near=0.05
  />
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import * as THREE from 'three'
import Render from '@/components/Render';

const props = defineProps({
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
var PointCloud = null;

///***************************************************************
// Preview
function changePcdVisible() {
  PointCloud.visible = !PointCloud.visible
  Scene.render();
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

  Scene.addObject(new THREE.AxesHelper(1));
  Scene.updateCamera((camera) => {
    camera.position.set(2,3,6);
    camera.lookAt(0,0,-1);
  })

  props.getScene()
  .then((mesh) => {
    Mesh = mesh;
    Scene.addObject(Mesh);
  })

  props.getPointCloud()
  .then((pcd) => {
    PointCloud = pcd.geometry;
    PointCloud.visible = false;
    Scene.addObject(PointCloud);
  })

})
</script>
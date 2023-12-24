<template>
<div>
  <!-- cancel 50 -->
  <ActionButton text="Cancel" @click="cancel" class="action-top-left"/>
  <!-- save 50 -->
  <ActionButton v-if="IsRunning" text="Next" @click="complete" class="action-top-right" />

  <!-- shade 5 -->
  <div class="shade-bg"></div>

  <!-- status mark 30 -->
  <template v-if="IsRunning">
    <!-- keyframe -->
    <div class="status-keyframe d-flex flex-column justify-center">
      <v-icon size="26">mdi-image-area</v-icon>
      <p class="text-body-1 font-weight-bold">{{ State.keyframe }}</p>
    </div>
    <!-- landmark -->
    <div class="status-landmark d-flex flex-column justify-center">
      <v-icon size="26">mdi-star-circle</v-icon>
      <p class="text-body-1 font-weight-bold">{{ State.landmark }}</p>
    </div>
  </template>

  <!-- info alert 40 -->
  <AlertMessage v-if="ShowAlert" :text="AlertText[State.code]" class="alert-bg"/>

  <!-- start button 50 -->
  <div v-if="State.code > Status.connecting" class="action-bottom d-flex flex-column">
    <div class="mx-16 mb-4">
      <p class="text-subtitle-1 font-weight-medium" style="text-align: center;">{{ HintText }}</p>
    </div>  
  
    <v-btn size="x-large" rounded="pill" color="primary" height="60"
      @click="start" :disabled="State.code == Status.unavailable" 
    >
      <p class="text-subtitle-1 font-weight-bold"> Start Capture </p>
    </v-btn>
  </div> 

  <!-- 3d scene 20 -->
  <div id="renderbox" style="position: absolute; height: 100%; width: 100%;z-index:20;">
    <render ref="SceneRef" style="position: relative; z-index:20; " 
      :fov="60" :near="0.15" :far="200"
      animation :onFrame="onFrame"
    />
    <!-- <render style="position: relative; z-index:40; " 
      ref="SceneRef"
      :fov="60" 
      :animation="true"
      :onFrame="onFrame"
      orbit
    /> -->
  </div>

  <!-- main video 1 -->
  <video id="env" playsinline="true" autoplay="true" style="z-index:1; overflow: hidden;"></video>

</div>
</template>


<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import * as THREE from 'three'
import Render from '@/components/Render';
import Session from '@/components/WebSFM/session'
import {MapProto, PointCloud} from '@/components/WebSFM/map'
import ActionButton from '@/layout/ActionButton.vue';
import AlertMessage from '@/layout/AlertMessage.vue';

/////***************************************************************
///// Props
const props = defineProps({
  onEnd: {
    type: Function,
    default: () => {}
  }
})

///// const value
const AlertText = [
 'Move the device to start', //0
  '', //1
  'Return to the previous area', //2
  'Connecting to server', // 3
  '',''
]
const HintText = "Keep the device parallel to the ground as possible to get better experience."
// system status
const Status = {init: 0, running: 1, lost: 2, connecting: 3, ready: 4, unavailable: 5};
const State = reactive({code: 5, keyframe: 0, landmark: 0});
// computed val
const ShowAlert = computed(()=>{
  return State.code == Status.init || State.code == Status.lost || State.code == Status.connecting;
})
const IsRunning = computed(()=>{
  return State.code < 3;
})
// scene views
const Map = new MapProto();
const PCD = new PointCloud(0.1);

///// Ref
const SceneRef = ref(null)

///// Data
var position = [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
var MediaSession = null;

var Scene = null;

/////***************************************************************
///// on update
function onFrame() {
  const RawData = position.concat();
  let data = Scene.formatTwcArray(RawData);
  const scale = 7;
  var normal_z = new THREE.Vector3(RawData[2], RawData[6], RawData[10]).multiplyScalar(scale);
  var T = data.T.add(normal_z);
  Scene.updateCamera((camrea)=>{
    camrea.position.copy(T);
    camrea.rotation.setFromRotationMatrix(data.R);
  })
  // if(camera_d != undefined) {
  //   camera_d.position.copy(T);
  //   camera_d.rotation.setFromRotationMatrix(data.R);
  // }
}

function onStatusUpdate(raw) {
  let data = JSON.parse(raw);
  State.code = data[0]; State.keyframe = data[1]; State.landmark = data[2]; // update status
  for(var i = 3; i < 19; i++) position[i - 3] = data[i];  // update position
}

function onMapbufUpdate(msg) {
  let points = Map.decode(msg)
  for(let p of points)  PCD.setPoint(p);  // update mapppoint
  PCD.update(Scene.getScene());
}

/////***************************************************************
///// on init
function coverSize() {
  const innerHeight = window.innerHeight;
  const innerWidth = window.innerWidth;

  const video = document.getElementById('env');

  if (innerWidth > innerHeight) {
    video.style.width = '100%';
    const height = innerWidth / 4 * 3;
    video.style.marginTop = `${(innerHeight - height) / 2}px`;
  } else {
    video.style.height = '100%';
    const width = innerHeight / 4 * 3;
    video.style.marginLeft = `${(innerWidth - width) / 2}px`;
  }
}

function setScene() {
  // set scene
  const box = document.getElementById('renderbox');
  Scene = SceneRef.value;
  Scene.resetSize({
    width: box.offsetWidth,
    height: box.offsetHeight * 1.5,
  })
}

//for debug
// var camera_d = undefined;
// function debugScene() {
//   Scene.updateCamera((camera) => {
//     camera.aspect = (window.innerWidth > window.innerHeight) ? 4 / 3 : 3 / 4;
//     camera.position.set(1,5,10);
//     camera.lookAt(0,0,0);
//   })

//   const aspect = (window.innerWidth > window.innerHeight) ? 4 / 3 : 3 / 4;
//   camera_d = new THREE.PerspectiveCamera(60, aspect, 0.15, 1000);
//   const cameraHelper = new THREE.CameraHelper(camera_d);
//   Scene.addObject(camera_d);
//   Scene.addObject(cameraHelper);
  
//   Scene.addObject(new THREE.AxesHelper(3));
// }
/////***************************************************************
///// action function
async function start() {
  State.code = 1;
  MediaSession.startCapture();
  Scene.start();

  // const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  // const planeHelper = new THREE.PlaneHelper(plane, 5, 0xffffff)
  // Scene.addObject(planeHelper);
  // debugScene();
}

async function cancel() {
  MediaSession.cancel();
  MediaSession.releaseMedia();
  props.onEnd();
}

async function complete() {
  MediaSession.complete();
  MediaSession.releaseMedia();
  props.onEnd();
}


/////***************************************************************
///// mounted
onMounted(() => {
  setScene();
  MediaSession = new Session(onStatusUpdate, onMapbufUpdate)
  MediaSession.getMedia((stream)=>{
    document.getElementById('env').srcObject = stream;
    setTimeout(()=>{
      coverSize();
      State.code = Status.ready;
    }, 1000)
  })
})

</script>


<style>
.action-bottom{
  position: absolute;
  z-index: 50;
  align-items: center;
  width: 100%;
  bottom:50px;
}
.action-top-left{
  position: absolute;
  z-index: 50;
  top:20px;
  left:20px;
}
.action-top-right{
  position: absolute;
  z-index: 50;
  top:20px;
  right:20px;
}
.alert-bg{
  position: absolute;
  z-index: 40;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
}
.status-keyframe{
  position: absolute;
  align-items: center;
  z-index: 30;
  bottom: 20px;
  left: 20px;
}
.status-landmark{
  position: absolute;
  z-index: 30;
  align-items: center;
  bottom: 20px;
  right: 20px;
}
.shade-bg{
  position: absolute;
  z-index: 5;
  width: 100%;
  height: 70%;
  bottom: 0;
  background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5));
}
</style>
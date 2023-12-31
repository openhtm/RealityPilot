<template>
  <div id="three"></div>
</template>

<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { onMounted } from 'vue';

const props = defineProps({
  fov: {
    type: Number, default: 45
  },
  alpha:{
    type: Boolean, default: true
  },
  near: {
    type: Number, default: 0.1
  },
  far: {
    type: Number, default: 1000
  },
  animation: {
    type: Boolean, default: false
  },
  orbit: {
    type: Boolean, default: false
  },
  onFrame: {
    type: Function, default: () => {}
  },
  ambient: {
    type: Number, default: 1
  }
})

var Height = 0;
var Width = 0;
// basic scene
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: props.alpha });
renderer.setPixelRatio( window.devicePixelRatio );

const camera = new THREE.PerspectiveCamera( props.fov, 4 / 3, props.near, props.far );
scene.add(camera)

const orbit = new OrbitControls( camera, renderer.domElement);
orbit.maxDistance = props.far;
orbit.minDistance = props.near;

// basic ambient light
const light = new THREE.AmbientLight(0xFFFFFF, props.ambient);
scene.add(light);

// on frame
var animation_id;


function start() {
  renderer.setSize(Width, Height);
  document.getElementById('three').appendChild(renderer.domElement);

  if(props.animation && animation_id){
    cancelAnimationFrame(animation_id);
  }

  const draw = () => {
    props.onFrame(camera);
    renderer.render(scene, camera);
    animation_id = requestAnimationFrame(draw);
  }

  if(props.animation)
    animation_id = requestAnimationFrame(draw);
  
}

function render() {
  renderer.render(scene, camera);
}

function stop() {
  if(animation_id){
    cancelAnimationFrame(animation_id);
  }
  document.getElementById('three').innerHTML = '';
}

function resetSize(size) {
  Width = size.width;
  Height = size.height;
  renderer.setSize(Width, Height);
  camera.aspect = Width / Height;
  camera.updateProjectionMatrix();
  console.log('reset size to ' + Width + 'x' + Height);
}

function addObject(object) {
  scene.add(object);
  render()
}

function removeObject(object) {
  scene.remove(object);
  render()
}

function updateCamera(hook=()=>{}) {
  hook(camera);
  if(props.orbit) orbit.update();
  render();
}

function createDragControl(objects, onDrag=()=>{}, onDragEnd=()=>{}) {
  const control = new DragControls( objects, camera, renderer.domElement);
  control.addEventListener('drag', ()=>{
    if(props.orbit) orbit.enabled = false;
    onDrag();
    render();
  })

  control.addEventListener('dragend',(event)=>{
    render();
    if(props.orbit) orbit.enabled = true;
    onDragEnd(event);
  })

  return control;
}

function createTransformControl(onMouseDown=()=>{}, onMouseUp=()=>{}) {
  const control = new TransformControls(camera, renderer.domElement);
  control.setMode('translate');
  control.addEventListener('change',render);
  control.addEventListener('mouseDown',()=>{
    if(props.orbit) orbit.enabled = false;
    onMouseDown();
  })
  control.addEventListener('mouseUp', ()=>{
    if(props.orbit) orbit.enabled = true;
    onMouseUp();
  })
  scene.add(control);
  render();
  return control;
}

onMounted(() => {
  if(props.orbit) {
    orbit.addEventListener( 'change', render ); // use if there is no animation loop
  }
  camera.position.set(new THREE.Vector3(0,0,0));
  camera.lookAt(new THREE.Vector3(0,0,-1));
})

defineExpose({
  start,
  stop,
  resetSize,
  render,
  addObject,
  removeObject,
  updateCamera,
  createDragControl,
  createTransformControl,
  getScene: () => scene,
  getCamera: () => camera,
})
</script>
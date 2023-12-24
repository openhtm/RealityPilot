<template>
  <div id="media" class="overflow-hidden">
    <!-- cancel -->
    <v-btn rounded="lg" variant="flat" size="large"
      style="position: absolute; z-index: 30; top:20px; left:20px;
              background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
      @click="stop('cancel')"
    >
      <p class="text-body-1 text-white font-weight-bold">Cancel</p>
    </v-btn>
  
    <!-- switch -->
    <!-- <div v-if="props.Type === 'create'"
      style="position: absolute; z-index: 20; top:20px; width: 100%;"
      class="d-flex justify-center align-center"
    > 
      <v-btn-toggle rounded="lg" elevation="0"
        v-model="FrameType" density="comfortable"
        color="primary"
        mandatory
        :disabled="!Available"
        @update:model-value="switchStream"
      >
        <v-btn value=0 @click="intentFrame(0)">
          <p class="text-body-2 font-weight-medium">Tracks</p>
        </v-btn>
        <v-btn value=1 @click="intentFrame(1)" :disabled="State[0] != 2">
          <p class="text-body-2 font-weight-medium">3D Map</p>
        </v-btn>
      </v-btn-toggle>
    </div> -->
  
    <!-- points -->
    <!-- <v-btn v-if="Started" :disabled="FrameType != 0"
      style="position: absolute; z-index: 40; top:20px; right:20px; background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      rounded="lg" variant="flat" size="large"
      @click="changeDrawFeatures"
    >
      <p class="text-body-1 text-white font-weight-bold">Points</p>
    </v-btn> -->
  
    <!-- guide -->
    <!-- <div v-if="Available" style="position: absolute; z-index: 15; width: 460px; top:80px; left:20px;"
      class="align-self-center">
      <v-alert v-if="State[0]==0 || State[0]==1 || State[0]==3 || State[0]==4"
        v-model="AlertFlag"
        closable
        class="text-white"
        rounded="lg"
        style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
        icon="$warning"
      >
        <v-alert-title class="text-h6 font-weight-black">
          {{ AlertText[State[0]].title }}
        </v-alert-title>
        <p class="text-subtitle-1 font-weight-medium">
          {{ AlertText[State[0]].content }}
        </p>
      </v-alert>
    </div> -->
  
    <!-- start button -->
    <div style="position: absolute; z-index: 30; height: 100%; right:40px;"
      class="d-flex align-center justify-center"
    > 
      <div style="width: 65px;height: 65px; border-radius: 50%;
          background-color: rgba(255, 255, 255, 0);
          border: 5px solid #fff;"
        class="d-flex justify-center align-center"
      > 
        <template v-if="!Started">
          <v-btn size="51" icon="" variant="flat" color="white" :disabled="!Available"
            @click="start"
          />
        </template>
        <template v-else>
          <v-btn size="55" icon="" variant="flat" color="deep-orange" :disabled="!Available"
            @click="stop('release')"
          />
        </template>
      </div>
    </div>
  
    <!-- status -->
    <v-btn v-if="Started" class="d-flex" 
      rounded="lg" variant="flat" size="large" :ripple="false" 
      style="position: absolute; z-index: 20; bottom:20px; left:20px;
             background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
    >
      <v-avatar style="margin-left: -10px;" class="align-self-start" size="10" 
        :color="State[0] == 2 ? 'success' : State[0] == 3 ? 'warning' : State[0] == 1 ? 'orange' : 'grey'"
      />
      <p class="text-body-1 text-white font-weight-bold ml-2">
        {{props.Type == 'create' ? 'Create Mode,' : 'Review Mode,'}}
        {{ State[1] }} Keyframes and {{ State[2] }} Mappoints
      </p>
    </v-btn>
  
    <!-- canvas -->
    <!-- <canvas id="canvas" style="position: absolute; z-index: 2;">
    </canvas>   -->
    <!-- main video -->
    <video id="env" playsinline="true" style="z-index:1; overflow: hidden;"></video>
  
  </div>
  </template>
  
  <script setup>
  import { reactive } from 'vue';
  import { onMounted, ref } from 'vue';
  import Session from '@/components/WebSFM.js'
  
  const props = defineProps({
    onComplete: {
      type: Function,
      default: () => {}
    },
    onCancel: {
      type: Function,
      default: () => {}
    },
    Type: {
      type: String,
      default: 'capture',
      required: true,
      validator: (value) => {
        return ['capture', 'review'].includes(value);
      }
    },
    UID: {
      type: String,
      default: '0'
    }
  })
  
  // const AlertFlag = ref(true);
  // const AlertText = [
  //   { // 0 // not start
  //     title: 'Directing Forward',
  //     content: 'Check and adjust the orientation of the device. For better experience, keep the device parallel to the ground as possible.'
  //   },
  //   { // 1 // not init
  //     title: 'Move Horizontally',
  //     content: 'Slowly move the device horizontally to initialize the tracking system.'
  //   },
  //   {},// 2 // ok
  //   { // 3 // lost
  //     title: 'Move Back',
  //     content: 'Tracking lost. Move back to previous environment and try move slower than before.'
  //   },
  //   { // 4 // connecting
  //     title: 'Hold Still',
  //     content: 'Connecting to SfM service. Hold the device still to avoid blurry images, which may affect initialization.'
  //   },
  // ]
  
  
  var position = [[1,0,0,0],
                  [0,1,0,0],
                  [0,0,1,0],
                  [0,0,0,1]]
  var features = []
  
  const Started = ref(false);
  const Available = ref(false);
  const State = reactive([0,0,0])
  var MediaSession = null;
  
  function coverSize() {
    const innerHeight = window.innerHeight;
    const innerWidth = window.innerWidth;
  
    const video = document.getElementById('env');
    video.style.width = '100%';
  
    const height = innerWidth * 3 / 4;
    video.style.marginTop = `${(innerHeight - height) / 2}px`;
    // if (innerWidth / innerHeight >= 4 / 3) {
    //   video.style.width = '100%';
    //   const height = innerWidth * 3 / 4;
    //   video.style.marginTop = `${(innerHeight - height) / 2}px`;
    // } else {
    //   video.style.height = '100%';
    //   const width = innerHeight * 4 / 3;
    //   video.style.marginLeft = `${(innerWidth - width) / 2}px`;
    // }
  }
  
  function fitCanvas() {
    const video = document.getElementById('env');
    const canvas = document.getElementById('canvas');
  
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    canvas.style.marginTop = video.style.marginTop;
    
    context = canvas.getContext('2d');
  }
  
  // function changeDrawFeatures() {
  //   if(DrawPoints.value)
  //     context.clearRect(0, 0, canvas.width, canvas.height);
  //   DrawPoints.value = !DrawPoints.value;
  // }
  
  // function drawFeatures() {
  //   context.clearRect(0, 0, canvas.width, canvas.height);
  //   context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  //   context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  //   context.lineWidth = 2;
  //   features.forEach((feature) => {
  //     let u = feature[0], v = feature[1];
  //     // reset position
  //     u = u / 640 * canvas.width;
  //     v = v / 480 * canvas.height;
  //     context.beginPath();
  //     context.fillRect(u - 2, v - 2, 4, 4)
  //   });
  // }
  
  // function intentFrame(val) {
  //   IntentFrameType = val;
  // }
  
    
  function getSize() {
    // set size
    const video = document.getElementById('env')
    return {
      width : video.clientWidth,
      height : video.clientHeight
    }
  }
  
  function getPosition() {
    var Twc = JSON.parse(JSON.stringify(position));
    return Twc;
  }
  
  // var SuccessCnt = -1;
  // function onStateUpdate(state) {
  //   if(props.Type === 'create') {
  //     // tracking lost or bad init
  //     if(State[0] == 2 && state[0] != 2) {
  //       SuccessCnt = 0;
  //       switchStream(0);
  //     }
  //     // count success times
  //     if(state[0] == 2 && SuccessCnt >= 0)
  //       SuccessCnt++;
  //     // switch to intent if stable
  //     if(state[0] == 2 && SuccessCnt > 10){
  //       switchStream(IntentFrameType);
  //       SuccessCnt = -1;
  //     }
  //   }
  
  //   // set alert flag on state update
  //   if(State[0] != state[0] && state[0] != 2)
  //     AlertFlag.value = true;
  //   // update state value
  //   for(let i = 0; i < 3; i++)
  //     State[i] = state[i];
  // }
  
  
  function onStatusUpdate(data) {
    // console.log(data)
  }
  
  function onMapbufUpdate(data) {
    console.log(data)
  }
  
  // start
  async function start() {
    // set status
    State[0] = 4;
    // AlertFlag.value = true;
    Started.value = true;
    // fit canvas
    // fitCanvas();
    MediaSession.start();
  }
  
  // stop webrtc connect
  async function stop(signal) {
    MediaSession.stop(signal.toLowerCase())
  }
  
  // on page mouted
  onMounted(() => {
    MediaSession = new Session(
      props.UID, 
      props.Type.toLowerCase(),
      onStatusUpdate,
      onMapbufUpdate
    )
    MediaSession.getMedia((stream)=>{
      document.getElementById('env').srcObject = stream;
      coverSize();
      document.getElementById('env').play();
      Available.value = true;
    })
  })
  
  // expose functions
  defineExpose({
    start,
    stop,
    getSize,
    getPosition,
  })
  
  </script>
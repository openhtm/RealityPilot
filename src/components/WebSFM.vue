<template>
<div id="media" class="overflow-hidden">
  <!-- selection -->
  <div style="position: absolute; z-index: 10; top:20px; width: 100%;"
    class="d-flex justify-center align-center"
  > 
    <v-btn-toggle rounded="lg" elevation="0"
      v-model="FrameType" density="comfortable"
      color="primary"
      mandatory
      :disabled="!Available"
      @update:model-value="switchStream"
    >
      <v-btn value=0>
        <p class="text-body-2 font-weight-medium">Tracks</p>
      </v-btn>
      <v-btn value=1>
        <p class="text-body-2 font-weight-medium">3D Map</p>
      </v-btn>
    </v-btn-toggle>
  </div>

  <!-- info -->
  <div style="position: absolute; z-index: 10; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat" size="large"
      style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
      @click="stop(1)"
    >
      <p class="text-body-1 text-white font-weight-bold">Cancel</p>
    </v-btn>
  </div>

  <!-- start button -->
  <div style="position: absolute; z-index: 10; height: 100%; right:40px;"
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
          @click="stop"
        />
      </template>
    </div>
  </div>

  <!-- <div style="position:absolute; z-index: 10; left:20px;bottom: 20px;">
    <video id="rtc" autoplay="true" playsinline="true" style="z-index:1; border-radius: 10px;"></video>
  </div> -->

  <!-- canvas -->
  <canvas id="canvas" style="position: absolute; z-index: 2;">
  </canvas>  
  <!-- main video -->
  <video id="env" playsinline="true" style="z-index:1; overflow: hidden;"></video>

    <!-- <div style="position: absolute; z-index: 9; width: 100%;" class="d-flex">
      <div id="cvl" style="width: 50%; aspect-ratio:4/3;">
      </div>
      <div id="cvr" style="width: 50%; aspect-ratio:4/3;" class="d-flex justify-center">
        <v-card variant="outlined"
          class="align-self-center px-4 rounded-lg"
          color="grey"
        >
          <p class="text-overline text-grey font-weight-black">
            STOPPED
          </p>
        </v-card>
        
      </div>
    </div> -->

    <!-- original data -->
    <!-- <div id="div_env" style="width: 50%;">
      <video id="env" autoplay="true" playsinline="true" style="width: 100%; z-index:1;"></video>
    </div>
    <div id="div_rtc" style="width: 50%;">
      <div style="position: absolute; width: 50%; aspect-ratio:4/3; z-index: -1;" class="d-flex justify-center">
        <v-card variant="outlined" color="grey" class="align-self-center px-4 rounded-lg">
          <p class="text-overline text-grey font-weight-black">
            {{ started ? "waiting" : "no signal" }}
          </p>
        </v-card>
      </div>
      <video id="rtc" autoplay="true" playsinline="true" style="width: 100%; z-index:1;"></video>
    </div> -->
    
</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const props = defineProps({
  onComplete: {
    type: Function,
    default: () => {}
  },
  onCancel: {
    type: Function,
    default: () => {}
  }
})

var pc = null;
var sig_dc = null;
var image_stream = null;
var remote_stream = null;
var position = [[1,0,0,0],
                [0,1,0,0],
                [0,0,1,0],
                [0,0,0,1]]

var features = []

const FrameType = ref(0);
const Started = ref(false);
const Available = ref(false);
var context = null;

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

function drawFeatures() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  context.lineWidth = 2;
  features.forEach((feature) => {
    let u = feature[0], v = feature[1];
    // reset position
    u = u / 640 * canvas.width;
    v = v / 480 * canvas.height;
    context.beginPath();
    context.fillRect(u - 2, v - 2, 4, 4)
  });
}

function switchStream() {
  var video = document.getElementById('env');
  if(Number(FrameType.value) == 0) {
    video.srcObject = image_stream;
  } else {
    video.srcObject = remote_stream;
  }
  video.play();
}
  
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

function setDataChannelHanderler() {
  pc.ondatachannel = (event) => {
    console.log('ondatachannel: ',event.channel.label)
    switch(event.channel.label) {
      case 'position':
        event.channel.onmessage = (evt) => {
          position = JSON.parse(evt.data)
        }
        break;
      case 'features':
        event.channel.onmessage = (evt) => {
          features = JSON.parse(evt.data);
          drawFeatures();
        }
        break;
      case 'state':
        event.channel.onmessage = (evt) => {
        }
        break;
      case 'signal':
        sig_dc = event.channel;
        break;
    }
  };
}

// create peer connection
function createPeerConnection() {
	pc = new RTCPeerConnection({
		sdpSemantics: 'unified-plan'
    //iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
	});
	// connect audio / video
	pc.addEventListener('track', (evt) => {
    remote_stream = evt.streams[0];
		// document.getElementById('rtc').srcObject = evt.streams[0];
	});
	return pc;
}

// webrtc
function negotiate(mode) {
  return pc.createOffer().then(function(offer) {
    return pc.setLocalDescription(offer);
  }).then(function() {
    // wait for ICE gathering to complete
    return new Promise(function(resolve) {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        function checkState() {
          if (pc.iceGatheringState === 'complete') {
            pc.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        }
        pc.addEventListener('icegatheringstatechange', checkState);
      }
    });
  })
  .then(() => {
		var offer = pc.localDescription;
		return fetch('/api/session', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        sdp: offer.sdp,
        type: offer.type,
        create_mode: mode
      }),
		});
  })
  .then((response) => {
    return response.json();
  })
  .then((answer) => {
    return pc.setRemoteDescription(answer);
  })
  .catch((e) => alert(e));
}

// get media
async function getMedia(callback=()=>{}) {
  navigator.mediaDevices.getUserMedia({
    video:{
      facingMode: 'environment',
      width: 640,
      height: 480
    },
    audio: false
  }).then(function(stream) {
    // set value
    image_stream = stream;
		// set original stream
		document.getElementById('env').srcObject = image_stream;
    coverSize();
    document.getElementById('env').play();
    Available.value = true;
    callback();
  }, function(err) {
      alert('Could not acquire media: ' + err);
  });
}

// start
async function start(mode=true) {
  // set status
  Started.value = true;
  // fit canvas
  fitCanvas();
  // webrtc connection
  pc = createPeerConnection();
  var dc = pc.createDataChannel('');

  // set tracks for webrtc
  image_stream.getTracks().forEach(function(track) {
    track.contentHint = 'detail';
    pc.addTrack(track, image_stream);
  });
  // set data channel
  setDataChannelHanderler()
  return negotiate(mode);
}

function releaseMedia() {
  // release media
  if(image_stream) {
    image_stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  if(remote_stream) {
    remote_stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
}

// stop webrtc connect
async function stop(canceled = false) {
  canceled = Boolean(canceled);
  let hook = props.onCancel;

  if(Started.value) {
    // set stop signal
    if(sig_dc) sig_dc.send(canceled ? 'cancel' : 'release');
    Started.value = false;
    if(!canceled) hook = props.onComplete;

    // close transceivers
    if (pc.getTransceivers) {
      pc.getTransceivers().forEach(function(transceiver) {
        if (transceiver.stop) {
          transceiver.stop();
        }
      });
    }
    // close peer connection
    pc.close();
    pc.getSenders().forEach(function(sender) {
      sender.track.stop();
    });
  }

  hook();  
}

// on page mouted
onMounted( () => {
})

// expose functions
defineExpose({
  getMedia,
  releaseMedia,
  start,
  stop,
  getSize,
  getPosition,
})

</script>
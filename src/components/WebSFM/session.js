class Session {
  // webrtc
  pc = null;
  stream = null;
  // dc
  signal_dc = null;
  onStatusUpdate = null;
  onMapbufUpdate = null;
  // flag
  started = false;

  constructor(onStatusUpdate = ()=>{}, onMapbufUpdate = ()=>{}) {
    this.onStatusUpdate = onStatusUpdate;
    this.onMapbufUpdate = onMapbufUpdate;
  }

  // init client media
  async getMedia(on_success=()=>{}) {
    navigator.mediaDevices.getUserMedia({
      video:{
        facingMode: 'environment',
        width: 640,
        height: 480
      },
      audio: false
    }).then((stream) => {
      // set value
      this.stream = stream;
      // set original stream
      on_success(stream);
    }, (err) => {
        alert('Could not acquire media: ' + err);
    });
  }

  // release client media
  releaseMedia() {
    // release media
    if(this.stream) {
      this.stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
  }

  // start new capture
  async startCapture() {
    this.createPeerConnection();
    this.stream.getTracks().forEach((track) => {
      track.contentHint = 'detail';
      this.pc.addTrack(track, this.stream);
    });
    // set data channel
    this.setDataChannelHanderler();
    return this.negotiate('/api/session/capture');
  }

  // start review
  async startReview(target) {
    this.createPeerConnection();
    this.stream.getTracks().forEach((track) => {
      track.contentHint = 'detail';
      this.pc.addTrack(track, this.stream);
    });
    // set data channel
    this.setDataChannelHanderler();
    return this.negotiate('/api/session/review', String(target));
  }

  // start session
  // async start() {
  //   this.createPeerConnection();
  //   this.stream.getTracks().forEach((track) => {
  //     track.contentHint = 'detail';
  //     this.pc.addTrack(track, this.stream);
  //   });
  //   // set data channel
  //   this.setDataChannelHanderler()
  //   return this.negotiate();
  // }
  async complete(on_complete=()=>{}) {
    return this.stop('release', on_complete);
  }

  async cancel(on_cancel=()=>{}) {
    return this.stop('cancel', ()=>{}, on_cancel);
  }

  // stop webrtc connect
  async stop(signal, on_complete, on_cancel) {
    let canceled = !(signal === 'release');
    let hook = on_cancel;
    if(this.started) {
      // set stop signal
      if(this.signal_dc) this.signal_dc.send(canceled ? 'cancel' : 'release');
      this.started = false;
      if(!canceled) hook = on_complete;

      // close transceivers
      const pc = this.pc;
      if (pc.getTransceivers) {
        pc.getTransceivers().forEach(function(transceiver) {
          if (transceiver.stop) transceiver.stop();
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
  
  // on datachannel signal received
  setDataChannelHanderler() {
    this.pc.ondatachannel = (event) => {
      console.log('ondatachannel: ',event.channel.label)
      const label = event.channel.label;
      if(label === 'status') {
        this.signal_dc = event.channel;
        event.channel.onmessage = (event) => this.onStatusUpdate(event.data);
      }
      else if(label === 'protobuf') {
        event.channel.onmessage = (event) => this.onMapbufUpdate(event.data);
      }
    };
  }

  // create peer connection
  createPeerConnection() {
    this.pc = new RTCPeerConnection({
      sdpSemantics: 'unified-plan'
      //iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
    });
    // connect audio / video
    this.pc.addEventListener('track', (evt) => {
      //
    });
    var dc = this.pc.createDataChannel('');
  }

  // webrtc
  negotiate(url, target=undefined) {
    const pc = this.pc;
    return pc.createOffer().then(function(offer) {
      return pc.setLocalDescription(offer);
    }).then(function() {
      // wait for ICE gathering to complete
      return new Promise((resolve, reject) => {
        if (pc.iceGatheringState === 'complete') resolve();
        else {
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
      const settings =  this.stream.getVideoTracks()[0].getSettings()
      var offer = pc.localDescription;
      // send offer to server
      let data = {
        sdp: offer.sdp,
        type: offer.type,
        width: settings.width,
        height: settings.height
      }
      if(target)  data.target = target;

      return fetch(url, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
      });
    })
    .then((response) => response.json())
    .then((answer) => {
      if(answer.status){
        pc.setRemoteDescription(answer);
        this.started = true;
      }
      else throw answer.msg;
    })
    .catch((e) => alert(e));
  }
}

export default Session;
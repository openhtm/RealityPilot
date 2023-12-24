
import protobuf from 'protobufjs'
import * as THREE from 'three'

// Map Data from protobuf
class MapProto {
  pb = undefined
  
  constructor() {
    protobuf.load('/pointcloud.proto')
    .then((root) => {
      this.pb = root.lookupType('pointcloud')
    })
    .catch(err => console.log(err))
  }
  
  decode(msg) {
    if (msg.length == 0 || this.pb == undefined)
      return;

    let buffer = this.base64ToUint8Array(msg)
    let obj = this.pb.decode(buffer)
    // points
    let points = []
    for (let pointObj of obj.points) {
      let point = {};
      point["id"] = pointObj.id;
      if (pointObj.xyz.length != 0) {
          point["xyz"] = pointObj.xyz;
          point["rgb"] = pointObj.rgb;
      }
      points.push(point);
    }
    return points;
  }

  base64ToUint8Array(input) {
    let binaryString = window.atob(input);
    let len = binaryString.length;
    let bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++)
        bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  // 
}

// THREE.js Point Cloud
const CLOUD_SIZE = 2000;
class PointCloud {

  constructor(size = 0.05) {
    this.material = new THREE.PointsMaterial({
      size: size,
      vertexColors: true/*,color:"rgb(255,255,0)"*/
    });

    this.clouds = [];
    this.status = [];
    // this.cloudGeo = [];
    // this.cloudGeoCache = [];
    this.base_array = []
    this.base_color = []
    for(let i = 0; i < CLOUD_SIZE; i++) {
      this.base_array.push(0, 0, -1e5);
      this.base_color.push(0, 0, 0);
    }

    this.idmap = {};  // vertex id map from slam to three.js
    this.cnt = 0;  // number of points, increase only
  }

  setPoint(point) {
    if(point.xyz != undefined)
      if(this.idmap[point.id] === undefined || this.idmap[point.id] < 0)
        return this.addPoint(point.id, point.xyz[0], point.xyz[1], point.xyz[2], point.rgb[0], point.rgb[1], point.rgb[2]);
      else
        return this.updatePoint(point.id, point.xyz[0], point.xyz[1], point.xyz[2], point.rgb[0], point.rgb[1], point.rgb[2]);
    else 
      return this.removePoint(point.id);   
  }

  // private methods
  addPoint(id, x, y, z, r, g, b) {
    // calc point coordinate
    this.idmap[id] = this.cnt;
    this.cnt++;

    let idx = this.cnt / CLOUD_SIZE | 0;

    if(!this.clouds[idx]) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.base_array.concat(), 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.base_color.concat(), 3));
      const points = new THREE.Points(geometry, this.material);
      this.clouds.push(points);
      this.status.push(false);
    }

    const cloud = this.clouds[idx];
    const geo = cloud.geometry;
    const position = geo.getAttribute('position');
    const color = geo.getAttribute('color');

    position.setXYZ(this.cnt % CLOUD_SIZE, x, y, z);
    color.setXYZ(this.cnt % CLOUD_SIZE, r/255, g/255, b/255);
    
    position.needsUpdate = true;
    color.needsUpdate = true;
  }

  updatePoint(id, x, y, z, r, g, b) {
    let idx = this.idmap[id];
    let cloudIdx = idx / CLOUD_SIZE | 0;
    let pointIdx = idx % CLOUD_SIZE;

    const cloud = this.clouds[cloudIdx];
    const geo = cloud.geometry;
    const position = geo.getAttribute('position');
    const color = geo.getAttribute('color');

    position.setXYZ(pointIdx, x, y, z);
    position.needsUpdate = true;

    color.setXYZ(pointIdx, r/255, g/255, b/255);
    color.needsUpdate = true;
  }

  removePoint(id) {
    if (!(id in this.idmap))
      return;
    let idx = this.idmap[id];
    // Move point to pool(origin)
    let cloudIdx = idx / CLOUD_SIZE | 0;
    let pointIdx = idx % CLOUD_SIZE;

    const cloud = this.clouds[cloudIdx];
    const geo = cloud.geometry;
    const position = geo.getAttribute('position');

    position.setXYZ(pointIdx, 0, 0, -1e5);
    position.needsUpdate = true;

    let vertexIdx = this.idmap[id];
    // Do nothing if point has been already removed.
    if (vertexIdx < 0)
      return;
    this.idmap[id] = -1;
  }

  update(scene) {
    for(let i = 0; i < this.clouds.length; i++) {
      if(!this.status[i]) {
        scene.add(this.clouds[i]);
        this.status[i] = true;
      }
    }
  }

  updateSize(new_size) {
    for(let i = 0; i < this.clouds.length; i++) {
      const mesh = this.clouds[i];
      const material = mesh.material;
      material.size = new_size;
      material.needsUpdate = true;
    }
  }
}

export { MapProto, PointCloud }
import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

async function queryScenes() {
  return new Promise((resolve, reject) => {
    fetch('/api/retrieve')
    .then(response => response.json())
    .then(data => resolve(data))
    .catch(err => reject(err)
    )
  })
}

async function queryDetail(uid) {
  return new Promise((resolve, reject) => {
    fetch('/api/detail?uid=' + uid)
    .then(response => response.json())
    .then(data => resolve(data))
    .catch(err => reject(err)
    )
  })
}

async function removeScene(uid) {
  return new Promise((resolve, reject) => {
    fetch('/api/remove', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        uid: uid
      }),
		})
    .then(response => response.json())
    .then(data => resolve(data))
    .catch(err => reject(err)
    )
  })
}

async function loadPointCloud(uid, onLoad, onProgress, onError) {
  new PLYLoader().load('/api/static/usr/' + String(uid) + '/scene/dense.ply',
    (geometry) => {
      const material = new THREE.PointsMaterial({ size: 0.01, color: 0xffffff, });
      var mesh = new THREE.Points(geometry, material);
      // create point array
      var points_arr = mesh.geometry.attributes.position.array;
      let pcd = []
      for(var i = 0; i < points_arr.length; i += 3){
        pcd.push(
          new THREE.Vector3(points_arr[i], points_arr[i + 1], points_arr[i + 2])
        )
      }

      if (onLoad) onLoad(mesh, pcd);
    },
    (xhr) => {
      if (onProgress) onProgress(xhr);
    },
    (err) => {
      if (onError) onError(err);
      else console.log(err);
    }
  )
}

async function loadScene(uid, onLoad, onProgress, onError) {
  new PLYLoader().load('/api/static/usr/' + String(uid) + '/scene/texture.ply',
    (geometry) => {
      // load texture
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: new THREE.TextureLoader().load('/api/static/usr/' + String(uid) + '/scene/texture.png'),
      })
      // set mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.material.needsUpdate = true;

      if (onLoad) onLoad(mesh);
    },
    (xhr) => {
      if (onProgress) onProgress(xhr);
    },
    (err) => {
      if (onError) onError(err);
      else console.log(err);
    }
  )
}

export {queryScenes, removeScene, loadPointCloud, loadScene, queryDetail}
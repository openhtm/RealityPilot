import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { Graph, astar } from './astar';

class GridMap{
  // point cloud
  pcd = null;
  points = null;
  // grid
  grid = null;
  size = null;
  division = null;
  graph = null;

  constructor() {
    // translation
    this.twp = null;
    this.tpw = null;
    // rotation
    this.rwp = null;
    this.rpw = null;
  }

  // load point cloud file
  loadPLY(url, callback = ()=>{}, loading = ()=>{}){
    new PLYLoader().load(url,
      (geometry) => {
        var points_arr = new THREE.Points(geometry).geometry.attributes.position.array;
        this.pcd = []
        for(var i = 0; i < points_arr.length; i += 3){
          var p = new THREE.Vector3(points_arr[i], points_arr[i + 1], points_arr[i + 2]);
          this.pcd.push(p);
        }

        callback(this.pcd);
      },
      (xhr) => {
        loading(xhr);
      },
      (err) => {
        console.log(err);
      }
    )
  }

  // set plane
  define(position, rotation) {
    // transform
    this.points = []
    this.pcd.forEach((point) => {
      var p = point.clone();
      p.applyEuler(rotation);
      p.add(position);
      this.points.push(p);
    })

    // calculate transform matrix
    this.rpw = new THREE.Matrix4().makeRotationFromEuler(rotation);
    this.tpw = new THREE.Vector3(position.x, position.y, position.z);
    // calculate invert
    this.rwp = this.rpw.invert();
    this.twp = this.tpw * -1;
  
    return this;
  }

  // threshold
  filter(min = 0, max = Infinity) {
    this.points = this.points.filter((point) => {
      var y = Math.abs(point.y);
      return y >= min && y <= max;
    });

    return this;
  }

  // flatten
  flatten(size, division) {
    this.size = size;
    this.division = division;
    const resolution = size / division;
    const half_size = size / 2;
    
    // flatten
    var point_flatten = this.points.map((point) => {
      point.y = 0;
      return point;
    });

    // define grid
    this.grid = new Array(division).fill().map(() => {
      return new Array(division).fill(0);
    })

    // set grids
    point_flatten.forEach((point) => {
      var x = Math.floor((point.x + half_size) / resolution);
      var z = Math.floor((point.z + half_size) / resolution);
      
      if(x < 0 || x >= division || z < 0 || z >= division)
        return;
      
      this.grid[division - 1 - z][x]++;
    });

    this.graph = new Graph(this.grid);
    return this.grid;
  }

  // search
  search(start, end) {
    var start_x = Math.floor((start.x + this.size / 2) / (this.size / this.division));
    var start_z = Math.floor((start.z + this.size / 2) / (this.size / this.division));
    var end_x = Math.floor((end.x + this.size / 2) / (this.size / this.division));
    var end_z = Math.floor((end.z + this.size / 2) / (this.size / this.division));

    var start_node = this.graph.grid[start_z][start_x];
    var end_node = this.graph.grid[end_z][end_x];

    var result = astar.search(this.graph, start_node, end_node);
    return result;
  }
  

}

export default GridMap;
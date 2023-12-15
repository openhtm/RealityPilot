import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { Graph, astar } from './astar';

class GridMap{
  // point cloud
  points = null;
  // transform
  position = null;
  rotation = null;
  // grid
  grid = null;
  size = null;
  division = null;
  graph = null;

  constructor() {}

  // set plane
  define(size, position, rotation) {
    // transform
    this.size = size;
    this.position = position;
    this.rotation = rotation;
  
    return this;
  }

  // set point
  setData(points) {
    this.points = [];
    points.forEach((point) => {
      var p = point.clone();
      p.applyEuler(this.rotation);
      p.add(this.position);
      this.points.push(p);
    })

    return this;
  }

  // set grid
  setGrid(grid) {
    this.grid = grid;
    this.graph = new Graph(this.grid);
    return this.grid;
  }

  // threshold
  filter(min = 0, max = Infinity) {
    this.points = this.points.filter((point) => {
      return point.y >= 0 && point.y >= min && point.y <= max;
    });

    return this;
  }

  // flatten
  flatten(division) {
    this.division = division;
    const resolution = this.size / division;
    const half_size = this.size / 2;
    
    // flatten
    var point_flatten = this.points.map((point) => {
      point.y = 0;
      return point;
    });

    // define grid
    this.grid = new Array(division).fill().map(() => {
      return new Array(division).fill(1);
    })

    // set grids
    point_flatten.forEach((point) => {
      var x = Math.floor((point.x + half_size) / resolution);
      var z = Math.floor((point.z + half_size) / resolution);
      
      if(x < 0 || x >= division || z < 0 || z >= division)
        return;
      
      this.grid[z][x] = 0;
    });

    this.graph = new Graph(this.grid);
    return this.grid;
  }

  // search
  search(start, end) {
    var start_node = this.graph.grid[start.x][start.z];
    var end_node = this.graph.grid[end.x][end.z];

    var result = astar.search(this.graph, start_node, end_node);
    return result;
  }
  

}

export default GridMap;
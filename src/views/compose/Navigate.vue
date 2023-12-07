<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 20; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click=""
    >
      <p class="text-body-1 text-white font-weight-bold">Reset</p>
    </v-btn>
  </div>

  <!-- toolkit -->
  <div style="position: absolute; z-index: 10; top:20px; width: 100%;"
    class="d-flex justify-center align-center"
  > 
    <v-btn-group rounded="lg" elevation="0"  density="comfortable" color="white">
      <v-btn size="small" @click="setMarkType(1)" :color="MarkType == 1 ? 'primary' : 'white'">
        <v-icon size="x-large" :color="MarkType == 1 ? 'white' : 'primary'">
          mdi-checkbox-blank-outline
        </v-icon>
      </v-btn>
      <v-btn size="small" @click="setMarkType(0)" :color="MarkType == 0 ? 'primary' : 'white'">
        <v-icon size="x-large" :color="MarkType == 0 ? 'white' : 'primary'">
          mdi-close
        </v-icon>
      </v-btn>
      <v-btn size="small" @click="setMarkType(2)" :color="MarkType == 2 ? 'primary' : 'white'">
        <v-icon size="x-large" :color="MarkType == 2 ? 'white' : 'primary'">
          mdi-map-marker-outline
        </v-icon>
      </v-btn>
    </v-btn-group>
  </div>

  <!-- save -->

  <!-- grid map -->
  <div class="pa-16 fill-height">
    <div id="gridmap" 
      style="width: 100%; height: 100%;" 
      class="d-flex justify-center align-center"
    >
      <div class="d-flex flex-column">
        <div v-for="(row, rowIndex) in GridArray.data" :key="rowIndex" class="d-flex">
          <div v-for="(cell, colIndex) in row" 
            style="border: 0.5px solid #ccc;"
            :style="(cell == 0 ? 'background-color: #424242;' : 
                     cell == 2 ? 'background-color: #FF5722;' : 
                     cell == 3 ? 'background-color: #4CAF50;' : '') 
                    + GridStyle"
            @click="markAt(rowIndex, colIndex)"
          >
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import GridMap from '@/plugins/map'
import {queryDetail} from '@/plugins/retrieve'
import { withDirectives } from 'vue';
import Start from '../index/Start.vue';
import { LatheGeometry } from 'three';

const props = defineProps({
  UID: {
    type: String,
    required: true
  },
  targetAt: {
    type: Function,
    required: true
  }
})

///***************************************************************
// grid map
const Grid = new GridMap();
const GridArray = reactive({data: [[]]})
const GridStyle = ref('')

function resetGridSize(div) {
  const gridmap = document.getElementById('gridmap')
  const width = gridmap.offsetWidth, height = gridmap.offsetHeight;
  const col = (width > height ? height : width) / div;
  GridStyle.value = 'width:' + col + 'px; height:' + col + 'px;'
}

///***************************************************************
// landmark
const MarkType = ref(-1);
var Last = null;
var Path = [];
var interval_id = null;

function setMarkType(val){
  MarkType.value = (MarkType.value == val ? -1 : val);
}

function markAt(x, y) {
  // console.log(x, y);
  if(MarkType.value == -1) return searchAt(x, y);

  if(GridArray.data[x][y] == 0 && MarkType.value == 2) return;
  if(GridArray.data[x][y] == MarkType.value) return;
    
  GridArray.data[x][y] = MarkType.value;
  Grid.setGrid(GridArray.data);
}

function searchAt(x, y) {
  if(interval_id || GridArray.data[x][y] == 0) return;

  if(!Last) {
    Last = {x: x, y: y};
    GridArray.data[x][y] = 3;
  } else if(!(Last.x == x && Last.y == y)) {
    let end = {x: x, y: y};

    let result = Grid.search(Last, end);
    if(result.length == 0) {
      alert('No Available Path');
      return;
    }

    reviewPath(result);
    Last = end;
  }
}

function reviewPath(result) {
  Path.push(Last);
  result.forEach(node => {
    Path.push(node);
  });

  interval_id = setInterval(updatePath, 15);
}

function updatePath() {
  if(Path.length == 1) {
    let node = Path.shift();
    GridArray.data[node.x][node.y] = 3;
    clearInterval(interval_id);
    interval_id = null;
    return;
  }

  let node = Path.shift();
  GridArray.data[node.x][node.y] = 1;

  const max = (Path.length > 4 ? 4 : Path.length);
  for(let i = 0; i < max; i++) {
    let node = Path[i];
    GridArray.data[node.x][node.y] = 3;
  }
}

///***************************************************************
// Mounted
onMounted(() => {
  queryDetail(props.UID)
  .then(data => {
    var define = data['define'];
    var gridinfo = data['grid'];

    if(define == undefined) {
      alert('Fundamental has not been defined');
      props.targetAt('define');
      return;
    }
    
    if(gridinfo == undefined) {
      alert('Map has not been flatten');
      props.targetAt('define');
      return;
    }
    
    // set grid
    Grid.define(define.size, define.position, define.rotation);
    GridArray.data = Grid.setGrid(gridinfo.array)
    resetGridSize(gridinfo.division);

  })
})


</script>
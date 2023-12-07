<template>
<div id="renderbox" class="fill-height" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 20; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="reset"
    >
      <p class="text-body-1 text-white font-weight-bold">Reset</p>
    </v-btn>
  </div>

  <!-- adjust bars -->
  <div style="position: absolute; z-index: 10; height: 120px; top:70px; left: 20px;"
    class="d-flex flex-column justify-start align-start"
  > 
    <template v-for="(value, key) in Settings">
      <div class="d-flex mb-2">
        <v-btn variant="flat" rounded="lg" width="76" class="mr-2" @click="changeVisible(value.idx)">
          <v-icon size="x-large" color="primary">{{ value.icon }}</v-icon>
        </v-btn>
        <div>
          <slide-bar 
            :ref="setItemRef"
            :height="36"
            :data="value"
          />
        </div>
        
      </div>
    </template>
  </div>

  <!-- save -->
  <div style="position: absolute; z-index: 10; top:20px; right:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="save"
    >
      <p class="text-body-1 text-white font-weight-bold">Save</p>
    </v-btn>
  </div>

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
            :style="(cell == 0 ? 'background-color: #424242;' : '') + GridStyle"
          >
          </div>
        </div>
      </div>
    </div>
  </div>


<!-- waiting dialog -->
<v-dialog v-model="Wait" persistent width="auto"
  style="background: rgba(0,0,0,0.1); backdrop-filter: blur(20px);"
  class="d-flex justify-center align-center"
>
  <div style="width: 200px; height: 60px;"
    class="d-flex flex-column align-center justify-center"
  >
    <p class="text-h6 mb-2 text-white">Flattening</p>
    <v-progress-linear   
      rounded
      height="6"
      indeterminate
      color="white"
    />
  </div>
</v-dialog>
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import SlideBar from '@/layout/SlideBar.vue'
import GridMap from '@/plugins/map'
import {queryDetail} from '@/plugins/retrieve'

const props = defineProps({
  UID: {
    type: String,
    required: true
  },
  targetAt: {
    type: Function,
    required: true
  },
  getPointCloud: {
    type: Function,
    required: true
  }
})

const Wait = ref(false);

const SettingRefs = []
const Settings = {
  division: {
    idx: 0,
    icon: 'mdi-dots-grid',
    min: 16,
    max: 256,
    step: 1,
    default: 64,
    onEnd: onChange
  },
  mindist: {
    idx: 1,
    icon: 'mdi-arrow-down-thick',
    min: 0,
    max: 0.5,
    step: 0.01,
    default: 0.01,
    onEnd: onChange
  },
  maxdist: {
    idx: 2,
    icon: 'mdi-arrow-up-thick',
    min: -1,
    max: 64,
    step: 1,
    default: -1,
    onEnd: onChange
  }
}

const setItemRef = e => {
  if(e) SettingRefs.push(e);
}

function changeVisible(idx) {
  SettingRefs[idx].changeVisible();
}

function resetGridSize() {
  const gridmap = document.getElementById('gridmap')
  const width = gridmap.offsetWidth, height = gridmap.offsetHeight;
  const size = width > height ? height : width;

  const col = size / SettingRefs[0].getVal();
  GridStyle.value = 'width:' + col + 'px; height:' + col + 'px;'
  
  // console.log('reset grid size to ' + col + 'px');
}

///***************************************************************
// grid map
const Grid = new GridMap();
const GridArray = reactive({
  data: [[]]
})
var Points = []

const GridStyle = ref('')

function reset() {
  SettingRefs.forEach(item => {
    item.reset();
  })
  onChange();
}

function onChange() {
  Wait.value = true;

  const div = SettingRefs[0].getVal();
  const min = SettingRefs[1].getVal();
  const max = SettingRefs[2].getVal() < 0 ? Infinity : SettingRefs[2].getVal();

  setTimeout(() => {
    GridArray.data = Grid.setData(Points).filter(min, max).flatten(div);
    resetGridSize();
    Wait.value = false;
  }, 500);
}

function save() {
  var data = {
    uid: props.UID,
    division: SettingRefs[0].getVal(),
    mindist: SettingRefs[1].getVal(),
    maxdist: SettingRefs[2].getVal(),
    array: Grid.grid
  }
  fetch('/api/gridding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    if(data.status){
      setTimeout(() => {
        props.targetAt('navigate')
      }, 500);
    }else alert(data.msg)
  })
  .catch(err => alert(err))
}


///***************************************************************
// Mounted
onMounted(() => {
  queryDetail(props.UID)
  .then(data => {
    var define = data['define'];
    var gridinfo = data['grid'];

    if(data['define'] == undefined) {
      alert('Fundamental has not been defined');
      props.targetAt('define');
      return;
    }
    
    // define basic info
    Grid.define(define.size, define.position, define.rotation);

    props.getPointCloud(true)
    .then((pcd) => {
      Points = pcd.array.concat();
      if(gridinfo != undefined) {
        // reset detail
        SettingRefs[0].setVal(gridinfo.division);
        SettingRefs[1].setVal(gridinfo.mindist);
        SettingRefs[2].setVal(gridinfo.maxdist),
        // set array
        GridArray.data = Grid.setGrid(gridinfo.array)
        resetGridSize();
      
      } else {
        // flatten through data
        onChange();
      }
    })
  })
})

</script>
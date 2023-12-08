<template>
<div id="renderbox" class="fill-height overflow-x-auto" style="position: relative; z-index:1;">
  <!-- reset-->
  <div style="position: absolute; z-index: 20; top:20px; left:20px">
    <v-btn  rounded="lg" variant="flat"
      style="background: rgba(0,0,0,0.2); backdrop-filter: blur(10px);"
      @click="reset"
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
      <v-btn size="small" @click="resetGridSize(-1)">
        <v-icon size="x-large" color="primary">mdi-minus</v-icon>
      </v-btn>
      <v-btn size="small" @click="resetGridSize(1)">
        <v-icon size="x-large" color="primary">mdi-plus</v-icon>
      </v-btn>
    </v-btn-group>
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
            @click="markAt(rowIndex, colIndex)"
          >
          </div>
        </div>
      </div>
    </div>
  </div>

<loading ref="LoadingRef" Text="Flattening" />
</div>
</template>

<script setup>
import { onMounted, ref, reactive, toRaw } from 'vue';
import SlideBar from '@/layout/SlideBar.vue'
import Loading from '@/layout/Loading.vue'
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
  },
  getScene: null
})

const LoadingRef = ref(null);

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

function reset() {
  SettingRefs.forEach(item => {
    item.reset();
    item.changeVisible();
  })
  onChange();
}

// flatten grid map from pointcloud
function onChange(val = null) {
  LoadingRef.value.show();

  const div = SettingRefs[0].getVal();
  const min = SettingRefs[1].getVal();
  const max = SettingRefs[2].getVal() < 0 ? Infinity : SettingRefs[2].getVal();

  setTimeout(() => {
    GridArray.data = Grid.setData(Points).filter(min, max).flatten(div);
    resetGridSize(val);
    setTimeout(() => {
      LoadingRef.value.hide();
    }, 500);
  }, 500);
}

///***************************************************************
// grid map
const Grid = new GridMap();
const GridArray = reactive({
  data: [[]]
})
var Points = []

const GridStyle = ref('')
var MaxWidth = 0;

function resetGridSize(mode = null) {
  const gridmap = document.getElementById('gridmap');
  const width = gridmap.offsetWidth, height = gridmap.offsetHeight;
  if(mode == 0)
    MaxWidth = Math.min(width, height);
  else if(mode == -1)
    MaxWidth = Math.floor(MaxWidth * 0.8);
  else if(mode == 1)
    MaxWidth = Math.floor(MaxWidth * 1.2);
  
  const col = MaxWidth / SettingRefs[0].getVal();
  GridStyle.value = 'width:' + col + 'px; height:' + col + 'px;'
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
// landmark
const MarkType = ref(-1);

function setMarkType(val){
  MarkType.value = (MarkType.value == val ? -1 : val);
}

function markAt(x, y) {
  // console.log(x, y);
  if(MarkType.value == -1) return;
  GridArray.data[x][y] = MarkType.value;
}


///***************************************************************
// Mounted
onMounted(() => {
  SettingRefs.forEach(item => {
    item.changeVisible();
  })

  // query and set details
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
        SettingRefs[0].setDefault(gridinfo.division);
        SettingRefs[1].setDefault(gridinfo.mindist);
        SettingRefs[2].setDefault(gridinfo.maxdist),
        // set array
        GridArray.data = Grid.setGrid(gridinfo.array)
        resetGridSize(0);
      
      } else {
        // flatten through data
        onChange(0);
      }
    })
  })
})

</script>
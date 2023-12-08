<template>
<div class="d-flex justify-center align-center"> 
  <!-- slide bar -->
  <div :style="'display:' + Visible + ';'">
    <v-card variant="flat" rounded="lg" :height="props.height"
      class="d-flex justify-center align-center px-1 mr-3"
    >
    <v-slider v-model="RawValue" :min="props.data.min" :max="props.data.max" :step="props.data.step"
      :style="'width:' + props.width + 'px;height:32px;'"
      color="primary" elevation="0" density="comfortable"
      @end="props.data.onEnd(RawValue)"
    >
      <template v-slot:prepend>
        <v-btn size="small" density="comfortable" variant="text" icon="mdi-minus" color="info"
          :disabled="RawValue <= props.data.min"
          @click="changeDivision(false)"
        />
      </template>
      <template v-slot:append>
        <v-btn size="small" density="comfortable" variant="text" icon="mdi-plus" color="info"
          :disabled="RawValue >= props.data.max"
          @click="changeDivision(true)"
        />
        </template>
    </v-slider>
    </v-card>
  </div>
  
  <!-- number -->
  <v-card 
    variant="flat" rounded="lg" :height="props.height" :width="props.height"
    class="d-flex justify-center align-center"
  >
    <p class="text-subtitle-2 font-weight-bold">{{ RawValue.toFixed(Fixed) }}</p>
  </v-card>
</div>
</template>

<script setup>
import { onMounted } from 'vue';
import {ref} from 'vue';

const props = defineProps({
  width: {
    type: Number, default: 250
  },
  height: {
    type: Number, default: 40
  },
  data : {
    type: Object,
    default: {
      min: 16,
      max: 256,
      step: 1,
      default: 64,
      onEnd: function(){}
    }
  }
})

const RawValue = ref(props.data.default);
const Visible = ref('block');
const Fixed = props.data.step < 0.1 ? 2 :
              props.data.step < 1 ? 1 : 0;

function reset() {
  RawValue.value = props.data.default;
  Visible.value = 'block';
}

function changeDivision(positive) {
  if(positive && RawValue.value >= props.data.max)
    return;
  if(!positive && RawValue.value <= props.data.min)
    return;

  RawValue.value += (positive ? props.data.step : -1 * props.data.step);
}

function changeVisible() {
  Visible.value = Visible.value == 'none' ? 'block' : 'none';
}

function setDefault(val) {
  props.data.default = val;
  RawValue.value = val;
}

onMounted(() => {
})

defineExpose({
  reset,
  changeVisible,
  setDefault,
  getVal: () => {return RawValue.value;} 
})

</script>
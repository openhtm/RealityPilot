<template>
<div class="d-flex flex-column mx-6">
  <div class="mt-1"></div>
  
  <p class="text-h6 font-weight-bold ml-2">Ready</p>
  <template v-for="(value, key) in Reviews.ready">
    <DetailCard :value="value" :onRemove="removeData" :onClick="compose" />
  </template>

  <div class="mt-10"></div>

  <p class="text-h6 font-weight-bold ml-2">Raw</p>
  <template v-for="(value, key) in Reviews.raw">
    <DetailCard :value="value" :onRemove="removeData" :onClick="compose" />
  </template>

  <template v-for="(value, key) in Reviews.wait">
    <DetailCard :value="value" :onRemove="removeData" />
  </template>

  <div class="mt-10"></div>

  <p class="text-h6 font-weight-bold ml-2">Damaged</p>
  <template v-for="(value, key) in Reviews.fail">
    <DetailCard :value="value" :onRemove="removeData" />
  </template>

</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DetailCard from '@/layout/DetailCard.vue'
import {queryScenes} from '@/plugins/retrieve'

const Router = useRouter();

const Reviews = reactive({
  ready: {},
  raw: {},
  wait: {},
  fail: {}
});

function compose(uid) {
  Router.push('/compose/' + uid);
}

function removeData(uid) {
  delete Reviews.ready[uid];
  delete Reviews.raw[uid];
  delete Reviews.wait[uid];
  delete Reviews.fail[uid];
}


function queryData() {
  queryScenes().then(data => {
    console.log(data);
    // filter
    for(let id in data) {
      let item = data[id];
      if(item.status >= 4)
        Reviews.ready[id] = item;
      else if(item.status == 3)
        Reviews.raw[id] = item;
      else if(item.status >= 0)
        Reviews.wait[id] = item;
      else
        Reviews.fail[id] = item;
    }

    console.log(Reviews)
  })
}

onMounted(() => {
  queryData();
})

</script>
// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/Index.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/Overview.vue'),
      },
      {
        path: 'start',
        component: () => import('@/views/Start.vue'),
      },
      {
        path: 'about',
        component: () => import('@/views/About.vue')
      },
      
    ],

  },
  {
    path: '/session/:type/:uid',
    component: () => import('@/views/Session.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router

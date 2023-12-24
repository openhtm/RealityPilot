// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Index.vue'),
  },
  {
    path: '/capture',
    component: () => import('@/views/session/Capture.vue')
  },
  {
    path: '/review/:uid',
    component: () => import('@/views/Session.vue')
  },
  {
    path: '/compose/:uid',
    component: () => import('@/views/Compose.vue'),
    children: [
      {
        path: '',
        component: () => import('@/views/compose/Preview.vue')
      },
      {
        path: 'define',
        component: () => import('@/views/compose/Define.vue')
      },
      {
        path: 'gridding',
        component: () => import('@/views/compose/Gridding.vue')
      },
      {
        path: 'navigate',
        component: () => import('@/views/compose/Navigate.vue')
      },
      {
        path: 'edit',
        component: () => import('@/views/compose/Edit.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router

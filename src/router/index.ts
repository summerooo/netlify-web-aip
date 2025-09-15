import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue')
        },
        {
          path: 'organizations',
          name: 'Organizations',
          component: () => import('../views/Organizations.vue')
        },
        {
          path: 'organizations/:id',
          name: 'OrganizationDetail',
          component: () => import('../views/OrganizationDetail.vue')
        },
        {
          path: 'projects',
          name: 'Projects',
          component: () => import('../views/Projects.vue')
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('../views/Tasks.vue')
        },
        {
          path: 'projects/:id',
          name: 'ProjectDetail',
          component: () => import('../views/ProjectDetail.vue')
        },
        {
          path: 'accept-invitation',
          name: 'AcceptInvitation',
          component: () => import('../views/AcceptInvitation.vue')
        },
        {
          path: 'accept-organization-invitation',
          name: 'AcceptOrganizationInvitation',
          component: () => import('../views/AcceptOrganizationInvitation.vue')
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('../views/Profile.vue')
        },
        {
          path: 'knowledge',
          name: 'Knowledge',
          component: () => import('../views/Knowledge.vue')
        },
        
      ]
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 如果还没有初始化用户状态，先初始化
  if (authStore.user === null && to.meta.requiresAuth) {
    await authStore.initializeAuth()
  }
  
  if (to.meta.requiresAuth && !authStore.user) {
    // 带上原始地址，登录后回跳，避免邀请参数丢失
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if ((to.name === 'Login' || to.name === 'Register') && authStore.user) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
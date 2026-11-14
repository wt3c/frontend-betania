import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import { useAuthStore } from './auth'
import LoginView from './views/LoginView.vue'
import OnboardingView from './views/OnboardingView.vue'
import InviteView from './views/InviteView.vue'
import HomeView from './views/HomeView.vue'

export function createAppRouter(history: RouterHistory = createWebHistory('/app/')) {
  const router = createRouter({
    history,
    routes: [
      { path: '/login', component: LoginView },
      { path: '/primeiro-acesso', component: OnboardingView },
      { path: '/clientes/novo', component: InviteView, meta: { admin: true } },
      { path: '/', component: HomeView },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  })
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.restore()
    if (!auth.user) return to.path === '/login' ? true : '/login'
    if (auth.user.must_change_password)
      return to.path === '/primeiro-acesso' ? true : '/primeiro-acesso'
    if (to.path === '/login' || to.path === '/primeiro-acesso') return '/'
    if (to.meta.admin && !auth.user.is_admin) return '/'
    return true
  })
  return router
}

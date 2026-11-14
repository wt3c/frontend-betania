<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './auth'
const auth = useAuthStore(),
  router = useRouter()
const error = ref(''),
  leaving = ref(false)
async function logout() {
  leaving.value = true
  error.value = ''
  try {
    await auth.logout()
    await router.push('/login')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    leaving.value = false
  }
}
</script>
<template>
  <header>
    <a class="brand" href="/">Betânia <span>Terapeuta</span></a>
    <nav v-if="auth.user" aria-label="Navegação principal">
      <RouterLink v-if="!auth.user.must_change_password" to="/">Início</RouterLink>
      <RouterLink v-if="auth.user.is_admin && !auth.user.must_change_password" to="/clientes/novo"
        >Novo cliente</RouterLink
      >
      <button class="text-button" :disabled="leaving" @click="logout">Sair</button>
    </nav>
  </header>
  <main>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <RouterView />
  </main>
  <footer>Betânia Terapeuta · Um espaço para você</footer>
</template>

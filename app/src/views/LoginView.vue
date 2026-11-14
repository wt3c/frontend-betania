<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../auth'
const auth = useAuthStore()
const router = useRouter()
const email = ref(''),
  password = ref(''),
  error = ref(''),
  busy = ref(false)
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    password.value = ''
    await router.push(auth.user?.must_change_password ? '/primeiro-acesso' : '/')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="card">
    <p class="eyebrow">SEU ESPAÇO DE CUIDADO</p>
    <h1>Bem-vinda(o)</h1>
    <p class="intro">Entre para acessar sua conta.</p>
    <form @submit.prevent="submit">
      <label for="email">E-mail</label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="username"
        required
        maxlength="254"
      />
      <label for="password">Senha</label>
      <input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        maxlength="256"
      />
      <p v-if="error || auth.sessionError" role="alert" class="error">
        {{ error || auth.sessionError }}
      </p>
      <button :disabled="busy" type="submit">{{ busy ? 'Entrando…' : 'Entrar' }}</button>
    </form>
    <p class="hint">
      Primeiro acesso? Use a senha temporária recebida por e-mail. Se precisar de ajuda, entre em
      contato com a terapeuta.
    </p>
  </section>
</template>

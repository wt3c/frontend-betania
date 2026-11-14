<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../auth'
const auth = useAuthStore(),
  router = useRouter()
const data = reactive({ full_name: '', phone: '', current_password: '', new_password: '' })
const error = ref(''),
  busy = ref(false)
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await auth.complete(data)
    data.current_password = ''
    data.new_password = ''
    await router.push('/')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="card">
    <p class="eyebrow">PRIMEIRO ACESSO</p>
    <h1>Vamos nos conhecer</h1>
    <p class="intro">Complete seus dados e escolha uma nova senha para continuar.</p>
    <form @submit.prevent="submit">
      <label for="name">Nome completo</label>
      <input
        id="name"
        v-model="data.full_name"
        name="full_name"
        autocomplete="name"
        required
        maxlength="200"
      />
      <label for="phone">Telefone com DDD</label>
      <input
        id="phone"
        v-model="data.phone"
        type="tel"
        autocomplete="tel"
        placeholder="(21) 99999-9999"
        required
        maxlength="30"
      />
      <label for="temporary">Senha temporária</label>
      <input
        id="temporary"
        v-model="data.current_password"
        type="password"
        autocomplete="current-password"
        required
        maxlength="256"
      />
      <label for="new-password">Nova senha</label>
      <input
        id="new-password"
        v-model="data.new_password"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
        maxlength="256"
        aria-describedby="password-help"
      />
      <p id="password-help" class="hint">
        Use pelo menos 8 caracteres. Evite senhas comuns, somente números ou seus dados pessoais.
      </p>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <button :disabled="busy" type="submit">{{ busy ? 'Salvando…' : 'Concluir cadastro' }}</button>
    </form>
  </section>
</template>

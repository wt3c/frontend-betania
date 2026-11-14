<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../auth'
const auth = useAuthStore()
const email = ref(''),
  error = ref(''),
  success = ref(''),
  busy = ref(false)
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await auth.invite(email.value)
    success.value = `Convite enviado para ${email.value}.`
    email.value = ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="card">
    <p class="eyebrow">ADMINISTRAÇÃO</p>
    <h1>Novo cliente</h1>
    <p class="intro">
      Informe o e-mail do cliente. Ele receberá uma senha temporária e as orientações para o
      primeiro acesso.
    </p>
    <form @submit.prevent="submit">
      <label for="client-email">E-mail do cliente</label>
      <input
        id="client-email"
        v-model="email"
        type="email"
        autocomplete="off"
        required
        maxlength="254"
      />
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <p v-if="success" role="status" class="success">{{ success }}</p>
      <button :disabled="busy" type="submit">
        {{ busy ? 'Enviando…' : 'Cadastrar e enviar convite' }}
      </button>
    </form>
  </section>
</template>

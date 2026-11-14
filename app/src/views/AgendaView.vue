<script setup lang="ts">
import { useAuthStore } from '../auth'
import AdminAgendaView from './AdminAgendaView.vue'
import ClientAgendaView from './ClientAgendaView.vue'
const auth = useAuthStore()
</script>
<template>
  <AdminAgendaView v-if="auth.user?.is_admin" />
  <ClientAgendaView v-else />
</template>

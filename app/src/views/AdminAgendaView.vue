<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import BrDateInput from '../components/BrDateInput.vue'
import {
  NEXT_STATUSES,
  STATUS_LABELS,
  addDays,
  formatDateTime,
  localDate,
  useAction,
  useSchedulingApi,
  type Appointment,
  type ClientOption,
  type Status,
} from '../scheduling'
const api = useSchedulingApi()
const { error, success, busy, run } = useAction()
const today = localDate()
// The past week stays visible so attendance can be recorded after the session.
const range = reactive({ start: addDays(today, -7), end: addDays(today, 13) })
const appointments = ref<Appointment[]>([]),
  clients = ref<ClientOption[]>([])
const nextStatus = reactive<Record<number, Status | ''>>({}),
  newStart = reactive<Record<number, string>>({})
const draft = reactive({ client: '', starts_at: '' })
async function loadAppointments() {
  const list = await api.appointments(range.start, range.end)
  for (const item of list) nextStatus[item.id] ??= ''
  appointments.value = list
}
async function act(action: () => Promise<unknown>, message: string) {
  return run(async () => {
    await action()
    await loadAppointments()
  }, message)
}
function changeStatus(item: Appointment) {
  const status = nextStatus[item.id]
  if (!status) return
  return act(async () => {
    await api.changeStatus(item.id, status)
    nextStatus[item.id] = ''
  }, 'Situação atualizada.')
}
function reschedule(item: Appointment) {
  const value = newStart[item.id]
  if (!value) return
  return act(async () => {
    await api.reschedule(item.id, value)
    newStart[item.id] = ''
  }, 'Agendamento remarcado.')
}
async function create() {
  const ok = await act(() => api.book(draft.starts_at, Number(draft.client)), 'Agendamento criado.')
  if (ok) Object.assign(draft, { client: '', starts_at: '' })
}
onMounted(() =>
  run(async () => {
    const [, people] = await Promise.all([loadAppointments(), api.clients()])
    clients.value = people
  }),
)
</script>
<template>
  <section class="card wide">
    <p class="eyebrow">ADMINISTRAÇÃO</p>
    <h1>Agenda</h1>
    <p class="intro">Todos os agendamentos do período, com situação e remarcação.</p>
    <p class="hint" data-timezone>Todos os horários estão no horário de Brasília.</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="success" role="status" class="success">{{ success }}</p>

    <form class="inline" data-range @submit.prevent="run(loadAppointments)">
      <div>
        <label for="range-start">De</label>
        <BrDateInput id="range-start" v-model="range.start" required />
      </div>
      <div>
        <label for="range-end">Até</label>
        <BrDateInput id="range-end" v-model="range.end" required />
      </div>
      <button type="submit" :disabled="busy">Consultar</button>
    </form>

    <ul v-if="appointments.length" class="list">
      <li v-for="item in appointments" :key="item.id" data-appointment class="entry">
        <div>
          <strong>{{ formatDateTime(item.starts_at) }}</strong>
          <span class="badge" :data-status="item.status">{{ STATUS_LABELS[item.status] }}</span>
          <div>{{ item.client?.full_name || item.client?.email }}</div>
        </div>
        <form
          v-if="NEXT_STATUSES[item.status].length"
          class="inline"
          data-status
          @submit.prevent="changeStatus(item)"
        >
          <div>
            <label :for="`status-${item.id}`">Nova situação</label>
            <select :id="`status-${item.id}`" v-model="nextStatus[item.id]" name="status" required>
              <option value="" disabled>Escolha</option>
              <option v-for="status in NEXT_STATUSES[item.status]" :key="status" :value="status">
                {{ STATUS_LABELS[status] }}
              </option>
            </select>
          </div>
          <button type="submit" :disabled="busy">Atualizar</button>
        </form>
        <form
          v-if="item.status === 'scheduled'"
          class="inline"
          data-reschedule
          @submit.prevent="reschedule(item)"
        >
          <div>
            <label :for="`reschedule-${item.id}`">Remarcar para</label>
            <BrDateInput
              :id="`reschedule-${item.id}`"
              v-model="newStart[item.id]"
              name="reschedule"
              with-time
              required
            />
          </div>
          <button type="submit" :disabled="busy">Remarcar</button>
        </form>
      </li>
    </ul>
    <p v-else class="hint">Nenhum agendamento no período.</p>

    <h2>Novo agendamento</h2>
    <p class="hint">
      A administradora pode agendar fora da grade e registrar sessões passadas, sem sobreposição.
    </p>
    <form data-create @submit.prevent="create">
      <label for="new-client">Cliente</label>
      <select id="new-client" v-model="draft.client" name="client" required>
        <option value="" disabled>Escolha o cliente</option>
        <option v-for="person in clients" :key="person.id" :value="String(person.id)">
          {{ person.full_name || person.email
          }}{{ person.pending ? ' (primeiro acesso pendente)' : '' }}
        </option>
      </select>
      <label for="new-starts-at">Início (1 hora de sessão)</label>
      <BrDateInput
        id="new-starts-at"
        v-model="draft.starts_at"
        name="new-starts-at"
        with-time
        required
      />
      <button type="submit" :disabled="busy">Criar agendamento</button>
    </form>
  </section>
</template>

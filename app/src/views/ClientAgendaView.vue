<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  STATUS_LABELS,
  addDays,
  formatDateTime,
  groupByDay,
  localDate,
  useAction,
  useSchedulingApi,
  type Appointment,
  type Slot,
} from '../scheduling'
const SLOT_DAYS = 14
const api = useSchedulingApi()
const { error, success, busy, run } = useAction()
const appointments = ref<Appointment[]>([]),
  slots = ref<Slot[]>([])
const days = computed(() => groupByDay(slots.value))
async function load() {
  const today = localDate()
  const [own, free] = await Promise.all([
    api.appointments(),
    api.slots(today, addDays(today, SLOT_DAYS - 1)),
  ])
  appointments.value = own
  slots.value = free.slots
}
function reserve(slot: Slot) {
  return run(
    async () => {
      try {
        await api.book(slot.starts_at)
      } finally {
        await load() // a conflict also means the free slots changed
      }
    },
    `Sessão reservada para ${formatDateTime(slot.starts_at)}.`,
  )
}
onMounted(() => run(load))
</script>
<template>
  <section class="card wide">
    <p class="eyebrow">AGENDAMENTOS</p>
    <h1>Minha agenda</h1>
    <p class="intro">
      Reserve um horário livre nos próximos {{ SLOT_DAYS }} dias. Para cancelar ou remarcar, fale
      com a administradora.
    </p>
    <p class="hint" data-timezone>Todos os horários estão no horário de Brasília.</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="success" role="status" class="success">{{ success }}</p>
    <h2>Minhas sessões</h2>
    <ul v-if="appointments.length" class="list">
      <li v-for="item in appointments" :key="item.id" data-appointment>
        <span>{{ formatDateTime(item.starts_at) }}</span>
        <span class="badge" :data-status="item.status">{{ STATUS_LABELS[item.status] }}</span>
      </li>
    </ul>
    <p v-else class="hint">Nenhuma sessão agendada.</p>
    <h2>Horários livres</h2>
    <template v-if="days.length">
      <details v-for="(day, index) in days" :key="day.date" class="day" :open="index === 0">
        <summary>{{ day.label }} · {{ day.items.length }} horário(s)</summary>
        <div class="slots">
          <button
            v-for="slot in day.items"
            :key="slot.starts_at"
            type="button"
            data-slot
            :disabled="busy"
            :aria-label="`Reservar ${formatDateTime(slot.starts_at)}`"
            @click="reserve(slot)"
          >
            {{ slot.time }}
          </button>
        </div>
      </details>
    </template>
    <p v-else class="hint">Nenhum horário livre no período.</p>
  </section>
</template>

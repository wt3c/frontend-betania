<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  WEEKDAYS,
  formatDateTime,
  useAction,
  useSchedulingApi,
  type AvailabilityBlock,
  type AvailabilityWindow,
} from '../scheduling'
const api = useSchedulingApi()
const { error, success, busy, run } = useAction()
const windows = ref<AvailabilityWindow[]>([]),
  blocks = ref<AvailabilityBlock[]>([])
const windowDraft = reactive({ weekday: 0, start_time: '', end_time: '' }),
  blockDraft = reactive({ starts_at: '', ends_at: '' })
async function load() {
  const [grid, blocked] = await Promise.all([api.windows(), api.blocks()])
  windows.value = grid
  blocks.value = blocked
}
function act(action: () => Promise<unknown>, message: string) {
  return run(async () => {
    await action()
    await load()
  }, message)
}
const hhmm = (value: string) => value.slice(0, 5)
async function addWindow() {
  if (await act(() => api.createWindow({ ...windowDraft }), 'Janela cadastrada.'))
    Object.assign(windowDraft, { start_time: '', end_time: '' })
}
async function addBlock() {
  if (await act(() => api.createBlock({ ...blockDraft }), 'Bloqueio cadastrado.'))
    Object.assign(blockDraft, { starts_at: '', ends_at: '' })
}
onMounted(() => run(load))
</script>
<template>
  <section class="card wide">
    <p class="eyebrow">ADMINISTRAÇÃO</p>
    <h1>Disponibilidade</h1>
    <p class="intro">
      Janelas semanais geram horários de hora em hora; bloqueios retiram períodos específicos.
      Agendamentos existentes não são alterados.
    </p>
    <p class="hint" data-timezone>Todos os horários estão no horário de Brasília.</p>
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="success" role="status" class="success">{{ success }}</p>

    <h2>Janelas semanais</h2>
    <ul v-if="windows.length" class="list">
      <li v-for="item in windows" :key="item.id">
        <span
          >{{ WEEKDAYS[item.weekday] }} · {{ hhmm(item.start_time) }}–{{
            hhmm(item.end_time)
          }}</span
        >
        <button
          type="button"
          class="text-button"
          data-remove-window
          :disabled="busy"
          :aria-label="`Remover ${WEEKDAYS[item.weekday]} ${hhmm(item.start_time)}`"
          @click="act(() => api.deleteWindow(item.id), 'Janela removida.')"
        >
          Remover
        </button>
      </li>
    </ul>
    <p v-else class="hint">Nenhuma janela cadastrada.</p>
    <form data-window @submit.prevent="addWindow">
      <label for="weekday">Dia da semana</label>
      <select id="weekday" v-model.number="windowDraft.weekday" name="weekday">
        <option v-for="(label, index) in WEEKDAYS" :key="index" :value="index">{{ label }}</option>
      </select>
      <label for="start-time">Início</label>
      <input
        id="start-time"
        v-model="windowDraft.start_time"
        name="start_time"
        type="time"
        required
      />
      <label for="end-time">Fim</label>
      <input id="end-time" v-model="windowDraft.end_time" name="end_time" type="time" required />
      <button type="submit" :disabled="busy">Adicionar janela</button>
    </form>

    <h2>Bloqueios futuros</h2>
    <ul v-if="blocks.length" class="list">
      <li v-for="item in blocks" :key="item.id">
        <span>{{ formatDateTime(item.starts_at) }} até {{ formatDateTime(item.ends_at) }}</span>
        <button
          type="button"
          class="text-button"
          data-remove-block
          :disabled="busy"
          :aria-label="`Remover bloqueio de ${formatDateTime(item.starts_at)}`"
          @click="act(() => api.deleteBlock(item.id), 'Bloqueio removido.')"
        >
          Remover
        </button>
      </li>
    </ul>
    <p v-else class="hint">Nenhum bloqueio futuro.</p>
    <form data-block @submit.prevent="addBlock">
      <label for="block-start">Início do bloqueio</label>
      <input
        id="block-start"
        v-model="blockDraft.starts_at"
        name="block_start"
        type="datetime-local"
        required
      />
      <label for="block-end">Fim do bloqueio</label>
      <input
        id="block-end"
        v-model="blockDraft.ends_at"
        name="block_end"
        type="datetime-local"
        required
      />
      <button type="submit" :disabled="busy">Adicionar bloqueio</button>
    </form>
  </section>
</template>

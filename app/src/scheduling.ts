import { ref } from 'vue'
import { useAuthStore } from './auth'

export const TIME_ZONE = 'America/Sao_Paulo'

export type Status = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export interface ClientSummary {
  id: number
  email: string
  full_name: string
}
export interface Appointment {
  id: number
  starts_at: string
  ends_at: string
  status: Status
  client?: ClientSummary
}
export interface Slot {
  starts_at: string
  ends_at: string
}
export interface AvailabilityWindow {
  id: number
  weekday: number
  start_time: string
  end_time: string
}
export interface AvailabilityBlock {
  id: number
  starts_at: string
  ends_at: string
}
export interface ClientOption extends ClientSummary {
  pending: boolean
}

export const STATUS_LABELS: Record<Status, string> = {
  scheduled: 'Agendado',
  completed: 'Realizado',
  cancelled: 'Cancelado',
  no_show: 'Falta',
}
/** Mirrors the backend transitions; the API remains the authority. */
export const NEXT_STATUSES: Record<Status, Status[]> = {
  scheduled: ['completed', 'no_show', 'cancelled'],
  completed: ['no_show'],
  no_show: ['completed'],
  cancelled: [],
}
/** Index follows Python's weekday(): Monday is 0. */
export const WEEKDAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
]

const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const isoDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value))
}
/** Calendar date (YYYY-MM-DD) of an instant in the clinic's time zone. */
export function localDate(instant: Date = new Date()): string {
  return isoDateFormat.format(instant)
}
const dayFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})
const timeFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})
export interface DayGroup<T> {
  date: string
  label: string
  items: (T & { time: string })[]
}
/** Groups chronologically sorted items by their local calendar day. */
export function groupByDay<T extends { starts_at: string }>(items: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  for (const item of items) {
    const instant = new Date(item.starts_at)
    const date = localDate(instant)
    if (groups.at(-1)?.date !== date)
      groups.push({ date, label: dayFormat.format(instant), items: [] })
    groups.at(-1)!.items.push({ ...item, time: timeFormat.format(instant) })
  }
  return groups
}
export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function useSchedulingApi() {
  const auth = useAuthStore()
  const range = (start: string, end: string) => `start=${start}&end=${end}`
  return {
    slots: (start: string, end: string) =>
      auth.call<{ timezone: string; slots: Slot[] }>(`scheduling/slots/?${range(start, end)}`),
    appointments: (start?: string, end?: string) =>
      auth.call<Appointment[]>(
        `scheduling/appointments/${start && end ? `?${range(start, end)}` : ''}`,
      ),
    book: (starts_at: string, client?: number) =>
      auth.call<Appointment>(
        'scheduling/appointments/',
        'POST',
        client === undefined ? { starts_at } : { client, starts_at },
      ),
    reschedule: (id: number, starts_at: string) =>
      auth.call<Appointment>(`scheduling/appointments/${id}/`, 'PATCH', { starts_at }),
    changeStatus: (id: number, status: Status) =>
      auth.call<Appointment>(`scheduling/appointments/${id}/status/`, 'POST', { status }),
    clients: () => auth.call<ClientOption[]>('accounts/clients/'),
    windows: () => auth.call<AvailabilityWindow[]>('scheduling/availability/'),
    createWindow: (data: Omit<AvailabilityWindow, 'id'>) =>
      auth.call<AvailabilityWindow>('scheduling/availability/', 'POST', data),
    deleteWindow: (id: number) => auth.call<void>(`scheduling/availability/${id}/`, 'DELETE'),
    blocks: () => auth.call<AvailabilityBlock[]>('scheduling/blocks/'),
    createBlock: (data: Omit<AvailabilityBlock, 'id'>) =>
      auth.call<AvailabilityBlock>('scheduling/blocks/', 'POST', data),
    deleteBlock: (id: number) => auth.call<void>(`scheduling/blocks/${id}/`, 'DELETE'),
  }
}

/** Runs one request at a time and exposes its outcome for role=alert/status messages. */
export function useAction() {
  const error = ref(''),
    success = ref(''),
    busy = ref(false)
  async function run(action: () => Promise<unknown>, message = ''): Promise<boolean> {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    success.value = ''
    try {
      await action()
      success.value = message
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    } finally {
      busy.value = false
    }
  }
  return { error, success, busy, run }
}

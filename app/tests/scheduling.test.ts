import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../src/router'
import App from '../src/App.vue'
import { useAuthStore } from '../src/auth'
import { addDays, formatDateTime, groupByDay, localDate } from '../src/scheduling'

const client = {
  email: 'cliente@example.com',
  full_name: 'Cliente Teste',
  phone: '21999991234',
  is_admin: false,
  must_change_password: false,
}
const admin = { ...client, email: 'admin@example.com', is_admin: true }
const appointment = {
  id: 7,
  starts_at: '2030-01-07T08:00:00-03:00',
  ends_at: '2030-01-07T09:00:00-03:00',
  status: 'scheduled',
}
const slot = { starts_at: '2030-01-07T10:00:00-03:00', ends_at: '2030-01-07T11:00:00-03:00' }

function json(data: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
type Handler = (method: string, url: string, body: unknown) => Response | undefined
function serve(handler: Handler) {
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const method = init?.method ?? 'GET'
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    const result = handler(method, String(input), body)
    if (!result) throw new Error(`Rota inesperada: ${method} ${String(input)}`)
    return result
  })
}
function calls(method: string, fragment: string) {
  return vi
    .mocked(fetch)
    .mock.calls.filter(
      ([url, init]) => (init?.method ?? 'GET') === method && String(url).includes(fragment),
    )
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('fetch', vi.fn())
})

async function render(path: string, user = client) {
  const auth = useAuthStore()
  auth.initialized = true
  auth.user = user
  auth.access = 'access-token'
  const router = createAppRouter(createMemoryHistory('/app/'))
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('datas no fuso da clínica', () => {
  it('formata e calcula datas em America/Sao_Paulo', () => {
    expect(formatDateTime('2030-01-07T11:00:00Z')).toBe('seg., 07/01/2030, 08:00')
    expect(localDate(new Date('2030-01-08T02:30:00Z'))).toBe('2030-01-07')
    expect(addDays('2030-01-31', 1)).toBe('2030-02-01')
    const groups = groupByDay([
      { starts_at: '2030-01-07T11:00:00Z', ends_at: '' },
      { starts_at: '2030-01-07T12:00:00Z', ends_at: '' },
      { starts_at: '2030-01-08T02:00:00Z', ends_at: '' },
      { starts_at: '2030-01-08T11:00:00Z', ends_at: '' },
    ])
    expect(groups.map((g) => [g.label, g.items.map((i) => i.time)])).toEqual([
      ['segunda-feira, 07/01', ['08:00', '09:00', '23:00']],
      ['terça-feira, 08/01', ['08:00']],
    ])
  })
})

describe('agenda do cliente', () => {
  it('lista os próprios agendamentos e reserva um horário livre', async () => {
    let booked = false
    serve((method, url, body) => {
      if (url.includes('/api/scheduling/appointments/') && method === 'GET')
        return json(booked ? [appointment, { ...appointment, id: 8, ...slot }] : [appointment])
      if (url.includes('/api/scheduling/slots/'))
        return json({ timezone: 'America/Sao_Paulo', slots: booked ? [] : [slot] })
      if (url.endsWith('/api/scheduling/appointments/') && method === 'POST') {
        expect(body).toEqual({ starts_at: slot.starts_at })
        booked = true
        return json({ id: 8, ...slot, status: 'scheduled' }, 201)
      }
    })
    const { wrapper } = await render('/agenda')
    expect(wrapper.get('h1').text()).toBe('Minha agenda')
    expect(wrapper.get('details[open] summary').text()).toContain('segunda-feira, 07/01')
    expect(wrapper.get('button[data-slot]').text()).toBe('10:00')
    expect(wrapper.text()).toContain('seg., 07/01/2030, 08:00')
    expect(wrapper.text()).toContain('Agendado')
    expect(wrapper.text()).toContain('fale com a administradora')
    expect(wrapper.get('[data-timezone]').text()).toContain('horário de Brasília')
    expect(wrapper.find('select[name=status]').exists()).toBe(false)
    await wrapper.get('button[data-slot]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toContain('Sessão reservada')
    expect(calls('POST', '/appointments/')).toHaveLength(1)
    expect(wrapper.findAll('[data-appointment]')).toHaveLength(2)
    const slotsUrl = String(calls('GET', '/slots/')[0][0])
    expect(slotsUrl).toMatch(/start=\d{4}-\d{2}-\d{2}&end=\d{4}-\d{2}-\d{2}/)
  })

  it('mostra conflito quando o horário acabou de ser ocupado', async () => {
    serve((method, url) => {
      if (url.includes('/appointments/') && method === 'GET') return json([])
      if (url.includes('/slots/')) return json({ timezone: 'America/Sao_Paulo', slots: [slot] })
      if (method === 'POST') return json({ detail: 'Horário ocupado por outro agendamento.' }, 409)
    })
    const { wrapper } = await render('/agenda')
    await wrapper.get('button[data-slot]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Horário ocupado')
  })

  it('não acessa a disponibilidade administrativa', async () => {
    serve(() => json([]))
    const { router } = await render('/disponibilidade')
    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('agenda da administradora', () => {
  const listed = {
    ...appointment,
    client: { id: 3, email: 'c@example.com', full_name: 'Cliente Teste' },
  }
  function adminRoutes(extra?: Handler) {
    serve((method, url, body) => {
      const custom = extra?.(method, url, body)
      if (custom) return custom
      if (url.includes('/api/scheduling/appointments/') && method === 'GET') return json([listed])
      if (url.includes('/api/accounts/clients/'))
        return json([{ id: 3, email: 'c@example.com', full_name: 'Cliente Teste', pending: false }])
    })
  }

  it('lista todos com cliente e altera a situação', async () => {
    adminRoutes((method, url, body) => {
      if (url.endsWith('/appointments/7/status/') && method === 'POST') {
        expect(body).toEqual({ status: 'cancelled' })
        return json({ ...listed, status: 'cancelled' })
      }
    })
    const { wrapper } = await render('/agenda', admin)
    expect(wrapper.get('h1').text()).toBe('Agenda')
    expect(wrapper.get('[data-timezone]').text()).toContain('horário de Brasília')
    expect(wrapper.text()).toContain('Cliente Teste')
    const listUrl = String(calls('GET', '/appointments/')[0][0])
    const today = localDate()
    expect(listUrl).toContain(`start=${addDays(today, -7)}&end=${addDays(today, 13)}`)
    await wrapper.get('select[name=status]').setValue('cancelled')
    await wrapper.get('form[data-status]').trigger('submit')
    await flushPromises()
    expect(calls('POST', '/appointments/7/status/')).toHaveLength(1)
    expect(wrapper.get('[role=status]').text()).toContain('Situação atualizada')
    expect((wrapper.get('select[name=status]').element as HTMLSelectElement).value).toBe('')
  })

  it('remarca com PATCH e cria agendamento para um cliente', async () => {
    adminRoutes((method, url, body) => {
      if (method === 'PATCH') {
        expect(url).toContain('/appointments/7/')
        expect(body).toEqual({ starts_at: '2030-01-08T14:00' })
        return json({ ...listed, starts_at: '2030-01-08T14:00:00-03:00' })
      }
      if (method === 'POST' && url.endsWith('/appointments/')) {
        expect(body).toEqual({ client: 3, starts_at: '2030-01-09T07:30' })
        return json({ ...listed, id: 9 }, 201)
      }
    })
    const { wrapper } = await render('/agenda', admin)
    await wrapper.get('input[name=reschedule]').setValue('2030-01-08T14:00')
    await wrapper.get('form[data-reschedule]').trigger('submit')
    await flushPromises()
    expect(calls('PATCH', '/appointments/7/')).toHaveLength(1)
    expect((wrapper.get('input[name=reschedule]').element as HTMLInputElement).value).toBe('')
    await wrapper.get('select[name=client]').setValue('3')
    await wrapper.get('input[name=new-starts-at]').setValue('2030-01-09T07:30')
    await wrapper.get('form[data-create]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toContain('Agendamento criado')
  })
})

describe('disponibilidade', () => {
  it('cadastra e remove janelas e bloqueios', async () => {
    const windows = [{ id: 1, weekday: 0, start_time: '08:00:00', end_time: '12:00:00' }]
    const blocks = [
      { id: 2, starts_at: '2030-01-07T12:00:00-03:00', ends_at: '2030-01-07T13:00:00-03:00' },
    ]
    serve((method, url, body) => {
      if (url.endsWith('/availability/') && method === 'GET') return json(windows)
      if (url.endsWith('/blocks/') && method === 'GET') return json(blocks)
      if (url.endsWith('/availability/') && method === 'POST') {
        expect(body).toEqual({ weekday: 2, start_time: '14:00', end_time: '18:00' })
        return json({ id: 3, ...(body as object) }, 201)
      }
      if (url.endsWith('/blocks/') && method === 'POST') {
        expect(body).toEqual({ starts_at: '2030-02-01T08:00', ends_at: '2030-02-01T18:00' })
        return json({ id: 4, ...(body as object) }, 201)
      }
      if (method === 'DELETE') return json(null, 204)
    })
    const { wrapper } = await render('/disponibilidade', admin)
    expect(wrapper.text()).toContain('Segunda-feira')
    expect(wrapper.get('[data-timezone]').text()).toContain('horário de Brasília')
    expect(wrapper.text()).toContain('08:00–12:00')
    await wrapper.get('select[name=weekday]').setValue('2')
    await wrapper.get('input[name=start_time]').setValue('14:00')
    await wrapper.get('input[name=end_time]').setValue('18:00')
    await wrapper.get('form[data-window]').trigger('submit')
    await flushPromises()
    await wrapper.get('input[name=block_start]').setValue('2030-02-01T08:00')
    await wrapper.get('input[name=block_end]').setValue('2030-02-01T18:00')
    await wrapper.get('form[data-block]').trigger('submit')
    await flushPromises()
    await wrapper.get('button[data-remove-window]').trigger('click')
    await flushPromises()
    await wrapper.get('button[data-remove-block]').trigger('click')
    await flushPromises()
    expect(calls('DELETE', '/availability/1/')).toHaveLength(1)
    expect(calls('DELETE', '/blocks/2/')).toHaveLength(1)
    expect(calls('POST', '/availability/')).toHaveLength(1)
    expect(calls('POST', '/blocks/')).toHaveLength(1)
  })
})

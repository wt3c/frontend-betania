import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '../src/router'
import App from '../src/App.vue'
import { useAuthStore } from '../src/auth'

const pending = {
  email: 'cliente@example.com',
  full_name: '',
  phone: '',
  is_admin: false,
  must_change_password: true,
}
const admin = { ...pending, is_admin: true, must_change_password: false }
function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.stubGlobal('fetch', vi.fn())
})

async function render(path = '/login') {
  const router = createAppRouter(createMemoryHistory('/app/'))
  useAuthStore().initialized = true
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('acesso à plataforma', () => {
  it('envia credenciais sem persistir o token e abre o primeiro acesso', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ access: 'access-token', user: pending }))
    const { wrapper, router } = await render()
    await wrapper.get('input[type=email]').setValue(pending.email)
    await wrapper.get('input[autocomplete=current-password]').setValue('temporary')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/primeiro-acesso')
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({
      email: pending.email,
      password: 'temporary',
    })
    expect(localStorage.length).toBe(0)
    expect(JSON.stringify(sessionStorage)).not.toContain('access-token')
  })

  it('mostra erro de login sem navegar', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ detail: 'E-mail ou senha inválidos.' }, 401))
    const { wrapper, router } = await render()
    await wrapper.get('input[type=email]').setValue(pending.email)
    await wrapper.get('input[type=password]').setValue('wrong')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('E-mail ou senha inválidos.')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('bloqueia a página administrativa para clientes', async () => {
    useAuthStore().user = { ...pending, must_change_password: false }
    const { router, wrapper } = await render('/clientes/novo')
    expect(router.currentRoute.value.path).toBe('/')
    expect(wrapper.find('input[type=email]').exists()).toBe(false)
  })

  it('obriga o cadastro inicial antes da página inicial', async () => {
    useAuthStore().user = pending
    const { router } = await render('/')
    expect(router.currentRoute.value.path).toBe('/primeiro-acesso')
  })

  it('administradora convida cliente somente com email', async () => {
    useAuthStore().user = admin
    useAuthStore().access = 'access-token'
    vi.mocked(fetch).mockResolvedValue(response({ email: 'novo@example.com' }, 201))
    const { wrapper } = await render('/clientes/novo')
    await wrapper.get('input[type=email]').setValue('novo@example.com')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toContain('Convite enviado')
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)).toEqual({
      email: 'novo@example.com',
    })
  })

  it('completa primeiro acesso e navega para a página inicial', async () => {
    useAuthStore().user = pending
    vi.mocked(fetch).mockResolvedValue(
      response({ access: 'new-token', user: { ...pending, must_change_password: false } }),
    )
    const { wrapper, router } = await render('/primeiro-acesso')
    await wrapper.get('input[name=full_name]').setValue('Cliente Completo')
    await wrapper.get('input[type=tel]').setValue('21999991234')
    await wrapper.get('input[autocomplete=current-password]').setValue('temporary')
    await wrapper.get('input[autocomplete=new-password]').setValue('new-secret-482!')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(useAuthStore().access).toBe('new-token')
  })
})

it('restaura a sessão antes de redirecionar acesso administrativo de um cliente', async () => {
  const auth = useAuthStore()
  vi.mocked(fetch)
    .mockResolvedValueOnce(response({ access: 'restored-token' }))
    .mockResolvedValueOnce(response({ ...pending, must_change_password: false }))
  const router = createAppRouter(createMemoryHistory('/app/'))
  await router.push('/clientes/novo')
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  expect(auth.user?.is_admin).toBe(false)
  expect(router.currentRoute.value.path).toBe('/')
  expect(wrapper.get('h1').text()).toBe('Página inicial')
})

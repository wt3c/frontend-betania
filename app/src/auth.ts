import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Profile {
  email: string
  full_name: string
  phone: string
  is_admin: boolean
  must_change_password: boolean
}
interface Session {
  access: string
  user: Profile
}
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
function describeError(data: unknown): string {
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.map(describeError).join(' ')
  if (data && typeof data === 'object') return Object.values(data).map(describeError).join(' ')
  return 'Não foi possível concluir a solicitação.'
}
async function request<T>(path: string, body?: unknown, access?: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/accounts/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.')
  }
  if (response.status === 204) return undefined as T
  const data: unknown = await response
    .json()
    .catch(() => ({ detail: 'Resposta inválida do servidor.' }))
  if (!response.ok) throw new ApiError(response.status, describeError(data))
  return data as T
}
export const useAuthStore = defineStore('auth', () => {
  const access = ref('')
  const user = ref<Profile | null>(null)
  const initialized = ref(false)
  const sessionError = ref('')
  let refreshing: Promise<void> | null = null
  function clear() {
    access.value = ''
    user.value = null
  }
  function apply(session: Session) {
    access.value = session.access
    user.value = session.user
    initialized.value = true
  }
  async function refresh() {
    if (!refreshing)
      refreshing = request<{ access: string }>('token/refresh/', {})
        .then((data) => {
          access.value = data.access
        })
        .finally(() => {
          refreshing = null
        })
    await refreshing
  }
  async function restore() {
    if (initialized.value) return
    try {
      await refresh()
      user.value = await request<Profile>('me/', undefined, access.value)
    } catch (error) {
      clear()
      if (!(error instanceof ApiError && error.status === 401))
        sessionError.value = (error as Error).message
    } finally {
      initialized.value = true
    }
  }
  async function authenticated<T>(path: string, body?: unknown): Promise<T> {
    try {
      return await request<T>(path, body, access.value)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) throw error
      try {
        await refresh()
      } catch (refreshError) {
        clear()
        throw refreshError
      }
      return request<T>(path, body, access.value)
    }
  }
  async function login(email: string, password: string) {
    apply(await request<Session>('login/', { email, password }))
    sessionError.value = ''
  }
  async function invite(email: string) {
    await authenticated('clients/', { email })
  }
  async function complete(data: {
    full_name: string
    phone: string
    current_password: string
    new_password: string
  }) {
    apply(await authenticated<Session>('onboarding/', data))
  }
  async function logout() {
    await request('logout/', {})
    clear()
  }
  return { access, user, initialized, sessionError, restore, login, invite, complete, logout }
})

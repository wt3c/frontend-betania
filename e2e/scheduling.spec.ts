import { expect, test, type Page } from '@playwright/test'

const localDate = (offsetDays: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  )

async function login(page: Page, email: string, password: string) {
  await page.goto('/app/login')
  await page.getByLabel('E-mail', { exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Página inicial' })).toBeVisible()
}
const overflows = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth)

test('cliente reserva no celular e administradora gerencia a agenda na API real', async ({
  page,
  browser,
}) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD
  const clientEmail = process.env.E2E_AGENDA_EMAIL
  const clientPassword = process.env.E2E_AGENDA_PASSWORD
  if (!adminEmail || !adminPassword || !clientEmail || !clientPassword)
    throw new Error('Execute pelo teste integrado isolado do backend.')
  const errors: string[] = []

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobile = await context.newPage()
  mobile.on('pageerror', (error) => errors.push(error.message))
  await login(mobile, clientEmail, clientPassword)
  await mobile.getByRole('link', { name: 'Agenda' }).click()
  await expect(mobile.getByRole('heading', { name: 'Minha agenda' })).toBeVisible()
  await expect(mobile.getByText('Nenhuma sessão agendada.')).toBeVisible()
  await expect(mobile.getByText('horário de Brasília')).toBeVisible()
  await expect(mobile.getByRole('link', { name: 'Disponibilidade' })).toHaveCount(0)
  await mobile
    .getByRole('button', { name: /^Reservar / })
    .first()
    .click()
  await expect(mobile.getByRole('status')).toContainText('Sessão reservada')
  await expect(mobile.locator('[data-appointment]')).toHaveCount(1)
  await expect(mobile.locator('[data-appointment]')).toContainText('Agendado')
  expect(await overflows(mobile)).toBe(false)
  await mobile.screenshot({ path: '/tmp/betania-agenda-cliente.png', fullPage: true })
  await mobile.goto('/app/disponibilidade')
  await expect(mobile.getByRole('heading', { name: 'Página inicial' })).toBeVisible()
  await context.close()

  page.on('pageerror', (error) => errors.push(error.message))
  await login(page, adminEmail, adminPassword)
  await page.getByRole('link', { name: 'Disponibilidade' }).click()
  await expect(page.getByRole('heading', { name: 'Disponibilidade' })).toBeVisible()
  await page.getByLabel('Dia da semana').selectOption({ label: 'Domingo' })
  await page.getByLabel('Início', { exact: true }).fill('06:00')
  await page.getByLabel('Fim', { exact: true }).fill('07:00')
  await page.getByRole('button', { name: 'Adicionar janela' }).click()
  await expect(page.getByRole('status')).toContainText('Janela cadastrada')
  await expect(page.getByText('Domingo · 06:00–07:00')).toBeVisible()
  await page.getByLabel('Início do bloqueio').fill(`${localDate(20)}T08:00`)
  await page.getByLabel('Fim do bloqueio').fill(`${localDate(20)}T12:00`)
  await page.getByRole('button', { name: 'Adicionar bloqueio' }).click()
  await expect(page.getByRole('status')).toContainText('Bloqueio cadastrado')
  await page.getByRole('button', { name: /^Remover bloqueio/ }).click()
  await expect(page.getByRole('status')).toContainText('Bloqueio removido')
  await expect(page.getByText('Nenhum bloqueio futuro.')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await overflows(page)).toBe(false)
  await page.setViewportSize({ width: 1280, height: 800 })

  await page.getByRole('link', { name: 'Agenda' }).click()
  await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible()
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente Agenda' })
  await page.getByLabel('Início (1 hora de sessão)').fill(`${localDate(3)}T06:30`)
  await page.getByRole('button', { name: 'Criar agendamento' }).click()
  await expect(page.getByRole('status')).toContainText('Agendamento criado')
  const outside = page.locator('[data-appointment]').filter({ hasText: '06:30' })
  await outside.getByLabel('Remarcar para').fill(`${localDate(4)}T06:30`)
  await outside.getByRole('button', { name: 'Remarcar' }).click()
  await expect(page.getByRole('status')).toContainText('Agendamento remarcado')
  // Real 409 from the API: 07:00 overlaps the session rescheduled to 06:30.
  await page.getByLabel('Cliente', { exact: true }).selectOption({ label: 'Cliente Agenda' })
  await page.getByLabel('Início (1 hora de sessão)').fill(`${localDate(4)}T07:00`)
  await page.getByRole('button', { name: 'Criar agendamento' }).click()
  await expect(page.getByRole('alert')).toContainText('Horário ocupado por outro agendamento')
  const booked = page.locator('[data-appointment]').filter({ hasNotText: '06:30' })
  await expect(booked).toContainText('Cliente Agenda')
  await booked.getByLabel('Nova situação').selectOption({ label: 'Cancelado' })
  await booked.getByRole('button', { name: 'Atualizar' }).click()
  await expect(page.getByRole('status')).toContainText('Situação atualizada')
  await expect(booked).toContainText('Cancelado')
  await page.screenshot({ path: '/tmp/betania-agenda-admin.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await overflows(page)).toBe(false)
  expect(errors).toEqual([])
})

import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import AnamnesePage from '../AnamnesePage.vue'
import { STORAGE_KEY } from '../anamneseLogic'
import originalNames from './fixtures/anamnese-names.json'

let page: VueWrapper | undefined
const scrollIntoView = vi.fn()

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 16, 10, 30))
  localStorage.clear()
  Element.prototype.scrollIntoView = scrollIntoView
})

afterEach(() => {
  page?.unmount()
  page = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function render() {
  page = mount(AnamnesePage, { attachTo: document.body })
  return page
}

const fields = (view: VueWrapper) =>
  Array.from((view.element as HTMLElement).querySelectorAll('.wrap [name]')) as HTMLInputElement[]
const buttons = (view: VueWrapper, kind: string) => view.findAll(`.js-${kind}-btn`)

describe('anamnese TRG', () => {
  it('preserva exatamente os campos do formulário original', () => {
    const names = [...new Set(fields(render()).map((field) => field.name))]
    expect(names).toEqual(originalNames)
  })

  it('popula dia e ano antes de restaurar o rascunho e calcula a idade', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nascimento_dia: '17', nascimento_mes: '11', nascimento_ano: '1990' }),
    )
    const view = render()
    const day = view.get<HTMLSelectElement>('#nascimentoDia').element
    const year = view.get<HTMLSelectElement>('#nascimentoAno').element
    expect(day.options).toHaveLength(32)
    expect(year.options).toHaveLength(102)
    expect(year.options[1].value).toBe('2026')
    expect(day.value).toBe('17')
    expect(year.value).toBe('1990')
    expect(view.get<HTMLInputElement>('#idade').element.value).toBe('35')
  })

  it('preenche a data do consentimento com hoje sem sobrescrever o rascunho', () => {
    const consent = render().get<HTMLInputElement>('#data_consent').element
    expect(consent.type).toBe('text')
    expect(consent.value).toBe('16/11/2026')
    page?.unmount()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data_consent: '01/10/2026' }))
    expect(render().get<HTMLInputElement>('#data_consent').element.value).toBe('01/10/2026')
  })

  it('converte para dd/mm/aaaa a data de rascunhos antigos em ISO', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data_consent: '2026-10-01' }))
    expect(render().get<HTMLInputElement>('#data_consent').element.value).toBe('01/10/2026')
  })

  it('aplica a máscara na data do consentimento e salva o valor formatado', async () => {
    const consent = render().get<HTMLInputElement>('#data_consent')
    await consent.setValue('02102026')
    expect(consent.element.value).toBe('02/10/2026')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').data_consent).toBe('02/10/2026')
  })

  it('salva o rascunho a cada alteração e mantém ações bloqueadas abaixo de 90 %', async () => {
    const view = render()
    const name = view.get('.wrap input[type="text"][name]')
    await name.setValue('Paciente Sintético')
    const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(draft[name.attributes('name') as string]).toBe('Paciente Sintético')
    expect(view.get('#saveStatus').text()).toBe('Rascunho salvo às 10:30.')
    for (const button of [...buttons(view, 'print'), ...buttons(view, 'send')]) {
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.attributes('title')).toMatch(/^Disponível a partir de 90% .*% concluído\)$/)
    }
  })

  it('libera imprimir e enviar com 90 % respondido', async () => {
    const view = render()
    for (const field of fields(view)) {
      if (field.type === 'checkbox' || field.type === 'radio') field.checked = true
      else if (field instanceof HTMLSelectElement) field.selectedIndex = field.options.length - 1
      else field.value = 'x'
    }
    fields(view)[0].dispatchEvent(new Event('change', { bubbles: true }))
    await view.vm.$nextTick()
    for (const button of [...buttons(view, 'print'), ...buttons(view, 'send')]) {
      expect(button.attributes('disabled')).toBeUndefined()
      expect(button.attributes('title')).toBe('')
    }
  })

  it('imprime, abre o WhatsApp e volta ao topo', async () => {
    const print = vi.fn()
    const open = vi.fn()
    const scrollTo = vi.fn()
    vi.stubGlobal('print', print)
    vi.stubGlobal('open', open)
    vi.stubGlobal('scrollTo', scrollTo)
    const view = render()
    for (const button of [buttons(view, 'print')[0], buttons(view, 'send')[0]]) {
      button.element.removeAttribute('disabled')
    }
    await buttons(view, 'print')[0].trigger('click')
    await buttons(view, 'send')[0].trigger('click')
    await buttons(view, 'top')[0].trigger('click')
    expect(print).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/wa\.me\/5521988070905\?text=/),
      '_blank',
    )
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('alterna o modo paciente nos dois botões e limpa o body ao sair', async () => {
    const view = render()
    await buttons(view, 'mode')[0].trigger('click')
    expect(document.body.classList).toContain('patient-mode')
    expect(buttons(view, 'mode').map((button) => button.text())).toEqual([
      'Modo terapeuta (mostrar anexo)',
      'Modo terapeuta (mostrar anexo)',
    ])
    await buttons(view, 'mode')[1].trigger('click')
    expect(document.body.classList).not.toContain('patient-mode')
    await buttons(view, 'mode')[1].trigger('click')
    view.unmount()
    page = undefined
    expect(document.body.classList).not.toContain('patient-mode')
  })

  it('destaca a nota de apoio quando há pensamentos de risco', async () => {
    const view = render()
    await view.get('input[name="alerta_ideacao"][value="nao"]').setValue(true)
    expect(scrollIntoView).not.toHaveBeenCalled()
    await view.get('input[name="alerta_ideacao"][value="recente"]').setValue(true)
    const note = view.get('#riskNote').element as HTMLElement
    expect(note.style.borderStyle).toBe('solid')
    expect(note.style.background).not.toBe('')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('mantém o head estático e monta o componente Vue', () => {
    const html = readFileSync('anamnese-trg.html', 'utf8')
    expect(html).toContain('<title>Anamnese Terapêutica — Método TRG · Maria Betânia</title>')
    expect(html).toContain('<script type="module" src="/site/anamnese.ts"></script>')
    expect(html).not.toContain('class="wrap"')
  })
})

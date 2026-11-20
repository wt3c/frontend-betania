import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import LandingPage from '../LandingPage.vue'

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void
let observed: Element[]
let notify: ObserverCallback
let page: VueWrapper | undefined

beforeEach(() => {
  observed = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        notify = callback
      }
      observe(element: Element) {
        observed.push(element)
      }
      unobserve(element: Element) {
        observed = observed.filter((item) => item !== element)
      }
      disconnect() {
        observed = []
      }
    },
  )
})

afterEach(() => {
  page?.unmount()
  page = undefined
  vi.unstubAllGlobals()
})

function render() {
  page = mount(LandingPage, { attachTo: document.body })
  return page
}

describe('landing page', () => {
  it('renderiza as seções na ordem original e os contatos', () => {
    const view = render()
    expect(view.get('h1').text()).toBe('Recupere sua paz emocional e resgate a sua identidade.')
    expect(view.findAll('section[id]').map((section) => section.attributes('id'))).toEqual([
      'home',
      'para-quem',
      'sobre',
      'formacao',
      'como-funciona',
      'faq',
    ])
    const hrefs = view.findAll('a').map((link) => link.attributes('href') ?? '')
    expect(hrefs.filter((href) => href.startsWith('https://wa.me/5521988070905'))).toHaveLength(5)
    expect(hrefs.filter((href) => href === 'politica-de-privacidade.html')).toHaveLength(2)
    expect(hrefs).toContain('mailto:mariabetania4020@gmail.com')
    expect(view.findAll('details')).toHaveLength(6)
  })

  it('abre e fecha o menu móvel com estado acessível', async () => {
    const view = render()
    const toggle = view.get('.nav__toggle')
    const list = view.get('.nav__list')
    await toggle.trigger('click')
    expect(list.classes()).toContain('active')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Fechar menu')
    await view.get('.nav__link').trigger('click')
    expect(list.classes()).not.toContain('active')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Abrir menu')

    await toggle.trigger('click')
    document.body.click()
    await view.vm.$nextTick()
    expect(list.classes()).not.toContain('active')
  })

  it('marca o cabeçalho após rolar mais de 50 px', async () => {
    const view = render()
    vi.stubGlobal('scrollY', 51)
    window.dispatchEvent(new Event('scroll'))
    await view.vm.$nextTick()
    expect(view.get('.header').classes()).toContain('header--scrolled')
    vi.stubGlobal('scrollY', 10)
    window.dispatchEvent(new Event('scroll'))
    await view.vm.$nextTick()
    expect(view.get('.header').classes()).not.toContain('header--scrolled')
  })

  it('revela cada bloco uma única vez ao entrar na tela', () => {
    const view = render()
    const blocks = view.findAll('.reveal').map((block) => block.element)
    expect(blocks.length).toBeGreaterThan(0)
    expect(observed).toEqual(blocks)
    notify([{ target: blocks[0], isIntersecting: true }])
    expect(blocks[0].classList).toContain('visible')
    expect(observed).not.toContain(blocks[0])
  })

  it('remove os listeners globais ao desmontar', async () => {
    const view = render()
    view.unmount()
    page = undefined
    vi.stubGlobal('scrollY', 80)
    expect(() => window.dispatchEvent(new Event('scroll'))).not.toThrow()
    expect(observed).toEqual([])
  })

  it('mostra o texto alternativo quando o retrato não carrega', async () => {
    const view = render()
    const portrait = view.get('.portal__frame img')
    expect(portrait.attributes('src')).not.toBe('IMG-20250110-WA0171.jpg')
    await portrait.trigger('error')
    expect((portrait.element as HTMLElement).style.display).toBe('none')
    expect((view.get('.portal__placeholder').element as HTMLElement).style.display).toBe('flex')
  })

  it('mantém SEO e dados estruturados no head estático', () => {
    const html = readFileSync('index.html', 'utf8')
    expect(html).toContain('<link rel="canonical" href="https://wt3c.github.io/landpage-betania/">')
    expect(html).toContain('"@type": "FAQPage"')
    expect(html).toContain('<meta name="robots" content="index, follow">')
    expect(html).toContain('<script type="module" src="/site/landing.ts"></script>')
    expect(html).not.toContain('<h1')
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PrivacyPage from '../PrivacyPage.vue'

describe('política de privacidade', () => {
  it('renderiza as onze seções e os contatos da responsável', () => {
    const page = mount(PrivacyPage)
    expect(page.get('h1').text()).toBe('Política de Privacidade e Proteção de Dados')
    expect(page.findAll('h2')).toHaveLength(11)
    const hrefs = page.findAll('a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('mailto:mariabetania4020@gmail.com')
    expect(hrefs).toContain('https://www.gov.br/anpd')
    expect(hrefs.filter((href) => href === 'index.html')).toHaveLength(3)
  })

  it('mantém o head estático da página e monta o componente Vue', () => {
    const html = readFileSync('politica-de-privacidade.html', 'utf8')
    expect(html).toContain('<meta name="robots" content="noindex, follow">')
    expect(html).toContain(
      '<link rel="canonical" href="https://wt3c.github.io/landpage-betania/politica-de-privacidade.html">',
    )
    expect(html).toContain('<script type="module" src="/site/privacy.ts"></script>')
    expect(html).not.toContain('<h1')
  })
})

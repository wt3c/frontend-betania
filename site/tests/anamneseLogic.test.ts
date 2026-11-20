import { describe, expect, it } from 'vitest'
import {
  COMPLETION_THRESHOLD,
  applyDraft,
  calculateAge,
  completionRatio,
  completionTitle,
  isoDate,
  serializeDraft,
  whatsappUrl,
  type FieldLike,
} from '../anamneseLogic'

const field = (name: string, type: string, value = '', checked = false): FieldLike => ({
  name,
  type,
  value,
  checked,
})

describe('rascunho da anamnese', () => {
  it('serializa texto, checkbox e somente o rádio marcado', () => {
    const fields = [
      field('nome', 'text', 'Ana'),
      field('aceite', 'checkbox', 'on', true),
      field('humor', 'radio', 'bom'),
      field('humor', 'radio', 'ruim', true),
      field('sono', 'radio', 'ok'),
    ]
    expect(serializeDraft(fields)).toEqual({ nome: 'Ana', aceite: true, humor: 'ruim' })
  })

  it('restaura apenas os campos presentes no rascunho', () => {
    const fields = [
      field('nome', 'text', 'atual'),
      field('obs', 'textarea', 'mantido'),
      field('aceite', 'checkbox'),
      field('humor', 'radio', 'bom', true),
      field('humor', 'radio', 'ruim'),
    ]
    applyDraft(fields, { nome: 'Ana', aceite: true, humor: 'ruim' })
    expect(fields.map((item) => [item.value, item.checked])).toEqual([
      ['Ana', false],
      ['mantido', false],
      ['', true],
      ['bom', false],
      ['ruim', true],
    ])
  })
})

describe('conclusão do formulário', () => {
  it('conta grupos respondidos, ignorando texto em branco', () => {
    const fields = [
      field('nome', 'text', '  '),
      field('obs', 'textarea', 'algo'),
      field('humor', 'radio', 'bom'),
      field('humor', 'radio', 'ruim', true),
      field('aceite', 'checkbox'),
    ]
    expect(completionRatio(fields)).toBe(0.5)
  })

  it('libera a partir de 90 % e explica o bloqueio antes disso', () => {
    expect(COMPLETION_THRESHOLD).toBe(0.9)
    expect(completionTitle(0.9)).toBe('')
    expect(completionTitle(0.456)).toBe(
      'Disponível a partir de 90% do formulário preenchido (46% concluído)',
    )
  })
})

describe('datas e contato', () => {
  const today = new Date(2026, 10, 16)

  it('calcula a idade considerando o aniversário do ano', () => {
    expect(calculateAge('1990-11-16', today)).toBe('36')
    expect(calculateAge('1990-11-17', today)).toBe('35')
    expect(calculateAge('', today)).toBe('')
    expect(calculateAge('1990-xx-01', today)).toBe('')
    expect(calculateAge('2027-01-01', today)).toBe('')
  })

  it('formata a data local em ISO', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('monta a mensagem do WhatsApp da anamnese', () => {
    expect(whatsappUrl()).toBe(
      'https://wa.me/5521988070905?text=' +
        encodeURIComponent(
          'Olá, Maria Betânia. Preenchi minha anamnese terapêutica e vou anexar o PDF nesta conversa.',
        ),
    )
  })
})

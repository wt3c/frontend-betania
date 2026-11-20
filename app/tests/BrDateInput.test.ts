import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BrDateInput from '../src/components/BrDateInput.vue'

function render(modelValue: string, withTime = false) {
  const wrapper = mount(BrDateInput, {
    attachTo: document.body,
    props: {
      modelValue,
      withTime,
      required: true,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    } as Record<string, unknown>,
  })
  const input = wrapper.get('input')
  return { wrapper, input, element: input.element as HTMLInputElement }
}

describe('BrDateInput', () => {
  it('mostra o valor ISO no formato brasileiro em campo de texto', () => {
    const { element } = render('2030-01-08')
    expect(element.type).toBe('text')
    expect(element.value).toBe('08/01/2030')
    expect(element.placeholder).toBe('dd/mm/aaaa')
    expect(element.required).toBe(true)
  })

  it('aplica a máscara e publica ISO quando a data fica completa', async () => {
    const { wrapper, input, element } = render('')
    await input.setValue('0801')
    expect(element.value).toBe('08/01')
    expect(wrapper.props('modelValue')).toBe('')
    await input.setValue('08012030')
    expect(element.value).toBe('08/01/2030')
    expect(wrapper.props('modelValue')).toBe('2030-01-08')
    expect(element.validity.valid).toBe(true)
  })

  it('publica data e hora locais sem alterar o contrato da API', async () => {
    const { wrapper, input, element } = render('', true)
    expect(element.placeholder).toBe('dd/mm/aaaa hh:mm')
    await input.setValue('080120301430')
    expect(element.value).toBe('08/01/2030 14:30')
    expect(wrapper.props('modelValue')).toBe('2030-01-08T14:30')
  })

  it('marca data inexistente como inválida e não publica valor', async () => {
    const { wrapper, input, element } = render('')
    await input.setValue('31/02/2030')
    expect(wrapper.props('modelValue')).toBe('')
    expect(element.validity.valid).toBe(false)
    expect(element.validationMessage).toContain('dd/mm/aaaa')
  })

  it('mantém o texto em edição quando a data deixa de estar completa', async () => {
    const { wrapper, input, element } = render('2030-01-08')
    await input.setValue('08/01/203')
    expect(wrapper.props('modelValue')).toBe('')
    await wrapper.vm.$nextTick()
    expect(element.value).toBe('08/01/203')
  })

  it('limpa o campo quando o formulário é reiniciado', async () => {
    const { wrapper, input, element } = render('')
    await input.setValue('08/01/2030')
    await wrapper.setProps({ modelValue: '' })
    expect(element.value).toBe('')
    expect(element.validity.valid).toBe(false) // required, ainda sem valor
    expect(element.validationMessage).not.toContain('dd/mm/aaaa')
  })

  it('preserva a posição do cursor ao editar no meio da data', async () => {
    const { input, element } = render('2030-01-08')
    element.value = '081/01/2030'
    element.setSelectionRange(3, 3)
    await input.trigger('input')
    expect(element.value).toBe('08/10/1203')
    expect(element.selectionStart).toBe(4)
  })
})

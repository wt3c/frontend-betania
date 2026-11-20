import { describe, expect, it } from 'vitest'
import { formatBrDate, maskBrDate, parseBrDate } from '../src/brDate'

describe('maskBrDate', () => {
  it.each([
    ['', ''],
    ['0', '0'],
    ['07', '07'],
    ['070', '07/0'],
    ['07012030', '07/01/2030'],
    ['07/01/2030', '07/01/2030'],
    ['ab07-01x2030', '07/01/2030'],
    ['070120301400', '07/01/2030'],
  ])('formata só a data: %s', (raw, expected) => {
    expect(maskBrDate(raw)).toBe(expected)
  })

  it.each([
    ['07012030', '07/01/2030'],
    ['070120301', '07/01/2030 1'],
    ['0701203014', '07/01/2030 14'],
    ['070120301430', '07/01/2030 14:30'],
    ['0701203014309', '07/01/2030 14:30'],
  ])('formata data e hora: %s', (raw, expected) => {
    expect(maskBrDate(raw, true)).toBe(expected)
  })
})

describe('parseBrDate', () => {
  it.each([
    ['07/01/2030', '2030-01-07'],
    ['29/02/2028', '2028-02-29'],
    ['29/02/2000', '2000-02-29'],
    ['31/12/2030', '2030-12-31'],
  ])('converte data válida: %s', (text, expected) => {
    expect(parseBrDate(text)).toBe(expected)
  })

  it.each([
    '',
    '07/01',
    '07/01/203',
    '31/02/2030',
    '29/02/2030',
    '29/02/2100',
    '00/01/2030',
    '01/13/2030',
    '01/00/2030',
    '01/01/0000',
  ])('rejeita data incompleta ou inexistente: "%s"', (text) => {
    expect(parseBrDate(text)).toBe('')
  })

  it.each([
    ['08/01/2030 14:00', '2030-01-08T14:00'],
    ['08/01/2030 00:00', '2030-01-08T00:00'],
    ['08/01/2030 23:59', '2030-01-08T23:59'],
  ])('converte data e hora válidas: %s', (text, expected) => {
    expect(parseBrDate(text, true)).toBe(expected)
  })

  it.each([
    '08/01/2030',
    '08/01/2030 14',
    '08/01/2030 24:00',
    '08/01/2030 14:60',
    '31/02/2030 14:00',
  ])('rejeita data e hora inválidas: "%s"', (text) => {
    expect(parseBrDate(text, true)).toBe('')
  })
})

describe('formatBrDate', () => {
  it.each([
    ['2030-01-08', '08/01/2030'],
    ['2030-01-08T14:00', '08/01/2030 14:00'],
    ['', ''],
    ['08/01/2030', ''],
  ])('apresenta %s', (iso, expected) => {
    expect(formatBrDate(iso)).toBe(expected)
  })
})

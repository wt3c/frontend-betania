/** Brazilian date text for people; ISO strings remain the contract with the API. */

const DATE_DIGITS = 8
const DATE_TIME_DIGITS = 12

function isValidDay(day: number, month: number, year: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= days[month - 1]
}

export function maskBrDate(raw: string, withTime = false): string {
  const digits = raw.replace(/\D/g, '').slice(0, withTime ? DATE_TIME_DIGITS : DATE_DIGITS)
  const date = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join('/')
  const time = [digits.slice(8, 10), digits.slice(10, 12)].filter(Boolean).join(':')
  return time ? `${date} ${time}` : date
}

/** Returns `YYYY-MM-DD` (or `YYYY-MM-DDTHH:mm`), or '' when the text is not a real date. */
export function parseBrDate(text: string, withTime = false): string {
  const pattern = withTime
    ? /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/
    : /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = pattern.exec(text)
  if (!match) return ''
  const [, day, month, year, hour, minute] = match
  if (!isValidDay(Number(day), Number(month), Number(year))) return ''
  const date = `${year}-${month}-${day}`
  if (!withTime) return date
  if (Number(hour) > 23 || Number(minute) > 59) return ''
  return `${date}T${hour}:${minute}`
}

export function formatBrDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?$/.exec(iso)
  if (!match) return ''
  const [, year, month, day, time] = match
  const date = `${day}/${month}/${year}`
  return time ? `${date} ${time}` : date
}

/** Masks the field in place, keeping the caret after the same digit. */
export function applyBrDateMask(input: HTMLInputElement, withTime = false): string {
  const typed = input.value.slice(0, input.selectionStart ?? input.value.length)
  const digitsBeforeCaret = typed.replace(/\D/g, '').length
  const masked = maskBrDate(input.value, withTime)
  let caret = 0
  for (let seen = 0; caret < masked.length && seen < digitsBeforeCaret; caret++) {
    if (/\d/.test(masked[caret])) seen++
  }
  input.value = masked
  input.setSelectionRange(caret, caret)
  return masked
}

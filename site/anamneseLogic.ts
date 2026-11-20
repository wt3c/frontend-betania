/** Regras puras da anamnese TRG, portadas do script inline original. */

/** Forma mínima de um campo de formulário; elementos `input`, `select` e `textarea` a satisfazem. */
export interface FieldLike {
  name: string
  type: string
  value: string
  checked?: boolean
}

export type Draft = Record<string, string | boolean>

export const STORAGE_KEY = 'anamnese-trg-autosave'
export const COMPLETION_THRESHOLD = 0.9
const WHATSAPP_MESSAGE =
  'Olá, Maria Betânia. Preenchi minha anamnese terapêutica e vou anexar o PDF nesta conversa.'

export function serializeDraft(fields: FieldLike[]): Draft {
  const draft: Draft = {}
  for (const field of fields) {
    if (field.type === 'checkbox') draft[field.name] = Boolean(field.checked)
    else if (field.type === 'radio') {
      if (field.checked) draft[field.name] = field.value
    } else draft[field.name] = field.value
  }
  return draft
}

export function applyDraft(fields: FieldLike[], draft: Draft): void {
  for (const field of fields) {
    if (!(field.name in draft)) continue
    const saved = draft[field.name]
    if (field.type === 'checkbox') field.checked = Boolean(saved)
    else if (field.type === 'radio') field.checked = field.value === saved
    else field.value = String(saved)
  }
}

export function completionRatio(fields: FieldLike[]): number {
  const groups = new Map<string, FieldLike[]>()
  for (const field of fields) groups.set(field.name, [...(groups.get(field.name) ?? []), field])
  const answered = [...groups.values()].filter((group) =>
    group[0].type === 'checkbox' || group[0].type === 'radio'
      ? group.some((field) => field.checked)
      : group.some((field) => field.value.trim().length > 0),
  ).length
  return answered / groups.size
}

export function completionTitle(ratio: number): string {
  return ratio >= COMPLETION_THRESHOLD
    ? ''
    : `Disponível a partir de 90% do formulário preenchido (${Math.round(ratio * 100)}% concluído)`
}

export function calculateAge(birthDate: string, today: Date): string {
  if (!birthDate) return ''
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return ''
  let age = today.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  if (beforeBirthday) age--
  return age >= 0 ? String(age) : ''
}

export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function whatsappUrl(): string {
  return `https://wa.me/5521988070905?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
}

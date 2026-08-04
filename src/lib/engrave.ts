const DEATH_WORDING: Record<string, string> = {
  기독교: '召天',
  천주교: '善終',
  불교: '入寂',
  원불교: '涅槃',
}
const DEFAULT_DEATH_WORDING = '卒'

const RELIGION_SYMBOL: Record<string, string> = {
  기독교: '✝',
  천주교: '✝',
  불교: '卍',
  원불교: '○',
}

export function religionSymbol(religion: string | null | undefined): string {
  if (!religion) return ''
  return RELIGION_SYMBOL[religion] ?? ''
}

function deathWording(religion: string | null | undefined): string {
  if (!religion) return DEFAULT_DEATH_WORDING
  return DEATH_WORDING[religion] ?? DEFAULT_DEATH_WORDING
}

function formatDateParts(isoDate: string, dateType: string | null | undefined): string | null {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const isLunar = dateType?.startsWith('음') ?? false
  const isHanja = dateType?.endsWith('한자') ?? false
  const unit = isHanja ? { y: '年', m: '月', d: '日' } : { y: '년', m: '월', d: '일' }
  const prefix = isLunar ? '음력 ' : ''
  return `${prefix}${y}${unit.y} ${m}${unit.m} ${d}${unit.d}`
}

export function formatBirthEngrave(isoDate: string | null | undefined, dateType: string | null | undefined): string {
  if (!isoDate) return ''
  const base = formatDateParts(isoDate, dateType)
  if (!base) return ''
  return `出生 ${base}`
}

export function formatDeathEngrave(
  isoDate: string | null | undefined,
  dateType: string | null | undefined,
  religion: string | null | undefined,
): string {
  if (!isoDate) return ''
  const base = formatDateParts(isoDate, dateType)
  if (!base) return ''
  return `${deathWording(religion)} ${base}`
}

function formatDateDots(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${y}.${m.padStart(2, '0')}.${d.padStart(2, '0')}`
}

export function formatBirthEngraveDot(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  return `出生 ${formatDateDots(isoDate)}`
}

export function formatDeathEngraveDot(
  isoDate: string | null | undefined,
  religion: string | null | undefined,
): string {
  if (!isoDate) return ''
  return `${deathWording(religion)} ${formatDateDots(isoDate)}`
}

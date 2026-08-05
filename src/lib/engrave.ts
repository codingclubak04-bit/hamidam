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

/**
 * 종교 기호는 텍스트(유니코드 문자)로 그리면 웹폰트에 글리프가 없어 기기별
 * 시스템 폴백 폰트로 대체되며 모양이 달라진다(PC/iOS 불일치의 원인). 폰트에
 * 의존하지 않고 항상 동일하게 보이도록 고정된 SVG path로 직접 그린다.
 * viewBox는 "0 0 100 100" 기준.
 */
export interface ReligionIcon {
  path: string
  fillRule?: 'evenodd' | 'nonzero'
}

const CROSS_PATH = 'M42,6 H58 V24 H90 V40 H58 V96 H42 V40 H10 V24 H42 Z'

const MANJI_PATH =
  'M42,10 H58 V42 H90 V58 H58 V90 H42 V58 H10 V42 H42 Z ' +
  'M10,10 H42 V26 H10 Z M74,10 H90 V42 H74 Z M58,74 H90 V90 H58 Z M10,58 H42 V74 H10 Z'

const CIRCLE_PATH =
  'M5,50 A45,45 0 1,0 95,50 A45,45 0 1,0 5,50 Z M17,50 A33,33 0 1,1 83,50 A33,33 0 1,1 17,50 Z'

// religionSymbol()이 반환하는 문자 → 아이콘 path. EngravePreview/composeEngraveImage는
// 원래 종교명이 아니라 이미 변환된 심볼 문자(el.text)만 가지고 있으므로 문자 기준으로 조회한다.
const RELIGION_ICON_BY_SYMBOL: Record<string, ReligionIcon> = {
  '✝': { path: CROSS_PATH },
  '卍': { path: MANJI_PATH },
  '○': { path: CIRCLE_PATH, fillRule: 'evenodd' },
}

export function religionIconFromSymbol(symbol: string): ReligionIcon | null {
  return RELIGION_ICON_BY_SYMBOL[symbol] ?? null
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

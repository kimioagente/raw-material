import type { PeriodRef } from '@/types'

const MONTHS_PT = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO',
]

export function getPeriodLabel(year: number, month: number, half: 1 | 2 | null): string {
  const monthName = MONTHS_PT[month - 1]
  if (half === null) return `${monthName} / ${year}`
  return `${half}ª QUINZ. ${monthName} / ${year}`
}

export function getCurrentPeriod(): PeriodRef {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const half: 1 | 2 = day <= 15 ? 1 : 2
  return { year, month, half }
}

export function calcDifference(weightScale: number | null, weightNf: number | null): number | null {
  if (weightScale == null || weightNf == null) return null
  return Number((weightScale - weightNf).toFixed(3))
}

export function calcPriceCheck(valueNf: number | null, weightNf: number | null): number | null {
  if (valueNf == null || weightNf == null || weightNf === 0) return null
  return Number((valueNf / weightNf).toFixed(2))
}

export function formatTon(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ''
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseTon(s: string): number | null {
  if (!s.trim()) return null
  const cleaned = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function parseCurrency(s: string): number | null {
  if (!s.trim()) return null
  const cleaned = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function nextPeriod(ref: PeriodRef): PeriodRef {
  if (ref.half === 1) return { ...ref, half: 2 }
  if (ref.half === 2) {
    const month = ref.month === 12 ? 1 : ref.month + 1
    const year = ref.month === 12 ? ref.year + 1 : ref.year
    return { year, month, half: 1 }
  }
  // mensal
  const month = ref.month === 12 ? 1 : ref.month + 1
  const year = ref.month === 12 ? ref.year + 1 : ref.year
  return { year, month, half: null }
}

export function prevPeriod(ref: PeriodRef): PeriodRef {
  if (ref.half === 2) return { ...ref, half: 1 }
  if (ref.half === 1) {
    const month = ref.month === 1 ? 12 : ref.month - 1
    const year = ref.month === 1 ? ref.year - 1 : ref.year
    return { year, month, half: 2 }
  }
  // mensal
  const month = ref.month === 1 ? 12 : ref.month - 1
  const year = ref.month === 1 ? ref.year - 1 : ref.year
  return { year, month, half: null }
}

import { create } from 'zustand'
import { getCurrentPeriod, nextPeriod, prevPeriod } from '@/lib/calculations'
import type { PeriodRef } from '@/types'

interface PeriodState {
  current: PeriodRef
  goNext: () => void
  goPrev: () => void
  set: (ref: PeriodRef) => void
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  current: getCurrentPeriod(),
  goNext: () => set({ current: nextPeriod(get().current) }),
  goPrev: () => set({ current: prevPeriod(get().current) }),
  set: (ref) => set({ current: ref }),
}))

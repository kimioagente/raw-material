import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel } from '@/lib/calculations'

export function PeriodSelector() {
  const { current, goNext, goPrev } = usePeriodStore()
  const label = getPeriodLabel(current.year, current.month, current.half)

  return (
    <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-1 py-1 shadow-sm">
      <Button variant="ghost" size="icon" onClick={goPrev} className="h-7 w-7">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1.5 px-2">
        <Calendar className="h-3.5 w-3.5 text-brand" />
        <span className="text-sm font-semibold tracking-wide text-stone-800 min-w-[200px] text-center">
          {label}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={goNext} className="h-7 w-7">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

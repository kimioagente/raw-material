import { useNavigate } from 'react-router-dom'
import { Package, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Supplier } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  supplier: Supplier
  companySlug: string
  pendingCount?: number
}

export function SupplierCard({ supplier, companySlug, pendingCount = 0 }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/app/${companySlug}/${supplier.id}`)}
      className={cn(
        'group relative flex w-full flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md',
        pendingCount > 0 ? 'border-amber-200' : 'border-stone-200'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              pendingCount > 0 ? 'bg-amber-100' : 'bg-brand/10'
            )}
          >
            <Package
              className={cn('h-4 w-4', pendingCount > 0 ? 'text-amber-700' : 'text-brand')}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight text-stone-900">{supplier.name}</h3>
            <p className="mt-0.5 text-[11px] text-stone-500 capitalize">{supplier.period_type}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-brand" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {pendingCount > 0 ? (
          <Badge variant="amber" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <Badge variant="green" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Em dia
          </Badge>
        )}
      </div>
    </button>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MaterialBlock } from '@/components/blocks/MaterialBlock'
import { supabase } from '@/lib/supabase'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel } from '@/lib/calculations'
import type { Supplier, SupplierBlock, Period, Company } from '@/types'

export function SupplierPage() {
  const { supplierId, company } = useParams<{ supplierId: string; company: string }>()
  const navigate = useNavigate()
  const { current } = usePeriodStore()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [blocks, setBlocks] = useState<SupplierBlock[]>([])
  const [period, setPeriod] = useState<Period | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supplierId) return

    const load = async () => {
      setLoading(true)

      const [{ data: sup }, { data: blks }] = await Promise.all([
        supabase.from('suppliers').select('*').eq('id', supplierId).single(),
        supabase
          .from('supplier_blocks')
          .select('*')
          .eq('supplier_id', supplierId)
          .eq('active', true)
          .order('display_order'),
      ])

      setSupplier(sup as Supplier | null)
      setBlocks((blks as SupplierBlock[]) ?? [])

      // Resolve or create period
      if (sup) {
        const { data: co } = await supabase
          .from('companies')
          .select('id')
          .eq('id', (sup as Supplier).company_id)
          .single()

        if (co) {
          const half = sup.period_type === 'mensal' ? null : current.half

          const { data: p } = await supabase
            .from('periods')
            .upsert(
              {
                company_id: co.id,
                year: current.year,
                month: current.month,
                half,
                label: getPeriodLabel(current.year, current.month, half),
              },
              { onConflict: 'company_id,year,month,half' }
            )
            .select('*')
            .single()

          setPeriod(p as Period | null)
        }
      }

      setLoading(false)
    }

    load()
  }, [supplierId, current])

  const periodLabel = getPeriodLabel(current.year, current.month, current.half)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-stone-500">Fornecedor não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/app/${company}`)}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-stone-900">{supplier.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-stone-500">{periodLabel}</p>
              <Badge variant="secondary" className="capitalize text-[11px]">
                {supplier.period_type}
              </Badge>
              {supplier.document && (
                <span className="text-xs text-stone-400">{supplier.document}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-white">
          <p className="text-sm text-stone-500">Nenhum bloco de produto configurado.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/settings')}>
            Configurar blocos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block) => (
            <MaterialBlock
              key={block.id}
              block={block}
              periodId={period?.id ?? ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}

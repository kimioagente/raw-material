import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FreightTable } from '@/components/freight/FreightTable'
import { supabase } from '@/lib/supabase'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel } from '@/lib/calculations'
import { useAuthStore } from '@/stores/authStore'
import type { FreightRecord, Period } from '@/types'

const CARRIERS: Record<string, string[]> = {
  madeiras: ['Fórmula Florestal Ltda'],
  pellets: ['Edson Lopes Martins', 'BBV Transportes', 'Frete Pinheirinho'],
}

export function FreightPage() {
  const { company } = useParams<{ company: string }>()
  const navigate = useNavigate()
  const { current } = usePeriodStore()
  const { isAdmin } = useAuthStore()
  const [records, setRecords] = useState<FreightRecord[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period | null>(null)
  const [loading, setLoading] = useState(true)
  const slug = company ?? 'madeiras'
  const carriers = CARRIERS[slug] ?? []

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: co } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!co) return setLoading(false)
      setCompanyId(co.id)

      // Get or create period
      const { data: p } = await supabase
        .from('periods')
        .upsert(
          {
            company_id: co.id,
            year: current.year,
            month: current.month,
            half: current.half,
            label: getPeriodLabel(current.year, current.month, current.half),
          },
          { onConflict: 'company_id,year,month,half' }
        )
        .select('*')
        .single()

      setPeriod(p as Period | null)

      if (p) {
        const { data: recs } = await supabase
          .from('freight_records')
          .select('*')
          .eq('company_id', co.id)
          .eq('period_id', p.id)
          .order('entry_date', { ascending: true })
        setRecords((recs as FreightRecord[]) ?? [])
      }

      setLoading(false)
    }
    load()
  }, [slug, current])

  const periodLabel = getPeriodLabel(current.year, current.month, current.half)
  const companyName = slug === 'madeiras' ? 'Madeiras Rodrigues' : 'Pellets Rodrigues'

  const recordsFor = (carrier: string) => records.filter((r) => r.carrier_name === carrier)

  const updateRecordsFor = (carrier: string, updated: FreightRecord[]) => {
    setRecords((prev) => [
      ...prev.filter((r) => r.carrier_name !== carrier),
      ...updated,
    ])
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/app/${slug}`)} className="mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-brand" />
            <h1 className="text-xl font-bold text-stone-900">Controle de Frete</h1>
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            {companyName} · {periodLabel}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue={carriers[0]}>
          <TabsList className="mb-4">
            {carriers.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
          {carriers.map((c) => (
            <TabsContent key={c} value={c}>
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="border-b border-stone-100 bg-stone-50/60 px-4 py-3">
                  <h2 className="text-sm font-semibold text-stone-800">{c}</h2>
                </div>
                {period && companyId ? (
                  <FreightTable
                    records={recordsFor(c)}
                    carrierName={c}
                    companyId={companyId}
                    periodId={period.id}
                    onRecordsChange={(recs) => updateRecordsFor(c, recs)}
                    isAdmin={isAdmin()}
                  />
                ) : (
                  <p className="p-6 text-sm text-stone-400">Carregando período...</p>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

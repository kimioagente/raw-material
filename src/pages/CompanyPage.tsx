import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Truck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupplierCard } from '@/components/suppliers/SupplierCard'
import { supabase } from '@/lib/supabase'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel } from '@/lib/calculations'
import type { Company, Supplier } from '@/types'

type CompanySlug = 'madeiras' | 'pellets'

const COMPANY_NAMES: Record<CompanySlug, string> = {
  madeiras: 'Madeiras Rodrigues',
  pellets: 'Pellets Rodrigues',
}

export function CompanyPage() {
  const { company } = useParams<{ company: string }>()
  const navigate = useNavigate()
  const { current } = usePeriodStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const slug = company as CompanySlug

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: co } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .single()
      if (!co) return

      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('company_id', co.id)
        .eq('active', true)
        .order('display_order')

      setSuppliers(data ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  const periodLabel = getPeriodLabel(current.year, current.month, current.half)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {COMPANY_NAMES[slug] ?? slug}
          </h1>
          <p className="text-sm text-stone-500">{periodLabel}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/app/${slug}/frete`)}
          className="gap-1.5"
        >
          <Truck className="h-4 w-4" />
          Controle de Frete
        </Button>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-white">
          <p className="text-sm text-stone-500">Nenhum fornecedor cadastrado.</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/settings')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Cadastrar fornecedor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <SupplierCard key={s.id} supplier={s} companySlug={slug} />
          ))}
        </div>
      )}
    </div>
  )
}

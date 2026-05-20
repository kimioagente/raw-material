import { useNavigate } from 'react-router-dom'
import { Layers, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel } from '@/lib/calculations'

const companies = [
  {
    slug: 'madeiras',
    name: 'Madeiras Rodrigues',
    description: '4 fornecedores · Toras Pinus',
    accent: 'from-brand-dark to-brand',
  },
  {
    slug: 'pellets',
    name: 'Pellets Rodrigues',
    description: '6 fornecedores · Cavaco · Serragem · Farelo',
    accent: 'from-brand to-brand-light',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { current } = usePeriodStore()
  const label = getPeriodLabel(current.year, current.month, current.half)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Visão Geral</h1>
        <p className="text-sm text-stone-500">{label}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {companies.map((c) => (
          <button
            key={c.slug}
            onClick={() => navigate(`/app/${c.slug}`)}
            className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <Layers className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900">{c.name}</h2>
                  <p className="text-xs text-stone-500">{c.description}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/app/${c.slug}`)
                }}
                className="text-xs"
              >
                Ver fornecedores
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/app/${c.slug}/frete`)
                }}
                className="text-xs"
              >
                Controle de frete
              </Button>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

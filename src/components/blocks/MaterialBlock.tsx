import { useState, useEffect } from 'react'
import { Plus, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EntryRow } from './EntryRow'
import { ComplementRow } from './ComplementRow'
import { supabase } from '@/lib/supabase'
import { formatTon, formatCurrency, calcDifference, calcPriceCheck } from '@/lib/calculations'
import { toast } from '@/hooks/useToast'
import { useAuthStore } from '@/stores/authStore'
import type { SupplierBlock, Entry, Complement } from '@/types'
import * as XLSX from 'xlsx'
import { cn } from '@/lib/utils'

interface Props {
  block: SupplierBlock
  periodId: string
}

export function MaterialBlock({ block, periodId }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [complement, setComplement] = useState<Complement | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const { isAdmin } = useAuthStore()
  const cfg = block.column_config

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: ents }, { data: comp }] = await Promise.all([
        supabase
          .from('entries')
          .select('*')
          .eq('supplier_block_id', block.id)
          .eq('period_id', periodId)
          .order('entry_date', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('complements')
          .select('*')
          .eq('supplier_block_id', block.id)
          .eq('period_id', periodId)
          .maybeSingle(),
      ])
      setEntries((ents as Entry[]) ?? [])
      setComplement(comp as Complement | null)
      setLoading(false)
    }
    load()
  }, [block.id, periodId])

  const addRow = async () => {
    const { data, error } = await supabase
      .from('entries')
      .insert({
        supplier_block_id: block.id,
        period_id: periodId,
        status: 'pendente',
        source: 'manual',
      })
      .select('*')
      .single()

    if (error) {
      toast({ title: 'Erro ao adicionar linha', variant: 'destructive' })
    } else {
      setEntries((prev) => [...prev, data as Entry])
    }
  }

  const updateEntry = (updated: Entry) =>
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))

  const deleteEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id))

  // Totals
  const totalScale = entries.reduce((s, e) => s + (e.weight_scale ?? 0), 0)
  const totalNf = entries.reduce((s, e) => s + (e.weight_nf ?? 0), 0)
  const totalValue = entries.reduce((s, e) => s + (e.value_nf ?? 0), 0)
  const totalDiff = entries.reduce((s, e) => s + (calcDifference(e.weight_scale, e.weight_nf) ?? 0), 0)
  const pendingCount = entries.filter((e) => e.status === 'nao_verificado').length

  const exportExcel = () => {
    const rows = entries.map((e) => ({
      Data: e.entry_date ?? '',
      Caminhão: e.truck_plate ?? '',
      [cfg.weightScaleLabel]: e.weight_scale ?? '',
      'Nº NF': e.nf_number ?? '',
      'Ton. NF': e.weight_nf ?? '',
      'Valor NF': e.value_nf ?? '',
      Diferença: calcDifference(e.weight_scale, e.weight_nf) ?? '',
      ...(cfg.showPriceCheck ? { [cfg.priceCheckLabel]: calcPriceCheck(e.value_nf, e.weight_nf) ?? '' } : {}),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, block.product_name.slice(0, 31))
    XLSX.writeFile(wb, `${block.product_name}.xlsx`)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Block header */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-4 py-3">
        <button
          className="flex items-center gap-2 text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-800">{block.product_name}</span>
              {block.product_code && (
                <span className="text-xs text-stone-400">{block.product_code}</span>
              )}
              {block.price_per_ton != null && (
                <Badge variant="secondary" className="text-[10px]">
                  R$ {formatCurrency(block.price_per_ton)}/ton
                </Badge>
              )}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="amber" className="text-[10px]">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={exportExcel} className="h-7 gap-1 text-xs">
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={addRow} className="h-7 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Linha
          </Button>
        </div>
      </div>

      {!collapsed && (
        <>
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/40">
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Data</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Caminhão</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">{cfg.weightScaleLabel}</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nº NF</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Ton. NF</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Valor NF</th>
                    <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Diferença</th>
                    {cfg.showPriceCheck && (
                      <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">{cfg.priceCheckLabel}</th>
                    )}
                    {cfg.showDueDate && (
                      <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Vencimento</th>
                    )}
                    {cfg.showLineStatus && (
                      <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Status</th>
                    )}
                    <th className="w-20 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8 + (cfg.showPriceCheck ? 1 : 0) + (cfg.showDueDate ? 1 : 0) + (cfg.showLineStatus ? 1 : 0)}
                        className="px-4 py-6 text-center text-sm text-stone-400"
                      >
                        Nenhum lançamento neste período.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        colCfg={cfg}
                        onUpdate={updateEntry}
                        onDelete={deleteEntry}
                        isAdmin={isAdmin()}
                      />
                    ))
                  )}
                  <ComplementRow
                    complement={complement}
                    blockId={block.id}
                    periodId={periodId}
                    onUpdate={(c) => setComplement(c)}
                  />
                </tbody>

                {/* Totals */}
                <tfoot>
                  <tr className="border-t-2 border-stone-200 bg-brand/5 font-semibold">
                    <td className="px-2 py-2 text-xs uppercase tracking-wide text-stone-600" colSpan={2}>
                      Total
                    </td>
                    <td className="px-2 py-2 text-right text-sm tabular-nums text-stone-800">
                      {formatTon(totalScale)}
                    </td>
                    <td />
                    <td className="px-2 py-2 text-right text-sm tabular-nums text-stone-800">
                      {formatTon(totalNf)}
                    </td>
                    <td className="px-2 py-2 text-right text-sm tabular-nums text-stone-800">
                      R$ {formatCurrency(totalValue)}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-2 text-right text-sm tabular-nums',
                        totalDiff < 0 ? 'text-red-600' : 'text-stone-800'
                      )}
                    >
                      {formatTon(totalDiff)}
                    </td>
                    {cfg.showPriceCheck && <td />}
                    {cfg.showDueDate && <td />}
                    {cfg.showLineStatus && <td />}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

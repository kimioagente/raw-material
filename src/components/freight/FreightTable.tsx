import { useState } from 'react'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { formatTon, formatCurrency } from '@/lib/calculations'
import { toast } from '@/hooks/useToast'
import type { FreightRecord } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  records: FreightRecord[]
  carrierName: string
  companyId: string
  periodId: string
  onRecordsChange: (records: FreightRecord[]) => void
  isAdmin: boolean
}

function EditCell({
  value,
  type = 'text',
  align = 'left',
  onSave,
}: {
  value: string
  type?: 'text' | 'number' | 'date'
  align?: 'left' | 'right'
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  const commit = () => {
    if (val !== value) onSave(val)
    setEditing(false)
  }

  return (
    <td
      className={cn('px-2 py-1.5 text-sm cursor-pointer', align === 'right' && 'text-right', editing && 'p-0')}
      onClick={!editing ? () => { setVal(value); setEditing(true) } : undefined}
    >
      {editing ? (
        <input
          type={type}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          className={cn(
            'w-full border-0 bg-brand/5 px-2 py-1.5 text-sm outline-none',
            align === 'right' && 'text-right'
          )}
        />
      ) : (
        <span className={!value ? 'text-stone-300' : ''}>{value || '—'}</span>
      )}
    </td>
  )
}

export function FreightTable({ records, carrierName, companyId, periodId, onRecordsChange, isAdmin }: Props) {
  const [adding, setAdding] = useState(false)

  const addRow = async () => {
    setAdding(true)
    const { data, error } = await supabase
      .from('freight_records')
      .insert({ carrier_name: carrierName, company_id: companyId, period_id: periodId })
      .select('*')
      .single()
    if (error) toast({ title: 'Erro ao adicionar', variant: 'destructive' })
    else onRecordsChange([...records, data as FreightRecord])
    setAdding(false)
  }

  const updateRecord = async (id: string, field: string, rawVal: string) => {
    let val: string | number | null = rawVal || null
    if (['weight_scale', 'weight_nf', 'value'].includes(field) && rawVal) {
      val = parseFloat(rawVal.replace(',', '.'))
      if (isNaN(val as number)) val = null
    }
    const { data } = await supabase
      .from('freight_records')
      .update({ [field]: val })
      .eq('id', id)
      .select('*')
      .single()
    if (data) onRecordsChange(records.map((r) => (r.id === id ? (data as FreightRecord) : r)))
  }

  const deleteRecord = async (id: string) => {
    if (!confirm('Remover este registro?')) return
    await supabase.from('freight_records').delete().eq('id', id)
    onRecordsChange(records.filter((r) => r.id !== id))
  }

  const totalTon = records.reduce((s, r) => s + (r.weight_nf ?? 0), 0)
  const totalVal = records.reduce((s, r) => s + (r.value ?? 0), 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Data</th>
            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Caminhão</th>
            <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Peso</th>
            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nº NF</th>
            <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Peso NF</th>
            <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nº CTE</th>
            <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Valor R$</th>
            {isAdmin && <th className="w-10 px-2 py-2" />}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-stone-400">
                Nenhum registro de frete neste período.
              </td>
            </tr>
          ) : (
            records.map((r) => (
              <tr key={r.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                <EditCell
                  value={r.entry_date ?? ''}
                  type="date"
                  onSave={(v) => updateRecord(r.id, 'entry_date', v)}
                />
                <EditCell
                  value={r.truck_plate ?? ''}
                  onSave={(v) => updateRecord(r.id, 'truck_plate', v)}
                />
                <EditCell
                  value={r.weight_scale != null ? String(r.weight_scale) : ''}
                  type="number"
                  align="right"
                  onSave={(v) => updateRecord(r.id, 'weight_scale', v)}
                />
                <EditCell
                  value={r.nf_number ?? ''}
                  onSave={(v) => updateRecord(r.id, 'nf_number', v)}
                />
                <EditCell
                  value={r.weight_nf != null ? String(r.weight_nf) : ''}
                  type="number"
                  align="right"
                  onSave={(v) => updateRecord(r.id, 'weight_nf', v)}
                />
                <EditCell
                  value={r.cte_number ?? ''}
                  onSave={(v) => updateRecord(r.id, 'cte_number', v)}
                />
                <EditCell
                  value={r.value != null ? String(r.value) : ''}
                  type="number"
                  align="right"
                  onSave={(v) => updateRecord(r.id, 'value', v)}
                />
                {isAdmin && (
                  <td className="px-2 py-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-stone-400 hover:text-red-600"
                      onClick={() => deleteRecord(r.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-stone-200 bg-brand/5 font-semibold">
            <td colSpan={4} className="px-2 py-2 text-xs uppercase tracking-wide text-stone-600">Total</td>
            <td className="px-2 py-2 text-right text-sm tabular-nums">{formatTon(totalTon)}</td>
            <td />
            <td className="px-2 py-2 text-right text-sm tabular-nums">R$ {formatCurrency(totalVal)}</td>
            {isAdmin && <td />}
          </tr>
        </tfoot>
      </table>
      <div className="border-t border-stone-100 px-4 py-2">
        <Button variant="ghost" size="sm" onClick={addRow} disabled={adding} className="gap-1 text-xs">
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Adicionar linha
        </Button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/calculations'
import { toast } from '@/hooks/useToast'
import type { Complement } from '@/types'

interface Props {
  complement: Complement | null
  blockId: string
  periodId: string
  onUpdate: (c: Complement) => void
}

export function ComplementRow({ complement, blockId, periodId, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(complement?.value != null ? String(complement.value) : '')
  const [note, setNote] = useState(complement?.note ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const numVal = parseFloat(val.replace(',', '.')) || 0

    const payload = {
      supplier_block_id: blockId,
      period_id: periodId,
      value: numVal,
      note: note || null,
    }

    let result
    if (complement?.id) {
      result = await supabase
        .from('complements')
        .update(payload)
        .eq('id', complement.id)
        .select('*')
        .single()
    } else {
      result = await supabase
        .from('complements')
        .insert(payload)
        .select('*')
        .single()
    }

    if (result.error) {
      toast({ title: 'Erro ao salvar complemento', variant: 'destructive' })
    } else {
      onUpdate(result.data as Complement)
      setEditing(false)
    }
    setSaving(false)
  }

  const currentVal = complement?.value ?? 0
  const currentNote = complement?.note

  return (
    <tr className="border-b border-stone-100 bg-stone-50/50">
      <td colSpan={3} className="px-3 py-1.5 text-xs font-medium text-stone-500 italic">
        Complemento {currentNote ? `— ${currentNote}` : ''}
      </td>
      <td colSpan={2} />
      <td className="px-2 py-1.5 text-right text-sm font-medium tabular-nums text-brand">
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-28 rounded border border-stone-300 px-2 py-0.5 text-right text-sm focus:outline-none focus:ring-1 focus:ring-brand/50"
            autoFocus
          />
        ) : (
          <span
            className="cursor-pointer hover:text-brand-dark"
            onClick={() => { setEditing(true); setVal(String(currentVal)) }}
          >
            {currentVal !== 0 ? `R$ ${formatCurrency(currentVal)}` : '—'}
          </span>
        )}
      </td>
      <td colSpan={3} className="px-2 py-1.5">
        {editing && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-48 rounded border border-stone-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand/50"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-brand px-2 py-0.5 text-xs text-white hover:bg-brand-light disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Cancelar
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

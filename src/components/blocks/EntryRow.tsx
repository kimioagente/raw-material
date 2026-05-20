import { useState, useRef, KeyboardEvent } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { calcDifference, calcPriceCheck, formatTon, formatCurrency } from '@/lib/calculations'
import { toast } from '@/hooks/useToast'
import type { Entry, ColumnConfig } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  entry: Entry
  colCfg: ColumnConfig
  onUpdate: (updated: Entry) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}

type Field = 'entry_date' | 'truck_plate' | 'weight_scale' | 'nf_number' | 'weight_nf' | 'value_nf' | 'due_date_info'

const ORDERED_FIELDS: Field[] = [
  'entry_date', 'truck_plate', 'weight_scale', 'nf_number', 'weight_nf', 'value_nf',
]

function EditableCell({
  value,
  type = 'text',
  align = 'left',
  fieldName,
  entryId,
  active,
  onActivate,
  onSave,
  onTab,
  tabIndex,
}: {
  value: string
  type?: 'text' | 'number' | 'date'
  align?: 'left' | 'right'
  fieldName: Field
  entryId: string
  active: boolean
  onActivate: () => void
  onSave: (field: Field, value: string) => Promise<void>
  onTab: (shift: boolean) => void
  tabIndex?: number
}) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setLocalVal(value)
    setEditing(true)
    onActivate()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = async () => {
    if (localVal === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    await onSave(fieldName, localVal)
    setSaving(false)
    setEditing(false)
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { setEditing(false); setLocalVal(value) }
    if (e.key === 'Tab') { e.preventDefault(); commit().then(() => onTab(e.shiftKey)) }
  }

  return (
    <td
      className={cn(
        'px-2 py-1.5 text-sm',
        align === 'right' && 'text-right',
        active && !editing && 'ring-1 ring-inset ring-brand/40',
        editing && 'p-0'
      )}
      onClick={!editing ? startEdit : undefined}
    >
      {editing ? (
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type={type}
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            tabIndex={tabIndex}
            step={type === 'number' ? '0.001' : undefined}
            className={cn(
              'w-full border-0 bg-brand/5 px-2 py-1.5 text-sm outline-none focus:ring-0',
              align === 'right' && 'text-right',
              type === 'date' && 'min-w-[130px]'
            )}
          />
          {saving && (
            <Loader2 className="absolute right-2 h-3 w-3 animate-spin text-stone-400" />
          )}
        </div>
      ) : (
        <span className={cn('cursor-pointer select-none', !value && 'text-stone-300')}>
          {value || '—'}
        </span>
      )}
    </td>
  )
}

export function EntryRow({ entry, colCfg, onUpdate, onDelete, isAdmin }: Props) {
  const [activeField, setActiveField] = useState<Field | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const diff = calcDifference(entry.weight_scale, entry.weight_nf)
  const priceChk = calcPriceCheck(entry.value_nf, entry.weight_nf)

  const getFieldValue = (field: Field): string => {
    const v = entry[field]
    if (v == null) return ''
    if (field === 'weight_scale' || field === 'weight_nf') return String(v)
    if (field === 'value_nf') return String(v)
    return String(v)
  }

  const handleSave = async (field: Field, rawValue: string) => {
    let val: string | number | null = rawValue || null
    if ((field === 'weight_scale' || field === 'weight_nf' || field === 'value_nf') && rawValue) {
      val = parseFloat(rawValue.replace(',', '.'))
      if (isNaN(val as number)) val = null
    }

    const newPriceCheck =
      field === 'value_nf' || field === 'weight_nf'
        ? calcPriceCheck(
            field === 'value_nf' ? (val as number) : entry.value_nf,
            field === 'weight_nf' ? (val as number) : entry.weight_nf
          )
        : entry.price_check

    const { data, error } = await supabase
      .from('entries')
      .update({
        [field]: val,
        price_check: newPriceCheck,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry.id)
      .select('*')
      .single()

    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } else if (data) {
      onUpdate(data as Entry)
    }
  }

  const handleVerify = async () => {
    if (entry.status === 'verificado') return
    setVerifying(true)
    const { data, error } = await supabase
      .from('entries')
      .update({ status: 'verificado', updated_at: new Date().toISOString() })
      .eq('id', entry.id)
      .select('*')
      .single()
    if (!error && data) onUpdate(data as Entry)
    setVerifying(false)
  }

  const handleDelete = async () => {
    if (!confirm('Remover esta linha?')) return
    setDeleting(true)
    await supabase.from('entries').delete().eq('id', entry.id)
    onDelete(entry.id)
    setDeleting(false)
  }

  const cycleField = (from: Field, shift: boolean) => {
    const fields = colCfg.showDueDate
      ? [...ORDERED_FIELDS, 'due_date_info' as Field]
      : ORDERED_FIELDS
    const idx = fields.indexOf(from)
    const next = shift ? fields[idx - 1] : fields[idx + 1]
    setActiveField(next ?? null)
  }

  const isUnverified = entry.status === 'nao_verificado'

  return (
    <tr
      className={cn(
        'border-b border-stone-100 transition-colors hover:bg-stone-50/50',
        isUnverified && 'bg-amber-50 hover:bg-amber-50'
      )}
    >
      <EditableCell
        value={getFieldValue('entry_date')}
        type="date"
        fieldName="entry_date"
        entryId={entry.id}
        active={activeField === 'entry_date'}
        onActivate={() => setActiveField('entry_date')}
        onSave={handleSave}
        onTab={(s) => cycleField('entry_date', s)}
      />
      <EditableCell
        value={getFieldValue('truck_plate')}
        fieldName="truck_plate"
        entryId={entry.id}
        active={activeField === 'truck_plate'}
        onActivate={() => setActiveField('truck_plate')}
        onSave={handleSave}
        onTab={(s) => cycleField('truck_plate', s)}
      />
      <EditableCell
        value={getFieldValue('weight_scale')}
        type="number"
        align="right"
        fieldName="weight_scale"
        entryId={entry.id}
        active={activeField === 'weight_scale'}
        onActivate={() => setActiveField('weight_scale')}
        onSave={handleSave}
        onTab={(s) => cycleField('weight_scale', s)}
      />
      <EditableCell
        value={getFieldValue('nf_number')}
        fieldName="nf_number"
        entryId={entry.id}
        active={activeField === 'nf_number'}
        onActivate={() => setActiveField('nf_number')}
        onSave={handleSave}
        onTab={(s) => cycleField('nf_number', s)}
      />
      <td className="px-2 py-1.5 text-right text-sm">
        <EditableCell
          value={getFieldValue('weight_nf')}
          type="number"
          align="right"
          fieldName="weight_nf"
          entryId={entry.id}
          active={activeField === 'weight_nf'}
          onActivate={() => setActiveField('weight_nf')}
          onSave={handleSave}
          onTab={(s) => cycleField('weight_nf', s)}
        />
      </td>
      <EditableCell
        value={getFieldValue('value_nf')}
        type="number"
        align="right"
        fieldName="value_nf"
        entryId={entry.id}
        active={activeField === 'value_nf'}
        onActivate={() => setActiveField('value_nf')}
        onSave={handleSave}
        onTab={(s) => cycleField('value_nf', s)}
      />

      {/* Difference — read only */}
      <td
        className={cn(
          'px-2 py-1.5 text-right text-sm tabular-nums',
          diff != null && diff < 0 ? 'text-red-600' : 'text-stone-700'
        )}
      >
        {diff != null ? formatTon(diff) : '—'}
      </td>

      {/* Price check */}
      {colCfg.showPriceCheck && (
        <td className="px-2 py-1.5 text-right text-sm tabular-nums text-stone-500">
          {priceChk != null ? `R$ ${formatCurrency(priceChk)}` : '—'}
        </td>
      )}

      {/* Due date (Klabin) */}
      {colCfg.showDueDate && (
        <EditableCell
          value={entry.due_date_info ?? ''}
          fieldName="due_date_info"
          entryId={entry.id}
          active={activeField === 'due_date_info'}
          onActivate={() => setActiveField('due_date_info')}
          onSave={handleSave}
          onTab={(s) => cycleField('due_date_info', s)}
        />
      )}

      {/* Line status (JJ Thomazi) */}
      {colCfg.showLineStatus && (
        <td className="px-2 py-1.5">
          {entry.status === 'verificado' ? (
            <Badge variant="green" className="text-[10px]">Verificado</Badge>
          ) : (
            <Badge variant="amber" className="text-[10px]">Não verificado</Badge>
          )}
        </td>
      )}

      {/* Actions */}
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1">
          {isUnverified && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-[10px] text-brand border-brand/30 hover:bg-brand/5"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><Check className="mr-0.5 h-3 w-3" />Verificar</>
              )}
            </Button>
          )}
          {isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-stone-400 hover:text-red-600"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

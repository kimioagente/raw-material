import { useEffect, useState } from 'react'
import { Plus, Edit2, Loader2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/hooks/useToast'
import type { Supplier, SupplierBlock, Company, Profile } from '@/types'

function SupplierBlockEditor({
  block,
  onUpdate,
}: {
  block: SupplierBlock
  onUpdate: (b: SupplierBlock) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(block.product_name)
  const [code, setCode] = useState(block.product_code ?? '')
  const [price, setPrice] = useState(block.price_per_ton != null ? String(block.price_per_ton) : '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const { data } = await supabase
      .from('supplier_blocks')
      .update({
        product_name: name,
        product_code: code || null,
        price_per_ton: price ? parseFloat(price) : null,
      })
      .eq('id', block.id)
      .select('*')
      .single()
    if (data) onUpdate(data as SupplierBlock)
    setSaving(false)
    setEditing(false)
    toast({ title: 'Bloco atualizado', variant: 'success' })
  }

  if (!editing)
    return (
      <div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5">
        <div>
          <span className="text-sm font-medium text-stone-800">{block.product_name}</span>
          {block.product_code && (
            <span className="ml-2 text-xs text-stone-400">{block.product_code}</span>
          )}
          {block.price_per_ton != null && (
            <Badge variant="secondary" className="ml-2 text-[10px]">
              R$ {block.price_per_ton}/ton
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    )

  return (
    <div className="space-y-2 rounded-lg border border-brand/30 bg-brand/5 p-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nome do produto</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Código</Label>
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Preço R$/ton</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={saving} className="h-7 text-xs">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">
          <X className="h-3 w-3" /> Cancelar
        </Button>
      </div>
    </div>
  )
}

function SupplierSection({ supplier, company }: { supplier: Supplier; company: Company }) {
  const [blocks, setBlocks] = useState<SupplierBlock[]>([])
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(supplier.name)
  const [doc, setDoc] = useState(supplier.document ?? '')
  const [saving, setSaving] = useState(false)

  const loadBlocks = async () => {
    if (blocks.length > 0) return
    setLoadingBlocks(true)
    const { data } = await supabase
      .from('supplier_blocks')
      .select('*')
      .eq('supplier_id', supplier.id)
      .order('display_order')
    setBlocks((data as SupplierBlock[]) ?? [])
    setLoadingBlocks(false)
  }

  const toggle = async () => {
    if (!expanded) await loadBlocks()
    setExpanded(!expanded)
  }

  const saveSupplier = async () => {
    setSaving(true)
    await supabase
      .from('suppliers')
      .update({ name, document: doc || null })
      .eq('id', supplier.id)
    setSaving(false)
    setEditing(false)
    toast({ title: 'Fornecedor atualizado', variant: 'success' })
  }

  const addBlock = async () => {
    const { data } = await supabase
      .from('supplier_blocks')
      .insert({
        supplier_id: supplier.id,
        product_name: 'Novo produto',
        display_order: blocks.length + 1,
        column_config: {
          weightScaleLabel: 'Ton.',
          showPriceCheck: true,
          priceCheckLabel: 'Verificação',
          showLineStatus: false,
          showDueDate: false,
        },
      })
      .select('*')
      .single()
    if (data) setBlocks((prev) => [...prev, data as SupplierBlock])
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={toggle}
      >
        <div>
          <p className="text-sm font-semibold text-stone-800">{supplier.name}</p>
          <p className="text-xs text-stone-400">{supplier.document ?? 'CNPJ não cadastrado'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize text-[10px]">
            {supplier.period_type}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => { e.stopPropagation(); setEditing(!editing) }}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-stone-100 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CNPJ</Label>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} className="h-8 text-sm" placeholder="00.000.000/0001-00" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveSupplier} disabled={saving} className="h-7 text-xs">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Blocos de Produto</p>
            <Button variant="ghost" size="sm" onClick={addBlock} className="h-7 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Adicionar bloco
            </Button>
          </div>
          {loadingBlocks ? (
            <div className="flex h-12 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            </div>
          ) : blocks.length === 0 ? (
            <p className="text-xs text-stone-400">Nenhum bloco configurado.</p>
          ) : (
            <div className="space-y-1.5">
              {blocks.map((b) => (
                <SupplierBlockEditor
                  key={b.id}
                  block={b}
                  onUpdate={(updated) => setBlocks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { isAdmin, profile } = useAuthStore()
  const [companies, setCompanies] = useState<Company[]>([])
  const [suppliers, setSuppliers] = useState<Record<string, Supplier[]>>({})
  const [profiles, setProfilesList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: cos }, { data: sups }, { data: profs }] = await Promise.all([
        supabase.from('companies').select('*').order('name'),
        supabase.from('suppliers').select('*').eq('active', true).order('display_order'),
        supabase.from('profiles').select('*').order('name'),
      ])
      setCompanies((cos as Company[]) ?? [])
      const grouped: Record<string, Supplier[]> = {}
      for (const s of (sups as Supplier[]) ?? []) {
        if (!grouped[s.company_id]) grouped[s.company_id] = []
        grouped[s.company_id].push(s)
      }
      setSuppliers(grouped)
      setProfilesList((profs as Profile[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const updateRole = async (userId: string, role: 'admin' | 'viewer') => {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setProfilesList((prev) => prev.map((p) => (p.id === userId ? { ...p, role } : p)))
    toast({ title: 'Perfil atualizado', variant: 'success' })
  }

  if (!isAdmin()) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-stone-500">Acesso restrito a administradores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900">Configurações</h1>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : (
        <Tabs defaultValue="suppliers">
          <TabsList>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="mt-4 space-y-6">
            {companies.map((co) => (
              <div key={co.id} className="space-y-3">
                <h2 className="text-sm font-semibold text-stone-700">{co.name}</h2>
                <div className="space-y-2">
                  {(suppliers[co.id] ?? []).map((s) => (
                    <SupplierSection key={s.id} supplier={s} company={co} />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Nome</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Perfil</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-stone-800">{p.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={p.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {p.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {p.id !== profile?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              updateRole(p.id, p.role === 'admin' ? 'viewer' : 'admin')
                            }
                          >
                            Tornar {p.role === 'admin' ? 'viewer' : 'admin'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

import { useState, useRef } from 'react'
import { Upload, FileText, AlertTriangle, Check, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { usePeriodStore } from '@/stores/periodStore'
import { getPeriodLabel, calcPriceCheck } from '@/lib/calculations'
import { parseNFe, formatCNPJ, type ParsedNFe } from './XmlParser'
import { toast } from '@/hooks/useToast'

// ─── Types ────────────────────────────────────────────────────────────────────

type SupplierRow = {
  id: string
  name: string
  document: string | null
}

type BlockRow = {
  id: string
  supplier_id: string
  product_name: string
  product_code: string | null
}

interface MatchResult {
  parsed: ParsedNFe
  supplierId: string | null
  supplierName: string | null
  blockId: string | null
  blockName: string | null
  fileName: string
  error?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// FileReader com melhor compatibilidade que file.text()
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve((e.target?.result as string) ?? '')
    reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`))
    reader.readAsText(file, 'UTF-8')
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout (${ms / 1000}s): ${label}`)), ms)
    ),
  ])
}

// Matching bidirecional: "SERRAGEM VERDE" ↔ "Serragem"
function descricaoMatch(blockName: string, descricao: string): boolean {
  const block = blockName.toLowerCase()
  const desc = descricao.toLowerCase()
  const descWords = desc.split(/\s+/).filter((w) => w.length > 3)
  const blockWords = block.split(/\s+/).filter((w) => w.length > 3)
  return descWords.some((w) => block.includes(w)) || blockWords.some((w) => desc.includes(w))
}

const emptyParsed: ParsedNFe = {
  cnpjEmitente: '',
  nomeEmitente: '',
  cnpjDestinatario: '',
  numeroNF: '',
  dataEmissao: '',
  placaCaminhao: '',
  itens: [],
  valorTotal: 0,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportModal() {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { current } = usePeriodStore()

  const processFiles = async (files: FileList) => {
    setProcessing(true)
    setResults([])
    setGlobalError(null)
    setDebugInfo(null)

    try {
      // ── 1. Busca fornecedores (query simples, sem join) ──────────────────
      console.log('[IMPORT] Buscando fornecedores...')
      const { data: suppliersRaw, error: supErr } = await supabase
        .from('suppliers')
        .select('id, name, document')
        .eq('active', true)

      console.log('[IMPORT] Fornecedores:', suppliersRaw?.length ?? 0, supErr?.message)

      if (supErr) {
        setGlobalError(`Erro ao buscar fornecedores: ${supErr.message}`)
        return
      }

      const suppliers = (suppliersRaw ?? []) as SupplierRow[]

      // ── 2. Busca blocos de todos os fornecedores ─────────────────────────
      console.log('[IMPORT] Buscando blocos de produto...')
      const { data: blocksRaw, error: blkErr } = await supabase
        .from('supplier_blocks')
        .select('id, supplier_id, product_name, product_code')
        .eq('active', true)

      console.log('[IMPORT] Blocos:', blocksRaw?.length ?? 0, blkErr?.message)

      const blocks = (blocksRaw ?? []) as BlockRow[]

      // ── 3. Processa cada arquivo XML ─────────────────────────────────────
      const newResults: MatchResult[] = []

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.xml')) continue

        console.log('[IMPORT] Lendo arquivo:', file.name, `(${file.size} bytes)`)

        try {
          const text = await withTimeout(readFileAsText(file), 5000, `ler ${file.name}`)
          console.log('[IMPORT] Arquivo lido, chars:', text.length)

          const parsed = await withTimeout(parseNFe(text), 10000, `parse ${file.name}`)
          console.log('[IMPORT] Dados extraídos:', {
            cnpj: parsed.cnpjEmitente,
            emitente: parsed.nomeEmitente,
            nf: parsed.numeroNF,
            data: parsed.dataEmissao,
            placa: parsed.placaCaminhao,
            itens: parsed.itens,
          })

          // Busca fornecedor pelo CNPJ emitente (sem formatação)
          const matchedSupplier = suppliers.find(
            (s) => s.document?.replace(/\D/g, '') === parsed.cnpjEmitente
          )
          console.log(
            '[IMPORT] Fornecedor:',
            matchedSupplier?.name ?? `NÃO ENCONTRADO (CNPJ: ${parsed.cnpjEmitente})`
          )

          // Busca bloco por código ou descrição
          let matchedBlock: BlockRow | undefined
          if (matchedSupplier && parsed.itens.length > 0) {
            const item = parsed.itens[0]
            const supplierBlocks = blocks.filter((b) => b.supplier_id === matchedSupplier.id)
            console.log('[IMPORT] Blocos do fornecedor:', supplierBlocks.map((b) => b.product_name))
            matchedBlock =
              supplierBlocks.find((b) => b.product_code && b.product_code === item.codigoProduto) ??
              supplierBlocks.find((b) => descricaoMatch(b.product_name, item.descricao))
            console.log('[IMPORT] Bloco:', matchedBlock?.product_name ?? 'NÃO IDENTIFICADO')
          }

          newResults.push({
            parsed,
            supplierId: matchedSupplier?.id ?? null,
            supplierName: matchedSupplier?.name ?? null,
            blockId: matchedBlock?.id ?? null,
            blockName: matchedBlock?.product_name ?? null,
            fileName: file.name,
          })
        } catch (e) {
          console.error('[IMPORT] Erro ao processar', file.name, e)
          newResults.push({
            parsed: emptyParsed,
            supplierId: null,
            supplierName: null,
            blockId: null,
            blockName: null,
            fileName: file.name,
            error: String(e),
          })
        }
      }

      setResults(newResults)
      setDebugInfo(
        `${suppliers.length} fornecedor(es) · ${blocks.length} bloco(s) carregado(s)`
      )
    } catch (e) {
      console.error('[IMPORT] Erro global:', e)
      setGlobalError(String(e))
    } finally {
      setProcessing(false)
      console.log('[IMPORT] Processamento finalizado')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }

  const handleImport = async () => {
    setImporting(true)
    let imported = 0

    try {
      for (const r of results) {
        if (!r.blockId || r.error) continue

        const { data: block } = await supabase
          .from('supplier_blocks')
          .select('supplier_id, suppliers(company_id)')
          .eq('id', r.blockId)
          .single()

        if (!block) continue
        const companyId = (block.suppliers as unknown as Record<string, string>)?.company_id

        const { data: period } = await supabase
          .from('periods')
          .upsert(
            {
              company_id: companyId,
              year: current.year,
              month: current.month,
              half: current.half,
              label: getPeriodLabel(current.year, current.month, current.half),
            },
            { onConflict: 'company_id,year,month,half' }
          )
          .select('id')
          .single()

        if (!period) continue

        for (const item of r.parsed.itens) {
          const priceCheck = calcPriceCheck(item.valorTotal, item.quantidade)
          const { error } = await supabase.from('entries').insert({
            supplier_block_id: r.blockId,
            period_id: period.id,
            entry_date: r.parsed.dataEmissao || null,
            nf_number: r.parsed.numeroNF || null,
            truck_plate: r.parsed.placaCaminhao || null,
            weight_nf: item.quantidade || null,
            value_nf: item.valorTotal || null,
            price_check: priceCheck,
            status: 'nao_verificado',
            source: 'xml',
            raw_data: { parsed: r.parsed, item },
          })
          if (!error) imported++
          else console.error('[IMPORT] Erro ao inserir entry:', error)
        }
      }

      toast({
        title: `${imported} lançamento${imported !== 1 ? 's' : ''} importado${imported !== 1 ? 's' : ''}`,
        variant: 'success',
      })
      setOpen(false)
      setResults([])
      setGlobalError(null)
    } catch (e) {
      setGlobalError(`Erro ao importar: ${String(e)}`)
    } finally {
      setImporting(false)
    }
  }

  const readyCount = results.filter((r) => r.blockId && !r.error).length

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setResults([])
          setGlobalError(null)
          setDebugInfo(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Importar XML / NF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Notas Fiscais (XML)</DialogTitle>
        </DialogHeader>

        {/* Área de drop */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 py-8 transition-colors hover:border-brand/50 hover:bg-brand/5"
        >
          <Upload className="h-8 w-8 text-stone-400" />
          <p className="text-sm font-medium text-stone-600">
            Arraste os XMLs aqui ou clique para selecionar
          </p>
          <p className="text-xs text-stone-400">Aceita múltiplos arquivos .xml (NF-e)</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>

        {processing && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando XMLs...
          </div>
        )}

        {globalError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            {globalError}
          </div>
        )}

        {debugInfo && !processing && (
          <p className="text-xs text-stone-400">{debugInfo}</p>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-stone-200 p-3"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-stone-800 truncate">{r.fileName}</p>
                  {r.error ? (
                    <p className="text-xs text-red-600 mt-0.5">{r.error}</p>
                  ) : (
                    <>
                      <p className="text-xs text-stone-500">
                        NF {r.parsed.numeroNF}
                        {r.parsed.placaCaminhao && ` · ${r.parsed.placaCaminhao}`}
                        {' · '}
                        {r.parsed.nomeEmitente || formatCNPJ(r.parsed.cnpjEmitente)}
                        {' · '}
                        {r.parsed.dataEmissao}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {r.supplierName ? (
                          <Badge variant="green" className="text-[10px] gap-1">
                            <Check className="h-2.5 w-2.5" />
                            {r.supplierName}
                          </Badge>
                        ) : (
                          <Badge variant="red" className="text-[10px] gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {r.parsed.cnpjEmitente
                              ? `Fornecedor não encontrado: CNPJ ${formatCNPJ(r.parsed.cnpjEmitente)}${r.parsed.nomeEmitente ? ` (${r.parsed.nomeEmitente})` : ''}`
                              : 'CNPJ não identificado no XML'}
                          </Badge>
                        )}
                        {r.blockName ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {r.blockName}
                          </Badge>
                        ) : r.supplierName ? (
                          <Badge variant="amber" className="text-[10px]">
                            Bloco não identificado
                          </Badge>
                        ) : null}
                      </div>
                      {r.blockId && r.parsed.itens.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-x-4 text-[11px] text-stone-500">
                          <span>
                            Ton. NF: <strong>{r.parsed.itens[0].quantidade}</strong>
                          </span>
                          <span>
                            Valor:{' '}
                            <strong>
                              R${' '}
                              {r.parsed.itens[0].valorTotal.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </strong>
                          </span>
                          <span>
                            Placa: <strong>{r.parsed.placaCaminhao || '—'}</strong>
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-200 pt-3">
            <p className="text-sm text-stone-500">
              {readyCount} de {results.length} pronto{results.length !== 1 ? 's' : ''} para
              importar
            </p>
            <Button
              onClick={handleImport}
              disabled={readyCount === 0 || importing}
              className="gap-1.5"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Importar {readyCount} NF{readyCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

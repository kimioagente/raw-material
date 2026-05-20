import { useState, useRef } from 'react'
import { Upload, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react'
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
import { parseNFe, type ParsedNFe } from './XmlParser'
import { toast } from '@/hooks/useToast'

interface MatchResult {
  parsed: ParsedNFe
  supplierId: string | null
  supplierName: string | null
  blockId: string | null
  blockName: string | null
  periodId: string | null
  fileName: string
}

export function ImportModal() {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<MatchResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { current } = usePeriodStore()

  const processFiles = async (files: FileList) => {
    setProcessing(true)
    setResults([])

    // Load all suppliers with blocks and their CNPJs
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name, document, supplier_blocks(id, product_name, product_code)')
      .eq('active', true)

    const newResults: MatchResult[] = []

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.xml')) continue
      try {
        const text = await file.text()
        const parsed = await parseNFe(text)

        // Try to match supplier by CNPJ
        const matchedSupplier = (suppliers ?? []).find(
          (s) => s.document?.replace(/\D/g, '') === parsed.cnpjEmitente
        )

        // Try to match block by product code or description
        let matchedBlock = null
        if (matchedSupplier && parsed.itens.length > 0) {
          const item = parsed.itens[0]
          const blocks = matchedSupplier.supplier_blocks as Array<{ id: string; product_name: string; product_code: string | null }>
          matchedBlock = blocks.find(
            (b) =>
              b.product_code === item.codigoProduto ||
              b.product_name.toLowerCase().includes(item.descricao.toLowerCase().slice(0, 10))
          )
        }

        newResults.push({
          parsed,
          supplierId: matchedSupplier?.id ?? null,
          supplierName: matchedSupplier?.name ?? null,
          blockId: matchedBlock?.id ?? null,
          blockName: matchedBlock?.product_name ?? null,
          periodId: null,
          fileName: file.name,
        })
      } catch (e) {
        toast({ title: `Erro em ${file.name}`, description: String(e), variant: 'destructive' })
      }
    }

    setResults(newResults)
    setProcessing(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files)
  }

  const handleImport = async () => {
    setImporting(true)
    let imported = 0

    for (const r of results) {
      if (!r.blockId) continue

      // Find or create period for the supplier's company
      const { data: block } = await supabase
        .from('supplier_blocks')
        .select('supplier_id, suppliers(company_id)')
        .eq('id', r.blockId)
        .single()

      if (!block) continue
      const companyId = (block.suppliers as unknown as Record<string, string>)?.company_id

      // Get or create period
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
          entry_date: r.parsed.dataEmissao,
          nf_number: r.parsed.numeroNF,
          weight_nf: item.quantidade,
          value_nf: item.valorTotal,
          price_check: priceCheck,
          status: 'nao_verificado',
          source: 'xml',
          raw_data: { parsed: r.parsed, item },
        })
        if (!error) imported++
      }
    }

    toast({
      title: `${imported} lançamento${imported !== 1 ? 's' : ''} importado${imported !== 1 ? 's' : ''}`,
      variant: 'success',
    })
    setImporting(false)
    setOpen(false)
    setResults([])
  }

  const readyCount = results.filter((r) => r.blockId).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        {/* Drop zone */}
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

        {/* Results */}
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
                  <p className="text-xs text-stone-500">
                    NF {r.parsed.numeroNF} · {r.parsed.nomeEmitente} · {r.parsed.dataEmissao}
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
                        CNPJ não identificado
                      </Badge>
                    )}
                    {r.blockName ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {r.blockName}
                      </Badge>
                    ) : r.supplierName ? (
                      <Badge variant="amber" className="text-[10px]">Bloco não identificado</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-200 pt-3">
            <p className="text-sm text-stone-500">
              {readyCount} de {results.length} pronto{results.length !== 1 ? 's' : ''} para importar
            </p>
            <Button
              onClick={handleImport}
              disabled={readyCount === 0 || importing}
              className="gap-1.5"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Importando...</>
              ) : (
                <><Check className="h-4 w-4" />Importar {readyCount} NF{readyCount !== 1 ? 's' : ''}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

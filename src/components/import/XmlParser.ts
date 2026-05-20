import { parseString } from 'xml2js'

export interface ParsedNFe {
  cnpjEmitente: string
  nomeEmitente: string
  numeroNF: string
  dataEmissao: string
  itens: ParsedItem[]
  valorTotal: number
}

export interface ParsedItem {
  codigoProduto: string
  descricao: string
  quantidade: number
  valorTotal: number
}

function safeGet(obj: unknown, ...keys: (string | number)[]): unknown {
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string | number, unknown>)[k]
  }
  return cur
}

function firstVal(v: unknown): string {
  if (Array.isArray(v)) return firstVal(v[0])
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null) {
    const entry = Object.values(v as Record<string, unknown>)[0]
    return firstVal(entry)
  }
  return String(v ?? '')
}

export function parseNFe(xmlString: string): Promise<ParsedNFe> {
  return new Promise((resolve, reject) => {
    parseString(xmlString, { explicitArray: true, trim: true }, (err, result) => {
      if (err) return reject(new Error('XML inválido: ' + err.message))

      try {
        const root = result?.nfeProc ?? result?.NFe ?? result
        const nfe = safeGet(root, 'NFe', 0) ?? root?.NFe
        const infNFe = safeGet(nfe, 'infNFe', 0) ?? safeGet(root, 'infNFe', 0)

        if (!infNFe) return reject(new Error('Estrutura NF-e não reconhecida'))

        const emit = safeGet(infNFe, 'emit', 0) as Record<string, unknown>
        const ide = safeGet(infNFe, 'ide', 0) as Record<string, unknown>
        const total = safeGet(infNFe, 'total', 0) as Record<string, unknown>
        const detArr = (safeGet(infNFe, 'det') as unknown[]) ?? []

        const cnpj = firstVal(safeGet(emit, 'CNPJ', 0) ?? safeGet(emit, 'CNPJ'))
        const nome = firstVal(safeGet(emit, 'xNome', 0) ?? safeGet(emit, 'xNome'))
        const nNF = firstVal(safeGet(ide, 'nNF', 0) ?? safeGet(ide, 'nNF'))
        const dhEmi = firstVal(safeGet(ide, 'dhEmi', 0) ?? safeGet(ide, 'dEmi', 0) ?? safeGet(ide, 'dhEmi'))
        const vNF = firstVal(safeGet(total, 'ICMSTot', 0, 'vNF', 0) ?? safeGet(total, 'ICMSTot', 'vNF'))

        const itens: ParsedItem[] = detArr.map((det: unknown) => {
          const d = det as Record<string, unknown>
          const prod = (safeGet(d, 'prod', 0) ?? safeGet(d, 'prod')) as Record<string, unknown>
          return {
            codigoProduto: firstVal(safeGet(prod, 'cProd', 0) ?? ''),
            descricao: firstVal(safeGet(prod, 'xProd', 0) ?? ''),
            quantidade: parseFloat(firstVal(safeGet(prod, 'qCom', 0) ?? '0')) || 0,
            valorTotal: parseFloat(firstVal(safeGet(prod, 'vProd', 0) ?? '0')) || 0,
          }
        })

        // Parse date — handles 2024-01-15T... or 2024-01-15
        const dateStr = dhEmi.includes('T') ? dhEmi.split('T')[0] : dhEmi.slice(0, 10)

        resolve({
          cnpjEmitente: cnpj.replace(/\D/g, ''),
          nomeEmitente: nome,
          numeroNF: nNF,
          dataEmissao: dateStr,
          itens,
          valorTotal: parseFloat(vNF) || 0,
        })
      } catch (e) {
        reject(new Error('Erro ao interpretar NF-e: ' + String(e)))
      }
    })
  })
}

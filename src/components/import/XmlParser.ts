export interface ParsedNFe {
  cnpjEmitente: string
  nomeEmitente: string
  cnpjDestinatario: string
  numeroNF: string
  dataEmissao: string
  placaCaminhao: string
  itens: ParsedItem[]
  valorTotal: number
}

export interface ParsedItem {
  codigoProduto: string
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

// '*' como namespace URI combina elementos em qualquer namespace,
// incluindo o namespace padrão do NF-e (xmlns="http://www.portalfiscal.inf.br/nfe")
function getEl(parent: Document | Element, tag: string): Element | null {
  return parent.getElementsByTagNameNS('*', tag)[0] ?? null
}

function getText(parent: Document | Element, tag: string): string {
  return getEl(parent, tag)?.textContent?.trim() ?? ''
}

export function formatCNPJ(cnpj: string): string {
  const d = cnpj.replace(/\D/g, '')
  if (d.length !== 14) return cnpj
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function parseNFe(xmlString: string): Promise<ParsedNFe> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlString, 'text/xml')

      // Detecta erro de parse (Firefox e Chrome têm formatos diferentes)
      if (
        doc.documentElement.tagName === 'parsererror' ||
        doc.documentElement.getElementsByTagName('parsererror').length > 0
      ) {
        const msg = doc.documentElement.textContent ?? 'XML malformado'
        return reject(new Error('XML inválido: ' + msg.slice(0, 200)))
      }

      const infNFe = getEl(doc, 'infNFe')
      if (!infNFe) {
        return reject(new Error('Estrutura NF-e não reconhecida — tag infNFe não encontrada'))
      }

      const emit = getEl(infNFe, 'emit')
      const ide = getEl(infNFe, 'ide')
      const dest = getEl(infNFe, 'dest')
      const transp = getEl(infNFe, 'transp')

      if (!emit || !ide) {
        return reject(new Error('NF-e incompleta: emit ou ide não encontrado'))
      }

      const cnpjEmitente = getText(emit, 'CNPJ').replace(/\D/g, '')
      const nomeEmitente = getText(emit, 'xNome')
      const cnpjDestinatario = dest ? getText(dest, 'CNPJ').replace(/\D/g, '') : ''
      const nNF = getText(ide, 'nNF')
      const dhEmi = getText(ide, 'dhEmi') || getText(ide, 'dEmi')

      // Placa do caminhão: transp > veicTransp > placa
      const veicTransp = transp ? getEl(transp, 'veicTransp') : null
      const placa = veicTransp ? getText(veicTransp, 'placa') : ''

      // Valor total da NF
      const icmsTot = getEl(infNFe, 'ICMSTot')
      const vNF = icmsTot ? getText(icmsTot, 'vNF') : ''

      // Itens (det)
      const detElements = infNFe.getElementsByTagNameNS('*', 'det')
      const itens: ParsedItem[] = Array.from(detElements).map((det) => ({
        codigoProduto: getText(det, 'cProd'),
        descricao: getText(det, 'xProd'),
        quantidade: parseFloat(getText(det, 'qCom')) || 0,
        valorUnitario: parseFloat(getText(det, 'vUnCom')) || 0,
        valorTotal: parseFloat(getText(det, 'vProd')) || 0,
      }))

      // Data: "2026-05-19T10:28:00-03:00" → "2026-05-19"
      const dateStr = dhEmi.includes('T') ? dhEmi.split('T')[0] : dhEmi.slice(0, 10)

      console.log('[NF-e PARSE]', {
        cnpjEmitente,
        nomeEmitente,
        nNF,
        data: dateStr,
        placa,
        itens,
      })

      resolve({
        cnpjEmitente,
        nomeEmitente,
        cnpjDestinatario,
        numeroNF: nNF,
        dataEmissao: dateStr,
        placaCaminhao: placa,
        itens,
        valorTotal: parseFloat(vNF) || 0,
      })
    } catch (e) {
      reject(new Error('Erro ao interpretar NF-e: ' + String(e)))
    }
  })
}

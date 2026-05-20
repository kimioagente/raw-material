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

function getEl(parent: Document | Element, tag: string): Element | null {
  return parent.getElementsByTagName(tag)[0] ?? null
}

function getText(parent: Document | Element, tag: string): string {
  return getEl(parent, tag)?.textContent?.trim() ?? ''
}

export function parseNFe(xmlString: string): Promise<ParsedNFe> {
  return new Promise((resolve, reject) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlString, 'text/xml')

      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        return reject(new Error('XML inválido: ' + (parseError.textContent ?? '').slice(0, 200)))
      }

      const infNFe = getEl(doc, 'infNFe')
      if (!infNFe) {
        return reject(new Error('Estrutura NF-e não reconhecida — tag infNFe não encontrada'))
      }

      const emit = getEl(infNFe, 'emit')
      const ide = getEl(infNFe, 'ide')

      if (!emit || !ide) {
        return reject(new Error('Estrutura NF-e incompleta: emit ou ide não encontrado'))
      }

      const cnpj = getText(emit, 'CNPJ')
      const nome = getText(emit, 'xNome')
      const nNF = getText(ide, 'nNF')
      const dhEmi = getText(ide, 'dhEmi') || getText(ide, 'dEmi')

      const icmsTot = getEl(infNFe, 'ICMSTot')
      const vNF = icmsTot ? getText(icmsTot, 'vNF') : ''

      const detElements = infNFe.getElementsByTagName('det')
      const itens: ParsedItem[] = Array.from(detElements).map((det) => ({
        codigoProduto: getText(det, 'cProd'),
        descricao: getText(det, 'xProd'),
        quantidade: parseFloat(getText(det, 'qCom')) || 0,
        valorTotal: parseFloat(getText(det, 'vProd')) || 0,
      }))

      const dateStr = dhEmi.includes('T') ? dhEmi.split('T')[0] : dhEmi.slice(0, 10)

      console.log('[XML PARSE] CNPJ:', cnpj, '| NF:', nNF, '| Emitente:', nome, '| Itens:', itens.length, itens)

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
}

# Prompt para Claude Code — Sistema MatériaPrima

Cole este prompt inteiro no Claude Code para iniciar o projeto.

---

## PROMPT

Crie um sistema web completo chamado **MatériaPrima** para controle de entrada de matéria-prima de duas empresas: **Madeiras Rodrigues** e **Pellets Rodrigues**.

---

## STACK

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (estado global)
- Supabase (PostgreSQL + Auth + Storage)
- xml2js (parse de XML NF-e no browser)
- Vercel (deploy)

---

## IDENTIDADE VISUAL

- Cor primária: `#1a5c35` (verde-florestal)
- Estilo: clean, sofisticado, denso sem ser pesado
- Tipografia refinada (não usar Inter ou Arial — usar fonte com caráter)
- Modo claro por padrão, preparado para dark mode
- Sem gradientes excessivos, sem sombras pesadas
- Ícones: Lucide React

---

## EMPRESAS

```
ID: madeiras → Madeiras Rodrigues
ID: pellets  → Pellets Rodrigues
```

---

## FORNECEDORES E PRODUTOS

### Madeiras Rodrigues

#### 1. Fazenda Estrela – RS (Nereu Rodrigues / Xiel Ltda)
- **Período:** quinzenal
- **Blocos (classificações de tora):** 4 a 5 — configuráveis pelo usuário
  - Cada bloco tem: código do produto, descrição, preço R$/ton
  - Ex: `22.244 · Toras Pinus Taeda RS – CL 1, 35 à 50cm · R$ 254,96/ton`
- **Colunas por bloco:**
  - Data | Caminhão | Ton. Balança *(manual — fica vazio no import)* | Nº NF | Ton. NF | Valor NF | Diferença *(balança − NF)* | Verificação *(valor ÷ ton NF)*
- **Totais:** por bloco + total geral da quinzena
- **Complemento:** linha de complemento por bloco (valor R$)
- **Frete:** Fórmula Florestal Ltda *(planilha separada — ver seção FRETE)*
- **Obs:** parte do transporte é feito por empresas do grupo (Irmãos Rodrigues / Nereu Rodrigues) — sem controle de frete nesses casos

#### 2. Florestal Gateados S/A
- **Período:** quinzenal
- **Blocos:** 3 classificações de tora — configuráveis
- **Colunas:** Data | Caminhão | Ton. Peso | Nº NF | Ton. NF | Valor NF | Diferença | Verificação
- **Totais por bloco + geral**
- **Complemento:** por bloco

#### 3. Agroflorestal Paequere Ltda
- **Período:** quinzenal
- **Blocos:** 3 classificações de tora — configuráveis
- **Colunas:** Data | Caminhão | Ton. Peso | Nº NF | Ton. NF | Valor NF | Diferença | Verificação
- **Totais por bloco + geral**
- **Complemento:** por bloco

#### 4. Klabin S/A – Correia Pinto
- **Período:** MENSAL (exceção — não quinzenal)
- **Blocos:** 1 classificação de tora
  - Ex: `Toras 18cm acima (desclassificado) · R$ 270,97/ton`
- **Colunas:** Data | Caminhão | Ton. Fab. | Nº NF | Ton. NF | Valor NF | Diferença | Conferência
- **Campo extra:** Vencimento (ex: "10 dias")
- **Totais:** Total toneladas + Total geral R$

---

### Pellets Rodrigues

#### 5. Borges Indústria de Madeiras Ltda
- **Período:** quinzenal
- **Blocos:** 2 produtos — Cavaco e Serragem
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença | Verificação
- **Complemento:** por bloco
- **Frete:** Edson Lopes Martins *(planilha separada — ver seção FRETE)*

#### 6. Pinheirinho Madeiras Ltda
- **Período:** quinzenal
- **Blocos:** 1 produto — Serragem
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença
- **Complemento:** linha de complemento
- **Frete:** Frete Pinheirinho *(a própria Pinheirinho faz o frete — planilha separada)*

#### 7. Alcione Diniz Piola
- **Período:** quinzenal
- **Blocos:** 1 produto — Cavaco
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença
- **Obs:** mesmo caminhão entrega múltiplas vezes por dia

#### 8. ABB Wood Brazil Ltda
- **Período:** quinzenal
- **Blocos:** 2 sub-blocos de Serragem:
  - Serragem — caminhão próprio
  - Serragem — transportado por terceiro (BBV Transportes)
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença
- **Complemento:** linha por bloco
- **Frete:** BBV Transportes *(apenas para o sub-bloco de terceiros — planilha separada)*
- **Obs:** parte transportada por Irmãos Rodrigues Transportes (empresa do grupo) — sem controle de frete

#### 9. Madeireira Madesserra Ltda
- **Período:** quinzenal
- **Blocos:** 2 produtos — Cavaco e Serragem
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença
- **Sumarização final:** CAVACO (ton) + SERRAGEM (ton) + TOTAL + TOTAL R$
- **Complemento:** por bloco

#### 10. JJ Thomazi & Cia Ltda
- **Período:** quinzenal
- **Blocos:** 1 produto — Farelo de Pinus
- **Colunas:** Data | Caminhão | Ton. | Nº NF | Ton. NF | Preço | Diferença | Verificação
- **Status por linha:** Verificado / Não verificado
- **Complemento:** linha de complemento + TOTAL

---

## CONTROLE DE FRETE

Planilhas separadas por empresa e por período. Cada freteiro tem suas particularidades.

### Frete — Madeiras Rodrigues

#### Fórmula Florestal Ltda (transporta toras da Faz. Estrela)
- **Colunas:** Data | Caminhão | Peso | Nº NF | Peso NF | Nº CTE | Valor R$
- **Cálculo:** R$/ton × toneladas
- **Agrupamento:** por origem (Faz. Estrela – RS)

### Frete — Pellets Rodrigues

#### Edson Lopes Martins (transporta Borges Madeiras)
- **Colunas:** Data | Caminhão | Peso | Nº NF
- **Agrupamento:** por origem (Borges Madeiras)
- **Particularidades:**
  - Subtotal por origem: toneladas × R$/ton
  - **Desconto de casca** (valor R$ a deduzir)
  - **Seção de abastecimentos:** Data | Placa | Quant. | Preço (diesel + Arla 32)
  - Total geral = frete − desconto casca − valor diesel

#### BBV Transportes (transporta ABB Wood — sub-bloco terceiros)
- **Colunas:** Data | Caminhão | Peso | Nº NF
- **Agrupamento:** por origem (Santa Cecilia, etc.)
- **Cálculo:** toneladas × R$/ton por origem
- **Total geral R$**

#### Frete Pinheirinho (a própria Pinheirinho faz seu frete)
- **Colunas:** Data | Caminhão | Peso | Nº NF
- **Agrupamento:** Pinheirinho
- **Cálculo:** toneladas × R$/ton
- **Total R$**

---

## BANCO DE DADOS (Supabase)

```sql
-- Empresas
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- 'madeiras' | 'pellets'
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  document TEXT, -- CNPJ
  period_type TEXT DEFAULT 'quinzenal', -- 'quinzenal' | 'mensal'
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blocos de produto por fornecedor
CREATE TABLE supplier_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_code TEXT,          -- ex: '22.244'
  product_name TEXT NOT NULL, -- ex: 'Toras Pinus Taeda RS – CL 1, 35 à 50cm'
  material_type TEXT,         -- 'toras' | 'cavaco' | 'serragem' | 'farelo_pinus'
  price_per_ton NUMERIC(10,2),
  column_config JSONB,        -- colunas visíveis e ordem
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Períodos
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INT NOT NULL,
  month INT NOT NULL,         -- 1-12
  half SMALLINT,              -- 1 ou 2 (NULL = mensal)
  label TEXT NOT NULL,        -- '1ª QUINZ. MAIO / 2026'
  status TEXT DEFAULT 'open', -- 'open' | 'closed'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, year, month, half)
);

-- Lançamentos (linhas das tabelas)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_block_id UUID REFERENCES supplier_blocks(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id),
  entry_date DATE,
  truck_plate TEXT,
  weight_scale NUMERIC(10,3),   -- ton. balança (manual)
  nf_number TEXT,
  weight_nf NUMERIC(10,3),      -- ton. NF
  value_nf NUMERIC(12,2),       -- valor R$
  difference NUMERIC(10,3) GENERATED ALWAYS AS (weight_scale - weight_nf) STORED,
  price_check NUMERIC(10,2),    -- value_nf / weight_nf (calculado no app)
  status TEXT DEFAULT 'pendente', -- 'verificado' | 'nao_verificado' | 'pendente'
  source TEXT DEFAULT 'manual',   -- 'manual' | 'xml' | 'pdf'
  raw_data JSONB,               -- dados brutos do import
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Complementos por bloco/período
CREATE TABLE complements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_block_id UUID REFERENCES supplier_blocks(id),
  period_id UUID REFERENCES periods(id),
  value NUMERIC(12,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Frete
CREATE TABLE freight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  period_id UUID REFERENCES periods(id),
  carrier_name TEXT NOT NULL,   -- 'Formula Florestal' | 'Edson Lopes' | 'BBV' | 'Pinheirinho'
  route TEXT,                   -- origem/destino
  entry_date DATE,
  truck_plate TEXT,
  weight_scale NUMERIC(10,3),
  nf_number TEXT,
  weight_nf NUMERIC(10,3),
  cte_number TEXT,
  value NUMERIC(12,2),
  extra_data JSONB,             -- descontos, diesel, arla, abastecimentos
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploads de documentos
CREATE TABLE document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  period_id UUID REFERENCES periods(id),
  supplier_id UUID REFERENCES suppliers(id),
  file_type TEXT,    -- 'xml' | 'pdf'
  file_name TEXT,
  file_url TEXT,
  parsed_data JSONB,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processed' | 'error'
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  role TEXT DEFAULT 'viewer', -- 'admin' | 'viewer'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Ativar RLS em todas as tabelas. Usuários autenticados leem tudo. Apenas `admin` pode inserir/editar/deletar.

---

## TELAS E NAVEGAÇÃO

```
/ (login)
  └─ /app
       ├─ /app/madeiras                    ← Madeiras Rodrigues
       │    ├─ /app/madeiras/[supplierId]  ← Fornecedor específico
       │    └─ /app/madeiras/frete         ← Controle de frete
       └─ /app/pellets                     ← Pellets Rodrigues
            ├─ /app/pellets/[supplierId]
            └─ /app/pellets/frete
```

### Tela inicial (/)
- Login com email + senha (Supabase Auth)

### Tela /app (home)
- Dois cards grandes: Madeiras Rodrigues e Pellets Rodrigues
- Seletor de período (quinzena/mês) no topo — global
- Botão "Importar XML / NF" — abre modal de upload

### Tela /app/[empresa]
- Seletor de período no topo
- Cards dos fornecedores ativos com:
  - Nome, materiais, total de lançamentos, total toneladas, status (pendentes/verificados)
- Badge de alertas (lançamentos não verificados)
- Botão "Controle de Frete"

### Tela /app/[empresa]/[supplierId]
- Header: nome do fornecedor, período, empresa
- Para cada bloco de produto:
  - Label do bloco com produto, código e preço/ton
  - Tabela editável inline com as colunas configuradas
  - Linhas importadas via XML destacadas (status "não verificado")
  - Linha de complemento ao final
  - Linha de totais (balança, NF, valor, diferença)
- Botão "Nova linha" por bloco
- Botão "Solicitar complemento"
- Botão "Exportar Excel"
- Para Klabin: mostrar campo "Vencimento" no header

### Tela /app/[empresa]/frete
- Abas por transportadora
- Tabela de lançamentos de frete
- Seções extras (ex: Edson Lopes: abastecimentos, desconto casca)
- Totais e resumo por período

### Tela /app/settings (admin only)
- Cadastro/edição de fornecedores
- Configuração de blocos (produtos, preços, colunas)
- Gestão de usuários (nome, email, role)
- Configuração de transportadoras e rotas de frete

---

## FLUXO DE IMPORT XML NF-e

```
1. Usuário clica "Importar XML / NF"
2. Modal abre — aceita XML ou PDF
3. Parse do XML no browser (xml2js):
   - Extrai: CNPJ emitente, data emissão, nº NF,
             itens (código produto, descrição, quantidade, valor)
4. Identifica fornecedor via CNPJ emitente
5. Identifica bloco via código/descrição do produto
6. Se não identificar → mostra modal de seleção manual
7. Cria entry com:
   - weight_scale = null (vazio — usuário preenche manualmente)
   - status = 'nao_verificado'
   - source = 'xml'
   - raw_data = dados brutos do XML
8. Linha aparece destacada na tabela (fundo âmbar)
9. Usuário preenche "Ton. Balança" manualmente
10. Usuário clica "Verificar" → status = 'verificado'
```

---

## REGRAS DE NEGÓCIO

1. **Diferença** = Ton. Balança − Ton. NF (negativo = NF maior que balança)
2. **Verificação de preço** = Valor NF ÷ Ton. NF (deve conferir com preço cadastrado)
3. **Ton. Balança** NUNCA vem no XML — sempre preenchimento manual obrigatório
4. **Status "Não verificado"** = importado via XML, aguardando conferência da balança
5. **Complemento** = diferença acumulada na quinzena × preço/ton → nota a emitir/receber
6. **Período quinzenal:** 1ª quinzena = dias 1-15 / 2ª quinzena = dias 16-fim do mês
7. **Klabin** = período mensal (campo `half = NULL`)
8. **Colunas configuráveis** por bloco via `column_config JSONB` — admin pode mostrar/ocultar colunas
9. **Preços** podem mudar por quinzena — armazenados no bloco, histórico mantido via `entries.raw_data`

---

## COMPONENTES PRINCIPAIS A CRIAR

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          ← nav + sidebar
│   │   ├── PeriodSelector.tsx    ← seletor quinzena/mês global
│   │   └── CompanyTabs.tsx
│   ├── suppliers/
│   │   ├── SupplierCard.tsx      ← card na lista
│   │   ├── SupplierGrid.tsx      ← grid de cards
│   │   └── SupplierDetail.tsx    ← tela do fornecedor
│   ├── blocks/
│   │   ├── MaterialBlock.tsx     ← bloco de produto (label + tabela + totais)
│   │   ├── EntryTable.tsx        ← tabela editável inline
│   │   ├── EntryRow.tsx          ← linha individual (editável)
│   │   └── ComplementRow.tsx     ← linha de complemento
│   ├── freight/
│   │   ├── FreightPanel.tsx      ← painel de frete por empresa
│   │   ├── FreightTable.tsx      ← tabela de frete
│   │   └── EdsonLopesExtras.tsx  ← seção diesel/casca especial
│   ├── import/
│   │   ├── ImportModal.tsx       ← modal de upload
│   │   ├── XmlParser.ts          ← parse do XML NF-e
│   │   └── ImportReview.tsx      ← revisão antes de confirmar
│   └── settings/
│       ├── SupplierForm.tsx
│       ├── BlockForm.tsx
│       └── UserManagement.tsx
├── stores/
│   ├── periodStore.ts            ← período selecionado global
│   ├── companyStore.ts
│   └── entryStore.ts
├── lib/
│   ├── supabase.ts
│   └── calculations.ts           ← diferença, verificação, totais
└── pages/
    ├── Login.tsx
    ├── Home.tsx
    ├── CompanyPage.tsx
    ├── SupplierPage.tsx
    ├── FreightPage.tsx
    └── SettingsPage.tsx
```

---

## SEED INICIAL (dados de exemplo)

Inserir no Supabase após criar as tabelas:

```sql
-- Empresas
INSERT INTO companies (name, slug) VALUES
  ('Madeiras Rodrigues', 'madeiras'),
  ('Pellets Rodrigues', 'pellets');

-- Fornecedores Madeiras Rodrigues
INSERT INTO suppliers (company_id, name, document, period_type, display_order)
SELECT c.id, s.name, s.doc, s.period, s.ord
FROM companies c,
(VALUES
  ('Fazenda Estrela – RS (Nereu/Xiel)', '00.000.000/0001-00', 'quinzenal', 1),
  ('Florestal Gateados S/A',            '00.000.000/0002-00', 'quinzenal', 2),
  ('Agroflorestal Paequere Ltda',       '00.000.000/0003-00', 'quinzenal', 3),
  ('Klabin S/A – Correia Pinto',        '00.000.000/0004-00', 'mensal',    4)
) AS s(name, doc, period, ord)
WHERE c.slug = 'madeiras';

-- Fornecedores Pellets Rodrigues
INSERT INTO suppliers (company_id, name, document, period_type, display_order)
SELECT c.id, s.name, s.doc, s.period, s.ord
FROM companies c,
(VALUES
  ('Borges Indústria de Madeiras Ltda', '00.000.000/0005-00', 'quinzenal', 1),
  ('Pinheirinho Madeiras Ltda',         '00.000.000/0006-00', 'quinzenal', 2),
  ('Alcione Diniz Piola',               '00.000.000/0007-00', 'quinzenal', 3),
  ('ABB Wood Brazil Ltda',              '00.000.000/0008-00', 'quinzenal', 4),
  ('Madeireira Madesserra Ltda',        '00.000.000/0009-00', 'quinzenal', 5),
  ('JJ Thomazi & Cia Ltda',            '00.000.000/0010-00', 'quinzenal', 6)
) AS s(name, doc, period, ord)
WHERE c.slug = 'pellets';
```

*(Substituir CNPJs pelos reais após obter do cadastro)*

---

## INSTRUÇÕES PARA O CLAUDE CODE

1. **Iniciar pelo Supabase:** criar projeto, rodar o SQL acima, configurar Auth
2. **Setup do projeto:** `npm create vite@latest materia-prima -- --template react-ts`
3. **Instalar dependências:** tailwindcss, shadcn/ui, zustand, @supabase/supabase-js, xml2js, lucide-react
4. **Criar `.env`:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
5. **Implementar na ordem:** Auth → Home → CompanyPage → SupplierPage → EntryTable → ImportModal → FreightPage → Settings
6. **A tabela `EntryRow` deve ser editável inline** — clicar na célula abre input, Tab navega entre células, Enter confirma
7. **Cálculos em tempo real** — diferença e verificação de preço calculados automaticamente ao editar
8. **Destacar linhas não verificadas** com fundo âmbar (`bg-amber-50`) e badge "Não verificado"
9. **Totais** recalculados automaticamente a cada alteração
10. **Exportar Excel** usando `xlsx` library (SheetJS)

---

*Documento gerado em 19/05/2026 — Use este prompt integralmente no Claude Code*

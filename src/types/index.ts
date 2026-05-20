export interface Company {
  id: string
  name: string
  slug: 'madeiras' | 'pellets'
  logo_url: string | null
  created_at: string
}

export interface Supplier {
  id: string
  company_id: string
  name: string
  document: string | null
  period_type: 'quinzenal' | 'mensal'
  display_order: number
  active: boolean
  created_at: string
}

export interface ColumnConfig {
  weightScaleLabel: string
  showPriceCheck: boolean
  priceCheckLabel: string
  showLineStatus: boolean
  showDueDate: boolean
}

export interface SupplierBlock {
  id: string
  supplier_id: string
  product_code: string | null
  product_name: string
  material_type: string | null
  price_per_ton: number | null
  column_config: ColumnConfig
  display_order: number
  active: boolean
  created_at: string
}

export interface Period {
  id: string
  company_id: string
  year: number
  month: number
  half: 1 | 2 | null
  label: string
  status: 'open' | 'closed'
  created_at: string
}

export interface Entry {
  id: string
  supplier_block_id: string
  period_id: string
  entry_date: string | null
  truck_plate: string | null
  weight_scale: number | null
  nf_number: string | null
  weight_nf: number | null
  value_nf: number | null
  difference: number | null
  price_check: number | null
  status: 'verificado' | 'nao_verificado' | 'pendente'
  source: 'manual' | 'xml' | 'pdf'
  due_date_info: string | null
  raw_data: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Complement {
  id: string
  supplier_block_id: string
  period_id: string
  value: number
  note: string | null
  created_at: string
}

export interface FreightRecord {
  id: string
  company_id: string
  period_id: string
  carrier_name: string
  route: string | null
  entry_date: string | null
  truck_plate: string | null
  weight_scale: number | null
  nf_number: string | null
  weight_nf: number | null
  cte_number: string | null
  value: number | null
  extra_data: Record<string, unknown>
  created_at: string
}

export interface Profile {
  id: string
  name: string | null
  role: 'admin' | 'viewer'
  created_at: string
}

export interface PeriodRef {
  year: number
  month: number
  half: 1 | 2 | null
}

export type CompanySlug = 'madeiras' | 'pellets'

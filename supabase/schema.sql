-- ============================================================
-- MatériaPrima — Schema Supabase
-- Execute no SQL Editor do Supabase (https://app.supabase.com)
-- ============================================================

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document TEXT,
  period_type TEXT DEFAULT 'quinzenal' CHECK (period_type IN ('quinzenal', 'mensal')),
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supplier blocks (product classifications)
CREATE TABLE IF NOT EXISTS supplier_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_code TEXT,
  product_name TEXT NOT NULL,
  material_type TEXT,
  price_per_ton NUMERIC(10,2),
  column_config JSONB DEFAULT '{}',
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Periods (quinzenal or mensal)
CREATE TABLE IF NOT EXISTS periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  half SMALLINT CHECK (half IN (1, 2)),
  label TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, year, month, half)
);

-- Entries (individual delivery records)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_block_id UUID REFERENCES supplier_blocks(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  entry_date DATE,
  truck_plate TEXT,
  weight_scale NUMERIC(10,3),
  nf_number TEXT,
  weight_nf NUMERIC(10,3),
  value_nf NUMERIC(12,2),
  difference NUMERIC(10,3) GENERATED ALWAYS AS (
    COALESCE(weight_scale, 0) - COALESCE(weight_nf, 0)
  ) STORED,
  price_check NUMERIC(10,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('verificado', 'nao_verificado', 'pendente')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'xml', 'pdf')),
  due_date_info TEXT,
  raw_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Complements per block/period
CREATE TABLE IF NOT EXISTS complements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_block_id UUID REFERENCES supplier_blocks(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  value NUMERIC(12,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_block_id, period_id)
);

-- Freight records
CREATE TABLE IF NOT EXISTS freight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  period_id UUID REFERENCES periods(id) ON DELETE CASCADE,
  carrier_name TEXT NOT NULL,
  route TEXT,
  entry_date DATE,
  truck_plate TEXT,
  weight_scale NUMERIC(10,3),
  nf_number TEXT,
  weight_nf NUMERIC(10,3),
  cte_number TEXT,
  value NUMERIC(12,2),
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Document uploads
CREATE TABLE IF NOT EXISTS document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  period_id UUID REFERENCES periods(id),
  supplier_id UUID REFERENCES suppliers(id),
  file_type TEXT CHECK (file_type IN ('xml', 'pdf')),
  file_name TEXT,
  file_url TEXT,
  parsed_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE complements ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- SELECT: all authenticated users can read everything
CREATE POLICY "auth_select_companies" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_supplier_blocks" ON supplier_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_periods" ON periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_entries" ON entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_complements" ON complements FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_freight_records" ON freight_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_document_uploads" ON document_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_select_profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- WRITE: admin only for config tables
CREATE POLICY "admin_write_companies" ON companies FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "admin_write_suppliers" ON suppliers FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "admin_write_supplier_blocks" ON supplier_blocks FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- WRITE: authenticated for operational tables
CREATE POLICY "auth_write_periods" ON periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_entries" ON entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_complements" ON complements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_freight" ON freight_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_write_uploads" ON document_uploads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles: users manage own, admin manages all
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "admin_write_profiles" ON profiles FOR UPDATE TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO companies (name, slug) VALUES
  ('Madeiras Rodrigues', 'madeiras'),
  ('Pellets Rodrigues', 'pellets')
ON CONFLICT (slug) DO NOTHING;

-- Suppliers for Madeiras Rodrigues
INSERT INTO suppliers (company_id, name, document, period_type, display_order)
SELECT c.id, s.name, s.doc, s.period, s.ord
FROM companies c,
(VALUES
  ('Fazenda Estrela – RS (Nereu/Xiel)', '00.000.000/0001-00', 'quinzenal', 1),
  ('Florestal Gateados S/A',            '00.000.000/0002-00', 'quinzenal', 2),
  ('Agroflorestal Paequere Ltda',       '00.000.000/0003-00', 'quinzenal', 3),
  ('Klabin S/A – Correia Pinto',        '00.000.000/0004-00', 'mensal',    4)
) AS s(name, doc, period, ord)
WHERE c.slug = 'madeiras'
ON CONFLICT DO NOTHING;

-- Suppliers for Pellets Rodrigues
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
WHERE c.slug = 'pellets'
ON CONFLICT DO NOTHING;

-- Default blocks for Fazenda Estrela
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, 'toras', b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('22.244', 'Toras Pinus Taeda RS – CL 1, 35 à 50cm', '254.96',
   '{"weightScaleLabel":"Ton. Balança","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('22.245', 'Toras Pinus Taeda RS – CL 2, 25 à 34cm', '230.00',
   '{"weightScaleLabel":"Ton. Balança","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2)
) AS b(code, name, price, cfg, ord)
WHERE s.name = 'Fazenda Estrela – RS (Nereu/Xiel)'
ON CONFLICT DO NOTHING;

-- Default block for Klabin
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, '99.001', 'Toras 18cm acima (desclassificado)', 'toras', 270.97,
  '{"weightScaleLabel":"Ton. Fab.","showPriceCheck":true,"priceCheckLabel":"Conferência","showLineStatus":false,"showDueDate":true}'::JSONB, 1
FROM suppliers s WHERE s.name = 'Klabin S/A – Correia Pinto'
ON CONFLICT DO NOTHING;

-- Default blocks for Borges (Cavaco + Serragem)
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, b.mat, b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('B.001', 'Cavaco', 'cavaco', '80.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('B.002', 'Serragem', 'serragem', '60.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2)
) AS b(code, name, mat, price, cfg, ord)
WHERE s.name = 'Borges Indústria de Madeiras Ltda'
ON CONFLICT DO NOTHING;

-- Default block for Pinheirinho
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, 'P.001', 'Serragem', 'serragem', 55.00,
  '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}'::JSONB, 1
FROM suppliers s WHERE s.name = 'Pinheirinho Madeiras Ltda'
ON CONFLICT DO NOTHING;

-- Default block for Alcione
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, 'A.001', 'Cavaco', 'cavaco', 75.00,
  '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}'::JSONB, 1
FROM suppliers s WHERE s.name = 'Alcione Diniz Piola'
ON CONFLICT DO NOTHING;

-- Default blocks for ABB Wood
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, 'serragem', b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('ABB.001', 'Serragem – Caminhão Próprio', '58.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('ABB.002', 'Serragem – BBV Transportes', '58.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2)
) AS b(code, name, price, cfg, ord)
WHERE s.name = 'ABB Wood Brazil Ltda'
ON CONFLICT DO NOTHING;

-- Default blocks for Madesserra
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, b.mat, b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('M.001', 'Cavaco', 'cavaco', '78.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('M.002', 'Serragem', 'serragem', '56.00',
   '{"weightScaleLabel":"Ton.","showPriceCheck":false,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2)
) AS b(code, name, mat, price, cfg, ord)
WHERE s.name = 'Madeireira Madesserra Ltda'
ON CONFLICT DO NOTHING;

-- Default block for JJ Thomazi
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, 'JJ.001', 'Farelo de Pinus', 'farelo_pinus', 45.00,
  '{"weightScaleLabel":"Ton.","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":true,"showDueDate":false}'::JSONB, 1
FROM suppliers s WHERE s.name = 'JJ Thomazi & Cia Ltda'
ON CONFLICT DO NOTHING;

-- Default blocks for Florestal Gateados
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, 'toras', b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('FG.001', 'Toras Pinus – CL 1', '260.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('FG.002', 'Toras Pinus – CL 2', '235.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2),
  ('FG.003', 'Toras Pinus – CL 3', '210.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 3)
) AS b(code, name, price, cfg, ord)
WHERE s.name = 'Florestal Gateados S/A'
ON CONFLICT DO NOTHING;

-- Default blocks for Agroflorestal Paequere
INSERT INTO supplier_blocks (supplier_id, product_code, product_name, material_type, price_per_ton, column_config, display_order)
SELECT s.id, b.code, b.name, 'toras', b.price, b.cfg::JSONB, b.ord
FROM suppliers s,
(VALUES
  ('AP.001', 'Toras Pinus – CL 1', '255.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 1),
  ('AP.002', 'Toras Pinus – CL 2', '230.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 2),
  ('AP.003', 'Toras Pinus – CL 3', '205.00',
   '{"weightScaleLabel":"Ton. Peso","showPriceCheck":true,"priceCheckLabel":"Verificação","showLineStatus":false,"showDueDate":false}', 3)
) AS b(code, name, price, cfg, ord)
WHERE s.name = 'Agroflorestal Paequere Ltda'
ON CONFLICT DO NOTHING;

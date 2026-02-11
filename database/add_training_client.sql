-- =====================================================
-- MIGRATION: Adicionar client_id aos treinamentos
-- =====================================================

-- 1. Adicionar coluna client_id
ALTER TABLE training_records 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_training_records_client ON training_records(client_id);

-- 3. Atualizar RLS (já existe, mas garantir)
DROP POLICY IF EXISTS tenant_isolation_policy ON training_records;
CREATE POLICY tenant_isolation_policy ON training_records
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

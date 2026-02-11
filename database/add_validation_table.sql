-- =====================================================
-- MIGRATION: Tabela de Validação e Comissionamento
-- Registra testes de dispositivos de segurança
-- =====================================================

-- 1. Criar tipo ENUM para tipos de teste
DO $$ BEGIN
    CREATE TYPE test_type AS ENUM ('EMERGENCY_STOP', 'INTERLOCK', 'LIGHT_CURTAIN', 'BIMANUAL', 'SCANNER', 'OTHERS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de registros de validação
CREATE TABLE IF NOT EXISTS validation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    test_type test_type NOT NULL,
    test_description TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result TEXT,
    passed BOOLEAN DEFAULT false,
    tested_by TEXT,
    tested_at TIMESTAMPTZ,
    evidence_file_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE validation_records ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON validation_records;
CREATE POLICY tenant_isolation_policy ON validation_records
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_validation_records_report ON validation_records(report_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_machine ON validation_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_type ON validation_records(test_type);

-- 6. Comentários
COMMENT ON TABLE validation_records IS 'Registros de testes de validação e comissionamento de dispositivos de segurança';
COMMENT ON COLUMN validation_records.test_type IS 'Tipo de teste: EMERGENCY_STOP, INTERLOCK, LIGHT_CURTAIN, BIMANUAL, SCANNER, OTHERS';
COMMENT ON COLUMN validation_records.passed IS 'Se o teste passou (true) ou falhou (false)';

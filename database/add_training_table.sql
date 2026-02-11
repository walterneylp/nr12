-- =====================================================
-- MIGRATION: Tabela de Treinamentos
-- Registro de capacitação de operadores (NR-12 12.135)
-- =====================================================

-- 1. Criar tipo ENUM para tipo de treinamento
DO $$ BEGIN
    CREATE TYPE training_type AS ENUM ('INITIAL', 'RECYCLING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de registros de treinamento
CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    trainee_name TEXT NOT NULL,
    trainee_role TEXT,
    training_type training_type DEFAULT 'INITIAL',
    content_summary TEXT,
    duration_hours INTEGER,
    instructor_name TEXT,
    certificate_number TEXT,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON training_records;
CREATE POLICY tenant_isolation_policy ON training_records
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_training_records_machine ON training_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_training_records_report ON training_records(report_id);
CREATE INDEX IF NOT EXISTS idx_training_records_type ON training_records(training_type);
CREATE INDEX IF NOT EXISTS idx_training_records_valid_until ON training_records(valid_until);

-- 6. Comentários
COMMENT ON TABLE training_records IS 'Registros de treinamento de operadores conforme NR-12 item 12.135';
COMMENT ON COLUMN training_records.training_type IS 'Tipo: INITIAL (inicial) ou RECYCLING (reciclagem)';
COMMENT ON COLUMN training_records.valid_until IS 'Data de validade do certificado (obrigatória reciclagem a cada 24 meses)';

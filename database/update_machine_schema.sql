-- =====================================================
-- MIGRATION: Atualização do Schema de Máquinas
-- Adiciona campos conforme requisitos NR-12
-- =====================================================

-- 1. Criar novos ENUMs se não existirem
DO $$ BEGIN
    CREATE TYPE machine_criticality AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE energy_source AS ENUM ('ELETRICA', 'PNEUMATICA', 'HIDRAULICA', 'COMBUSTIVEL', 'MANUAL', 'VAPOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nr12_annex AS ENUM ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar novos tipos de máquina ao ENUM existente
-- Nota: PostgreSQL não permite ALTER TYPE ADD VALUE em transação
-- Execute manualmente se necessário:
-- ALTER TYPE machine_type ADD VALUE IF NOT EXISTS 'INJECAO';
-- ALTER TYPE machine_type ADD VALUE IF NOT EXISTS 'USINAGEM';
-- ALTER TYPE machine_type ADD VALUE IF NOT EXISTS 'PRENSA';
-- ALTER TYPE machine_type ADD VALUE IF NOT EXISTS 'TRANSPORTADOR';

-- 3. Adicionar novas colunas à tabela machines
ALTER TABLE machines 
    ADD COLUMN IF NOT EXISTS criticality machine_criticality DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS power TEXT,
    ADD COLUMN IF NOT EXISTS voltage TEXT,
    ADD COLUMN IF NOT EXISTS frequency TEXT,
    ADD COLUMN IF NOT EXISTS productivity_capacity TEXT,
    ADD COLUMN IF NOT EXISTS limits TEXT,
    ADD COLUMN IF NOT EXISTS plant_sector TEXT,
    ADD COLUMN IF NOT EXISTS production_line TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Criar tabela para fontes de energia (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS machine_energy_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
    energy_source energy_source NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(machine_id, energy_source)
);

-- 5. Criar tabela para anexos NR-12 aplicáveis
CREATE TABLE IF NOT EXISTS machine_applicable_annexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
    annex nr12_annex NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(machine_id, annex)
);

-- 6. Criar tabela de registros de validação (comissionamento)
CREATE TABLE IF NOT EXISTS validation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL CHECK (test_type IN ('EMERGENCY_STOP', 'INTERLOCK', 'LIGHT_CURTAIN', 'BIMANUAL', 'SCANNER', 'OTHERS')),
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

-- 7. Criar tabela de registros de treinamento
CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    trainee_name TEXT NOT NULL,
    trainee_role TEXT,
    training_type TEXT DEFAULT 'INITIAL' CHECK (training_type IN ('INITIAL', 'RECYCLING')),
    content_summary TEXT,
    duration_hours INTEGER,
    instructor_name TEXT,
    certificate_number TEXT,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Habilitar RLS nas novas tabelas
ALTER TABLE machine_energy_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_applicable_annexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_energy_sources;
CREATE POLICY tenant_isolation_policy ON machine_energy_sources
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON machine_applicable_annexes;
CREATE POLICY tenant_isolation_policy ON machine_applicable_annexes
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON validation_records;
CREATE POLICY tenant_isolation_policy ON validation_records
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON training_records;
CREATE POLICY tenant_isolation_policy ON training_records
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- 10. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
CREATE TRIGGER update_machines_updated_at
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Atualizar colunas existentes para suportar arrays (se necessário)
-- Como PostgreSQL não altera colunas facilmente para arrays, 
-- mantemos as tabelas de relacionamento para energy_sources e applicable_annexes

-- 12. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_machines_criticality ON machines(criticality);
CREATE INDEX IF NOT EXISTS idx_machines_plant_sector ON machines(plant_sector);
CREATE INDEX IF NOT EXISTS idx_machines_production_line ON machines(production_line);
CREATE INDEX IF NOT EXISTS idx_machines_updated_at ON machines(updated_at);
CREATE INDEX IF NOT EXISTS idx_machine_energy_sources_machine ON machine_energy_sources(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_annexes_machine ON machine_applicable_annexes(machine_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_report ON validation_records(report_id);
CREATE INDEX IF NOT EXISTS idx_validation_records_machine ON validation_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_training_records_machine ON training_records(machine_id);

-- 13. Comentários para documentação
COMMENT ON COLUMN machines.criticality IS 'Nível de criticidade da máquina para priorização de inspeção';
COMMENT ON COLUMN machines.power IS 'Potência da máquina em kW ou HP';
COMMENT ON COLUMN machines.voltage IS 'Tensão elétrica em Volts';
COMMENT ON COLUMN machines.frequency IS 'Frequência elétrica em Hz';
COMMENT ON COLUMN machines.productivity_capacity IS 'Capacidade produtiva (peças/hora, L/min, etc)';
COMMENT ON COLUMN machines.limits IS 'Limites da máquina conforme ISO 12100';
COMMENT ON COLUMN machines.plant_sector IS 'Planta ou unidade fabril';
COMMENT ON COLUMN machines.production_line IS 'Linha de produção ou setor';

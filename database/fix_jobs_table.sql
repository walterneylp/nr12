-- Fix: Garante que a tabela jobs existe com todas as colunas
-- Execute este script se receber erro de coluna inexistente

-- Verifica se a tabela existe
DO $$
BEGIN
    -- Se a tabela não existe, cria normalmente
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
        CREATE TABLE jobs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            code VARCHAR(50),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
            start_date DATE,
            end_date DATE,
            due_date DATE,
            assigned_to UUID REFERENCES profiles(id),
            estimated_value DECIMAL(12, 2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_by UUID REFERENCES profiles(id),
            deleted_at TIMESTAMP WITH TIME ZONE
        );
    ELSE
        -- Se a tabela existe, adiciona colunas que possam estar faltando
        ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS start_date DATE,
            ADD COLUMN IF NOT EXISTS end_date DATE,
            ADD COLUMN IF NOT EXISTS due_date DATE,
            ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id),
            ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12, 2),
            ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
        
        -- Garante que title é NOT NULL (se já existir dados, precisa preencher primeiro)
        -- ALTER TABLE jobs ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_dates ON jobs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned ON jobs(assigned_to);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_tenant_isolation ON jobs;
CREATE POLICY jobs_tenant_isolation ON jobs
    FOR ALL
    USING (tenant_id = get_tenant_id());

-- Função e trigger para updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Comentários
COMMENT ON TABLE jobs IS 'Ordens de serviço/trabalhos vinculados a clientes';
COMMENT ON COLUMN jobs.code IS 'Código único da ordem de serviço (ex: OS-2024-001)';
COMMENT ON COLUMN jobs.status IS 'Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED';

-- Verificação final
SELECT 'Tabela jobs verificada/criada com sucesso!' as result;

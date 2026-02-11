-- Migration: Criação da tabela jobs (Ordens de Serviço)
-- Vincula trabalhos a clientes e serve como agrupador de laudos

-- Tabela principal de jobs/ordens de serviço
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Identificação
    code VARCHAR(50), -- Código interno da ordem (ex: OS-2024-001)
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status do trabalho
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    
    -- Datas
    start_date DATE,
    end_date DATE,
    due_date DATE, -- Prazo de entrega
    
    -- Responsável
    assigned_to UUID REFERENCES profiles(id),
    
    -- Valor (opcional)
    estimated_value DECIMAL(12, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_dates ON jobs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned ON jobs(assigned_to);

-- RLS: Isolamento por tenant
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_tenant_isolation ON jobs
    FOR ALL
    USING (tenant_id = get_tenant_id());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Comentários
COMMENT ON TABLE jobs IS 'Ordens de serviço/trabalhos vinculados a clientes';
COMMENT ON COLUMN jobs.code IS 'Código único da ordem de serviço (ex: OS-2024-001)';
COMMENT ON COLUMN jobs.status IS 'Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED';

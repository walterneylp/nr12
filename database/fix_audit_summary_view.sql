-- Fix: Criar view audit_summary se não existir
-- Execute este script no SQL Editor do Supabase

-- Primeiro garantir que a tabela audit_events existe
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Quem fez a ação
    actor_user_id UUID,
    actor_email VARCHAR(255),
    actor_name VARCHAR(255),
    
    -- O que foi feito
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'EXPORT', 'SIGN', 
        'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD', 'UPLOAD'
    )),
    
    -- Em qual entidade
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    
    -- Dados da alteração
    before_json JSONB,
    after_json JSONB,
    changes_summary TEXT,
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_events(tenant_id, created_at DESC);

-- Criar ou recriar a view audit_summary
DROP VIEW IF EXISTS audit_summary;

CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    ae.*,
    CASE 
        WHEN ae.action = 'CREATE' THEN 'Criação'
        WHEN ae.action = 'UPDATE' THEN 'Atualização'
        WHEN ae.action = 'DELETE' THEN 'Exclusão'
        WHEN ae.action = 'STATUS_CHANGE' THEN 'Mudança de Status'
        WHEN ae.action = 'EXPORT' THEN 'Exportação'
        WHEN ae.action = 'SIGN' THEN 'Assinatura'
        WHEN ae.action = 'LOGIN' THEN 'Login'
        WHEN ae.action = 'LOGOUT' THEN 'Logout'
        WHEN ae.action = 'VIEW' THEN 'Visualização'
        WHEN ae.action = 'DOWNLOAD' THEN 'Download'
        WHEN ae.action = 'UPLOAD' THEN 'Upload'
    END as action_label,
    CASE 
        WHEN ae.entity_type = 'client' THEN 'Cliente'
        WHEN ae.entity_type = 'machine' THEN 'Máquina'
        WHEN ae.entity_type = 'report' THEN 'Laudo'
        WHEN ae.entity_type = 'site' THEN 'Local'
        WHEN ae.entity_type = 'training' THEN 'Treinamento'
        WHEN ae.entity_type = 'job' THEN 'Ordem de Serviço'
        WHEN ae.entity_type = 'action_item' THEN 'Plano de Ação'
        WHEN ae.entity_type = 'risk_entry' THEN 'Avaliação de Risco'
        ELSE ae.entity_type
    END as entity_type_label
FROM audit_events ae;

-- Garantir que RLS está habilitado (se a tabela já existir)
ALTER TABLE IF EXISTS audit_events ENABLE ROW LEVEL SECURITY;

-- Política de isolamento por tenant (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_events' 
        AND policyname = 'audit_tenant_isolation'
    ) THEN
        CREATE POLICY audit_tenant_isolation ON audit_events
            FOR ALL
            USING (tenant_id = get_tenant_id());
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        -- Se get_tenant_id() não existir, criar política alternativa
        CREATE POLICY audit_tenant_isolation ON audit_events
            FOR ALL
            USING (tenant_id IN (SELECT id FROM tenants));
END $$;

-- Grant permissions
GRANT SELECT ON audit_summary TO authenticated;
GRANT SELECT ON audit_summary TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'View audit_summary criada/atualizada com sucesso!' as result;

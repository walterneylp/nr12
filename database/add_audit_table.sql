-- Migration: Sistema de Auditoria/Logs
-- Registra todas as ações importantes no sistema

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Quem fez a ação
    actor_user_id UUID REFERENCES profiles(id),
    actor_email VARCHAR(255), -- Email do usuário no momento da ação
    actor_name VARCHAR(255),  -- Nome do usuário no momento da ação
    
    -- O que foi feito
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'EXPORT', 'SIGN', 
        'LOGIN', 'LOGOUT', 'VIEW', 'DOWNLOAD', 'UPLOAD'
    )),
    
    -- Em qual entidade
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'machine', 'report', 'training', etc.
    entity_id UUID, -- ID da entidade afetada
    entity_name VARCHAR(255), -- Nome/descritivo da entidade (para histórico)
    
    -- Dados da alteração
    before_json JSONB, -- Estado anterior (para UPDATE/DELETE)
    after_json JSONB,  -- Estado posterior (para CREATE/UPDATE)
    changes_summary TEXT, -- Resumo textual das alterações
    
    -- Metadados da requisição
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

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON audit_events(tenant_id, created_at DESC);

-- RLS: Isolamento por tenant
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_tenant_isolation ON audit_events
    FOR ALL
    USING (tenant_id = get_tenant_id());

-- View para facilitar consultas de auditoria
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

COMMENT ON TABLE audit_events IS 'Log de auditoria de todas as ações do sistema';
COMMENT ON COLUMN audit_events.before_json IS 'Dados da entidade antes da alteração';
COMMENT ON COLUMN audit_events.after_json IS 'Dados da entidade após a alteração';

SELECT 'Tabela de auditoria criada com sucesso!' as result;

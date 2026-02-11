-- Migration: Sistema de Notificações
-- Alertas em tempo real para usuários

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Destinatário
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Conteúdo
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'REPORT_EXPIRING',      -- Laudo próximo ao vencimento
        'ACTION_DUE',           -- Ação do plano próxima do prazo
        'TRAINING_EXPIRING',    -- Treinamento expirando
        'RISK_CRITICAL',        -- Novo risco crítico identificado
        'REPORT_SIGNED',        -- Laudo foi assinado
        'SYSTEM',               -- Notificação do sistema
        'MENTION'               -- Usuário foi mencionado
    )),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Link para a entidade relacionada
    entity_type VARCHAR(50),  -- 'report', 'machine', 'training', etc.
    entity_id UUID,
    entity_name VARCHAR(255),
    
    -- Link direto (opcional)
    link_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Prioridade
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    
    -- Expiração (notificações antigas podem ser automaticamente arquivadas)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS: Usuários só veem suas próprias notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_isolation ON notifications
    FOR ALL
    USING (user_id = auth.uid());

-- View para notificações não lidas com contagem
CREATE OR REPLACE VIEW notification_summary AS
SELECT 
    n.*,
    CASE 
        WHEN n.type = 'REPORT_EXPIRING' THEN 'Laudo Vencendo'
        WHEN n.type = 'ACTION_DUE' THEN 'Ação Pendente'
        WHEN n.type = 'TRAINING_EXPIRING' THEN 'Treinamento Expirando'
        WHEN n.type = 'RISK_CRITICAL' THEN 'Risco Crítico'
        WHEN n.type = 'REPORT_SIGNED' THEN 'Laudo Assinado'
        WHEN n.type = 'SYSTEM' THEN 'Sistema'
        WHEN n.type = 'MENTION' THEN 'Menção'
    END as type_label
FROM notifications n;

-- Função para criar notificação automática (pode ser chamada por triggers)
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_entity_name VARCHAR DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'NORMAL'
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Buscar tenant_id do usuário
    SELECT tenant_id INTO v_tenant_id 
    FROM profiles 
    WHERE id = p_user_id;
    
    INSERT INTO notifications (
        tenant_id,
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        entity_name,
        priority,
        expires_at
    ) VALUES (
        v_tenant_id,
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_priority,
        now() + INTERVAL '30 days' -- Expira em 30 dias
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'Notificações para usuários do sistema';
COMMENT ON COLUMN notifications.is_read IS 'Se a notificação foi lida pelo usuário';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: LOW, NORMAL, HIGH, URGENT';

SELECT 'Tabela de notificações criada com sucesso!' as result;

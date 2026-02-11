-- =====================================================
-- MIGRATION: Evidências Fotográficas no Checklist
-- Adiciona suporte a múltiplas fotos por item
-- =====================================================

-- 1. Criar tabela para armazenar evidências fotográficas do checklist
CREATE TABLE IF NOT EXISTS checklist_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
    response_id UUID REFERENCES checklist_responses(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT,
    description TEXT,
    photo_type TEXT DEFAULT 'CONTEXT' CHECK (photo_type IN ('CONTEXT', 'DETAIL', 'PLATE', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE checklist_evidence ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
DROP POLICY IF EXISTS tenant_isolation_policy ON checklist_evidence;
CREATE POLICY tenant_isolation_policy ON checklist_evidence
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_checklist_evidence_response ON checklist_evidence(response_id);

-- 5. Comentários
COMMENT ON TABLE checklist_evidence IS 'Evidências fotográficas dos itens do checklist';
COMMENT ON COLUMN checklist_evidence.photo_type IS 'Tipo da foto: CONTEXT (contexto), DETAIL (detalhe), PLATE (placa/ID), OTHER (outro)';

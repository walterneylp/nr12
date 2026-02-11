-- Correção: Garantir que todas as colunas de assinatura existem na tabela reports
-- E recarregar o cache do schema

-- 1. Adicionar colunas se não existirem (de forma segura)
DO $$
BEGIN
    -- Colunas de validade
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'validity_months') THEN
        ALTER TABLE reports ADD COLUMN validity_months INTEGER DEFAULT 12;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'valid_from') THEN
        ALTER TABLE reports ADD COLUMN valid_from DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'valid_until') THEN
        ALTER TABLE reports ADD COLUMN valid_until DATE;
    END IF;

    -- Colunas de ART
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'art_number') THEN
        ALTER TABLE reports ADD COLUMN art_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'art_file_id') THEN
        ALTER TABLE reports ADD COLUMN art_file_id UUID;
    END IF;

    -- Colunas de PDF
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'draft_pdf_file_id') THEN
        ALTER TABLE reports ADD COLUMN draft_pdf_file_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signed_pdf_file_id') THEN
        ALTER TABLE reports ADD COLUMN signed_pdf_file_id UUID;
    END IF;

    -- Colunas de assinatura
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signature_mode') THEN
        ALTER TABLE reports ADD COLUMN signature_mode VARCHAR(30) DEFAULT 'EXTERNAL_UPLOAD';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signature_provider') THEN
        ALTER TABLE reports ADD COLUMN signature_provider VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signed_at') THEN
        ALTER TABLE reports ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signed_by') THEN
        ALTER TABLE reports ADD COLUMN signed_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signed_hash_sha256') THEN
        ALTER TABLE reports ADD COLUMN signed_hash_sha256 VARCHAR(64);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'signature_metadata_json') THEN
        ALTER TABLE reports ADD COLUMN signature_metadata_json JSONB;
    END IF;

    -- Colunas de revisão e controle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'revision') THEN
        ALTER TABLE reports ADD COLUMN revision INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'parent_report_id') THEN
        ALTER TABLE reports ADD COLUMN parent_report_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'locked_at') THEN
        ALTER TABLE reports ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Verificar colunas criadas
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN (
    'validity_months', 'valid_from', 'valid_until',
    'art_number', 'art_file_id',
    'draft_pdf_file_id', 'signed_pdf_file_id',
    'signature_mode', 'signed_at', 'signed_by', 
    'signed_hash_sha256', 'signature_metadata_json',
    'revision', 'parent_report_id', 'locked_at'
)
ORDER BY ordinal_position;

-- 3. Comentários nas colunas
COMMENT ON COLUMN reports.validity_months IS 'Prazo de validade do laudo em meses';
COMMENT ON COLUMN reports.valid_from IS 'Data início da validade';
COMMENT ON COLUMN reports.valid_until IS 'Data fim da validade';
COMMENT ON COLUMN reports.art_number IS 'Número da ART';
COMMENT ON COLUMN reports.art_file_id IS 'Arquivo da ART anexada';
COMMENT ON COLUMN reports.draft_pdf_file_id IS 'PDF do laudo em rascunho';
COMMENT ON COLUMN reports.signed_pdf_file_id IS 'PDF do laudo assinado';
COMMENT ON COLUMN reports.signature_mode IS 'Modo de assinatura';
COMMENT ON COLUMN reports.signed_at IS 'Data/hora da assinatura';
COMMENT ON COLUMN reports.signed_by IS 'Usuário que assinou';
COMMENT ON COLUMN reports.signed_hash_sha256 IS 'Hash SHA-256 para verificação';
COMMENT ON COLUMN reports.locked_at IS 'Timestamp de bloqueio do laudo';

-- 4. Recriar view de status (se existir)
DROP VIEW IF EXISTS report_signing_status;

CREATE VIEW report_signing_status AS
SELECT 
    r.id,
    r.title,
    r.status,
    r.valid_from,
    r.valid_until,
    r.art_number,
    r.art_file_id IS NOT NULL as has_art,
    r.signed_pdf_file_id IS NOT NULL as has_signed_pdf,
    r.signed_at,
    r.signed_by,
    r.signed_hash_sha256,
    r.locked_at,
    CASE 
        WHEN r.status = 'SIGNED' THEN 'ASSINADO'
        WHEN r.status = 'READY' THEN 'PRONTO PARA ASSINATURA'
        WHEN r.status = 'DRAFT' THEN 'RASCUNHO'
        ELSE r.status
    END as status_label,
    CASE
        WHEN r.valid_until < CURRENT_DATE THEN 'EXPIRED'
        WHEN r.valid_until < CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END as validity_status
FROM reports r
WHERE r.deleted_at IS NULL;

-- 5. Mensagem de sucesso
SELECT 'Colunas de assinatura verificadas/atualizadas com sucesso!' as result;

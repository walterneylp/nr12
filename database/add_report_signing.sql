-- Migration: Adiciona campos de assinatura à tabela reports
-- Habilita fluxo completo: DRAFT → READY → SIGNED

-- Adiciona colunas de assinatura (se não existirem)
ALTER TABLE reports 
    ADD COLUMN IF NOT EXISTS validity_months INTEGER DEFAULT 12,
    ADD COLUMN IF NOT EXISTS valid_from DATE,
    ADD COLUMN IF NOT EXISTS valid_until DATE,
    ADD COLUMN IF NOT EXISTS art_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS art_file_id UUID REFERENCES storage.objects(id),
    ADD COLUMN IF NOT EXISTS draft_pdf_file_id UUID REFERENCES storage.objects(id),
    ADD COLUMN IF NOT EXISTS signed_pdf_file_id UUID REFERENCES storage.objects(id),
    ADD COLUMN IF NOT EXISTS signature_mode VARCHAR(30) DEFAULT 'EXTERNAL_UPLOAD' 
        CHECK (signature_mode IN ('EXTERNAL_UPLOAD', 'SIMPLE_E_SIGN', 'INTEGRATED_PROVIDER')),
    ADD COLUMN IF NOT EXISTS signature_provider VARCHAR(100),
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES profiles(id),
    ADD COLUMN IF NOT EXISTS signed_hash_sha256 VARCHAR(64),
    ADD COLUMN IF NOT EXISTS signature_metadata_json JSONB,
    ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parent_report_id UUID REFERENCES reports(id),
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_valid_until ON reports(valid_until);
CREATE INDEX IF NOT EXISTS idx_reports_signed_at ON reports(signed_at);
CREATE INDEX IF NOT EXISTS idx_reports_job ON reports(job_id) WHERE job_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN reports.validity_months IS 'Prazo de validade do laudo em meses';
COMMENT ON COLUMN reports.valid_from IS 'Data início da validade';
COMMENT ON COLUMN reports.valid_until IS 'Data fim da validade (calculado de valid_from + validity_months)';
COMMENT ON COLUMN reports.art_number IS 'Número da ART (Anotação de Responsabilidade Técnica)';
COMMENT ON COLUMN reports.art_file_id IS 'Arquivo da ART anexada';
COMMENT ON COLUMN reports.draft_pdf_file_id IS 'PDF do laudo em rascunho (antes da assinatura)';
COMMENT ON COLUMN reports.signed_pdf_file_id IS 'PDF do laudo assinado (final)';
COMMENT ON COLUMN reports.signature_mode IS 'Modo de assinatura: EXTERNAL_UPLOAD, SIMPLE_E_SIGN, INTEGRATED_PROVIDER';
COMMENT ON COLUMN reports.signed_hash_sha256 IS 'Hash SHA-256 do PDF assinado para verificação de integridade';
COMMENT ON COLUMN reports.locked_at IS 'Timestamp de bloqueio do laudo (quando entra em SIGNED)';

-- Função para calcular valid_until automaticamente
CREATE OR REPLACE FUNCTION calculate_report_validity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.valid_from IS NOT NULL AND NEW.validity_months IS NOT NULL THEN
        NEW.valid_until := NEW.valid_from + (NEW.validity_months || ' months')::INTERVAL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular validade
DROP TRIGGER IF EXISTS trigger_calculate_validity ON reports;
CREATE TRIGGER trigger_calculate_validity
    BEFORE INSERT OR UPDATE OF valid_from, validity_months ON reports
    FOR EACH ROW
    EXECUTE FUNCTION calculate_report_validity();

-- Função para bloquear edição em laudos assinados (RLS helper)
CREATE OR REPLACE FUNCTION is_report_locked(report_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    report_status VARCHAR(20);
    report_locked_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT status, locked_at INTO report_status, report_locked_at
    FROM reports WHERE id = report_id;
    
    RETURN report_status = 'SIGNED' OR report_locked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para laudos com informações de assinatura
CREATE OR REPLACE VIEW report_signing_status AS
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

SELECT 'Migration de assinatura de laudos aplicada com sucesso!' as result;

-- Correção: Mudar tipo das colunas de arquivo de UUID para VARCHAR
-- Os campos vão armazenar o path do arquivo no storage, não o UUID

-- Alterar colunas de UUID para VARCHAR (para armazenar paths)
ALTER TABLE reports 
    ALTER COLUMN art_file_id TYPE VARCHAR(500),
    ALTER COLUMN draft_pdf_file_id TYPE VARCHAR(500),
    ALTER COLUMN signed_pdf_file_id TYPE VARCHAR(500);

-- Renomear colunas para refletir melhor o conteúdo (opcional, mas recomendado)
-- Nota: Comentários atualizados para refletir o novo propósito
COMMENT ON COLUMN reports.art_file_id IS 'Path do arquivo da ART no storage (ex: tenant-id/reports/id/art/filename.pdf)';
COMMENT ON COLUMN reports.draft_pdf_file_id IS 'Path do PDF rascunho no storage';
COMMENT ON COLUMN reports.signed_pdf_file_id IS 'Path do PDF assinado no storage';

-- Verificar alterações
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'reports' 
AND column_name IN ('art_file_id', 'draft_pdf_file_id', 'signed_pdf_file_id');

SELECT 'Tipos das colunas de arquivo alterados para VARCHAR com sucesso!' as result;

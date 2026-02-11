-- Configuração do Storage para documentos (ART e PDFs assinados)

-- Criar bucket 'documents' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false, -- não público, requer autenticação
    52428800, -- 50MB limite
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

-- Política RLS para o bucket documents
-- Permitir leitura apenas do próprio tenant
CREATE POLICY "documents_tenant_select"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
);

-- Permitir inserção apenas do próprio tenant
CREATE POLICY "documents_tenant_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
);

-- Permitir delete apenas do próprio tenant
CREATE POLICY "documents_tenant_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
);

-- Garantir que RLS está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Comentário
COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento de arquivos';
COMMENT ON TABLE storage.objects IS 'Arquivos armazenados';

SELECT 'Bucket documents configurado com sucesso!' as result;

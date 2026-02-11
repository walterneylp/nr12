# Configuração do Storage para Documentos

## ⚠️ Erro de Permissão Detectado

O SQL direto na tabela `storage.objects` requer permissões de superusuário que não estão disponíveis no Supabase.

## ✅ Solução: Criar Bucket pela Interface

### Passo 1: Acessar Storage no Supabase
1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**

### Passo 2: Criar o Bucket
1. Clique em **New bucket** (ou "Novo bucket")
2. Nome do bucket: `documents`
3. Desmarque a opção **Public bucket** (deixe privado)
4. Clique em **Create bucket**

### Passo 3: Configurar Políticas (RLS)
1. Clique no bucket `documents` criado
2. Vá para a aba **Policies** (Políticas)
3. Clique em **New Policy**

#### Criar 3 políticas:

**Política 1 - SELECT (leitura):**
```
Name: Allow select own tenant
Allowed operation: SELECT
Target roles: authenticated
USING expression: (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
```

**Política 2 - INSERT (upload):**
```
Name: Allow insert own tenant
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
```

**Política 3 - DELETE:**
```
Name: Allow delete own tenant
Allowed operation: DELETE
Target roles: authenticated
USING expression: (storage.foldername(name))[1] = (SELECT tenant_id::text FROM profiles WHERE id = auth.uid())
```

### Passo 4: Configurar Tipos de Arquivo (Opcional)
1. Na aba **Configuration** do bucket
2. Adicione mime types permitidos:
   - `application/pdf`
   - `image/jpeg`
   - `image/jpg`
   - `image/png`
3. Limite de tamanho: 50MB (52428800 bytes)

---

## 🔄 Alternativa: Usando SQL Simplificado

Se a interface não funcionar, tente este SQL mínimo (sem alterar tabelas do sistema):

```sql
-- Apenas criar o bucket (sem políticas complexas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas simples (permissivas para teste)
CREATE POLICY IF NOT EXISTS "documents_select" ON storage.objects 
    FOR SELECT USING (bucket_id = 'documents');
    
CREATE POLICY IF NOT EXISTS "documents_insert" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'documents');
    
CREATE POLICY IF NOT EXISTS "documents_delete" ON storage.objects 
    FOR DELETE USING (bucket_id = 'documents');
```

---

## ✅ Verificação

Após configurar, teste com este SQL:

```sql
SELECT * FROM storage.buckets WHERE id = 'documents';
```

Se retornar 1 linha, o bucket está criado! 🎉

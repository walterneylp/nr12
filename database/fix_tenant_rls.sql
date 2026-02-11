-- =====================================================
-- FIX: Permissões RLS para tabela tenants
-- O erro 406 ocorre porque não há policy de leitura
-- =====================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para usuários verem seu próprio tenant
DROP POLICY IF EXISTS tenant_read_own ON tenants;
CREATE POLICY tenant_read_own ON tenants
  FOR SELECT
  USING (id = get_tenant_id());

-- 3. Criar política para usuários atualizarem seu próprio tenant
DROP POLICY IF EXISTS tenant_update_own ON tenants;
CREATE POLICY tenant_update_own ON tenants
  FOR UPDATE
  USING (id = get_tenant_id())
  WITH CHECK (id = get_tenant_id());

-- 4. Verificar se a função get_tenant_id existe e funciona
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Grant permissions
GRANT SELECT ON tenants TO authenticated;
GRANT UPDATE ON tenants TO authenticated;

-- 6. Verificar se profiles tem o tenant_id correto
-- Se o usuário atual não tem tenant_id, isso causa problemas
-- Execute este select para verificar:
-- SELECT id, email, tenant_id FROM profiles WHERE id = auth.uid();

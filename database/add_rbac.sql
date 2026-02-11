-- Migration: RBAC (Role-Based Access Control)
-- Implementa controle de acesso por perfil

-- Adicionar coluna role na tabela profiles (se não existir)
ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'TECHNICIAN' 
    CHECK (role IN ('MASTER', 'TECHNICIAN', 'VIEWER'));

-- Atualizar o usuário atual como MASTER (primeiro usuário)
UPDATE profiles 
    SET role = 'MASTER' 
    WHERE id = (SELECT id FROM profiles ORDER BY created_at LIMIT 1);

-- Comentário
COMMENT ON COLUMN profiles.role IS 'Perfil do usuário: MASTER (tudo), TECHNICIAN (criar/editar, não assinar), VIEWER (somente leitura)';

-- View para listar usuários com suas permissões
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    CASE 
        WHEN p.role = 'MASTER' THEN 'Administrador - Acesso total'
        WHEN p.role = 'TECHNICIAN' THEN 'Técnico - Criar e editar, não assinar'
        WHEN p.role = 'VIEWER' THEN 'Visualizador - Somente leitura'
    END as role_description,
    CASE 
        WHEN p.role = 'MASTER' THEN TRUE
        ELSE FALSE
    END as can_manage_users,
    CASE 
        WHEN p.role IN ('MASTER', 'TECHNICIAN') THEN TRUE
        ELSE FALSE
    END as can_create_edit,
    CASE 
        WHEN p.role IN ('MASTER') THEN TRUE
        ELSE FALSE
    END as can_sign,
    CASE 
        WHEN p.role IN ('MASTER', 'TECHNICIAN', 'VIEWER') THEN TRUE
        ELSE FALSE
    END as can_view
FROM profiles p
WHERE p.deleted_at IS NULL;

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    SELECT role INTO v_role 
    FROM profiles 
    WHERE id = p_user_id;
    
    -- MASTER pode tudo
    IF v_role = 'MASTER' THEN
        RETURN TRUE;
    END IF;
    
    -- Permissões específicas
    CASE p_permission
        WHEN 'MANAGE_USERS' THEN RETURN v_role = 'MASTER';
        WHEN 'CREATE_EDIT' THEN RETURN v_role IN ('MASTER', 'TECHNICIAN');
        WHEN 'SIGN_REPORT' THEN RETURN v_role = 'MASTER';
        WHEN 'VIEW' THEN RETURN v_role IN ('MASTER', 'TECHNICIAN', 'VIEWER');
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'RBAC implementado com sucesso!' as result;

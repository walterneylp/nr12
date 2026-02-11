-- Migration: Criação da tabela sites (Locais/Filiais)
-- Permite que clientes tenham múltiplos endereços/locais

CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL, -- Nome do local (ex: Matriz, Filial SP, Unidade Industrial)
    code VARCHAR(50), -- Código interno do local
    
    -- Endereço completo
    address VARCHAR(500),
    number VARCHAR(20),
    neighborhood VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL, -- UF
    zip_code VARCHAR(10), -- CEP
    country VARCHAR(50) DEFAULT 'Brasil',
    
    -- Contato
    phone VARCHAR(20),
    email VARCHAR(255),
    contact_name VARCHAR(255),
    
    -- Observações
    notes TEXT,
    
    -- Ativo/Inativo
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES profiles(id),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sites_tenant ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sites_client ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_sites_city ON sites(city);
CREATE INDEX IF NOT EXISTS idx_sites_state ON sites(state);
CREATE INDEX IF NOT EXISTS idx_sites_active ON sites(is_active) WHERE is_active = true;

-- RLS: Isolamento por tenant
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_tenant_isolation ON sites
    FOR ALL
    USING (tenant_id = get_tenant_id());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sites_updated_at ON sites;
CREATE TRIGGER trigger_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();

-- Adicionar coluna site_id na tabela machines
ALTER TABLE machines 
    ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_machines_site ON machines(site_id);

COMMENT ON TABLE sites IS 'Locais/filiais/endereços dos clientes';
COMMENT ON COLUMN sites.name IS 'Nome identificador do local (ex: Matriz, Filial SP)';
COMMENT ON COLUMN sites.code IS 'Código interno do local para identificação';

SELECT 'Tabela sites criada e máquinas atualizadas com sucesso!' as result;

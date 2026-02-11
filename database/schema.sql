
-- ENUMS
-- ENUMS
DO $$ BEGIN
    CREATE TYPE machine_type AS ENUM ('CONFORMACAO', 'ROTATIVA', 'CORTE', 'ELEVACAO', 'COZINHA', 'EMBALAGEM', 'OUTROS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('DRAFT', 'IN_REVIEW', 'READY', 'SIGNED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE checklist_status AS ENUM ('COMPLIANT', 'NONCOMPLIANT', 'NOT_APPLICABLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_priority AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'IMPROVEMENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('ACEITAVEL', 'TOLERAVEL', 'INACEITAVEL', 'CRITICO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signature_mode AS ENUM ('EXTERNAL_UPLOAD', 'SIMPLE_E_SIGN', 'INTEGRATED_PROVIDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('MASTER', 'TECHNICIAN', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TENANTS & PROFILES
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  email TEXT NOT NULL,
  name TEXT,
  role user_role DEFAULT 'VIEWER',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CLIENTS & SITES
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MACHINES
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  site_id UUID REFERENCES sites(id),
  tag TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  year INTEGER,
  machine_type machine_type NOT NULL,
  location TEXT,
  photo_file_id UUID, -- References storage
  risk_level risk_level,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, tag)
);

-- JOBS & REPORTS
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  job_id UUID REFERENCES jobs(id),
  title TEXT NOT NULL,
  status report_status DEFAULT 'DRAFT',
  checklist_version_id UUID REFERENCES checklist_versions(id),
  signature_mode signature_mode DEFAULT 'EXTERNAL_UPLOAD',
  signed_pdf_file_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CHECKLIST & RISKS
DROP TABLE IF EXISTS checklist_responses CASCADE;
DROP TABLE IF EXISTS checklist_requirements CASCADE;

CREATE TABLE checklist_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_version_id UUID REFERENCES checklist_versions(id),
  item TEXT NOT NULL, -- e.g. 12.1
  description TEXT NOT NULL,
  group_name TEXT,
  standard_reference TEXT,
  risk_category TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER
);

CREATE TABLE checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES checklist_requirements(id),
  status checklist_status NOT NULL,
  evidence_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_id, machine_id, requirement_id)
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
  hazard TEXT NOT NULL,
  hrn_severity INTEGER NOT NULL,
  hrn_probability INTEGER NOT NULL,
  hrn_frequency INTEGER NOT NULL,
  hrn_number INTEGER GENERATED ALWAYS AS (hrn_severity * hrn_probability * hrn_frequency) STORED,
  risk_level risk_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) DEFAULT get_tenant_id() NOT NULL,
  plan_id UUID REFERENCES action_plans(id) ON DELETE CASCADE,
  priority action_priority NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  due_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CATALOGS
CREATE TABLE IF NOT EXISTS risk_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  hazard TEXT NOT NULL,
  location TEXT,
  consequence TEXT,
  s INTEGER,
  p INTEGER,
  f INTEGER,
  category_required TEXT
);

-- RLS POLICIES

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Policy helper function
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Generic Tenant Isolation Policy
-- Users can only see/edit rows where tenant_id matches their profile's tenant_id

DROP POLICY IF EXISTS tenant_isolation_policy ON clients;
CREATE POLICY tenant_isolation_policy ON clients
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON sites;
CREATE POLICY tenant_isolation_policy ON sites
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON machines;
CREATE POLICY tenant_isolation_policy ON machines
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());
  
DROP POLICY IF EXISTS tenant_isolation_policy ON jobs;
CREATE POLICY tenant_isolation_policy ON jobs
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON reports;
CREATE POLICY tenant_isolation_policy ON reports
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- New tables policies (Checklist & Risks & Actions)
DROP POLICY IF EXISTS tenant_isolation_policy ON checklist_responses;
CREATE POLICY tenant_isolation_policy ON checklist_responses
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON risk_assessments;
CREATE POLICY tenant_isolation_policy ON risk_assessments
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON risk_entries;
CREATE POLICY tenant_isolation_policy ON risk_entries
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON action_plans;
CREATE POLICY tenant_isolation_policy ON action_plans
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON action_items;
CREATE POLICY tenant_isolation_policy ON action_items
  USING (tenant_id = get_tenant_id())
  WITH CHECK (tenant_id = get_tenant_id());

-- Profiles policy: user can see own profile
DROP POLICY IF EXISTS profile_own_policy ON profiles;
CREATE POLICY profile_own_policy ON profiles
  USING (id = auth.uid());

-- TRIGGER FOR NEW USERS
-- Automatically create a tenant and profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- 1. Create a new Tenant for the user
  INSERT INTO public.tenants (name, slug)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    'tenant-' || substr(md5(random()::text), 1, 8)
  )
  RETURNING id INTO new_tenant_id;

  -- 2. Create the Profile linked to the Tenant
  INSERT INTO public.profiles (id, tenant_id, email, name, role)
  VALUES (
    new.id,
    new_tenant_id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário'),
    'MASTER'
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


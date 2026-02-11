
-- ADD DEFAULT TENANT_ID SCRIPT
-- This script adds a default value to tenant_id columns so the frontend doesn't need to send it.

-- Function to confirm get_tenant_id exists and works for defaults
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- ALTER TABLES to set default
ALTER TABLE clients ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE sites ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE machines ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE jobs ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE reports ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE checklist_responses ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE risk_assessments ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE risk_entries ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE action_plans ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();
ALTER TABLE action_items ALTER COLUMN tenant_id SET DEFAULT get_tenant_id();

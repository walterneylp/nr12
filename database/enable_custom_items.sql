-- 1. Add columns (Safe Operation)
DO $$
BEGIN
    ALTER TABLE checklist_requirements ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id) ON DELETE CASCADE;
    ALTER TABLE checklist_requirements ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES machines(id) ON DELETE CASCADE;
    ALTER TABLE checklist_requirements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Columns already exist';
END $$;

-- 2. Drop existing policies to avoid conflicts or stale definitions
DROP POLICY IF EXISTS "Public read standard requirements" ON checklist_requirements;
DROP POLICY IF EXISTS "Read requirements" ON checklist_requirements;
DROP POLICY IF EXISTS "Insert custom requirements" ON checklist_requirements;
DROP POLICY IF EXISTS "Update custom requirements" ON checklist_requirements;
DROP POLICY IF EXISTS "Delete custom requirements" ON checklist_requirements;

-- 3. Enable RLS (Idempotent)
ALTER TABLE checklist_requirements ENABLE ROW LEVEL SECURITY;

-- 4. Recreate Policies
-- Policy for Reading: Standard items (tenant_id IS NULL) OR Custom items (tenant_id matches user)
CREATE POLICY "Read requirements" ON checklist_requirements
    FOR SELECT USING (
        tenant_id IS NULL 
        OR 
        tenant_id = get_tenant_id()
    );

-- Policy for Inserting: Only allowed if tenant_id matches user (Custom items)
CREATE POLICY "Insert custom requirements" ON checklist_requirements
    FOR INSERT WITH CHECK (
        tenant_id = get_tenant_id()
    );

-- Policy for Updating: Only custom items
CREATE POLICY "Update custom requirements" ON checklist_requirements
    FOR UPDATE USING (
        tenant_id = get_tenant_id()
    );

-- Policy for Deleting: Only custom items
CREATE POLICY "Delete custom requirements" ON checklist_requirements
    FOR DELETE USING (
        tenant_id = get_tenant_id()
    );

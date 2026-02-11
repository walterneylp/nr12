
-- REPAIR ORPHANED USERS SCRIPT
-- Run this in Supabase SQL Editor to fix existing users who cannot create data due to RLS.

DO $$
DECLARE
  r RECORD;
  new_tenant_id UUID;
BEGIN
  -- Loop through all users in auth.users
  FOR r IN SELECT * FROM auth.users LOOP
    
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
      RAISE NOTICE 'Fixing user: % (%)', r.email, r.id;

      -- 1. Create a new Tenant for the user
      INSERT INTO public.tenants (name, slug)
      VALUES (
        COALESCE(r.raw_user_meta_data->>'company_name', 'Minha Empresa (Reparada)'),
        'tenant-' || substr(md5(random()::text), 1, 8)
      )
      RETURNING id INTO new_tenant_id;

      -- 2. Create the Profile linked to the Tenant
      INSERT INTO public.profiles (id, tenant_id, email, name, role)
      VALUES (
        r.id,
        new_tenant_id,
        r.email,
        COALESCE(r.raw_user_meta_data->>'full_name', 'Usuário Recuperado'),
        'MASTER'
      );
      
    ELSE
      RAISE NOTICE 'User % already has a profile. Skipping.', r.email;
    END IF;

  END LOOP;
END $$;

-- Add detailed fields to tenants table for "Service Provider" data
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS trade_name TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS technical_manager TEXT,
ADD COLUMN IF NOT EXISTS crea_number TEXT,
ADD COLUMN IF NOT EXISTS logo_file_id UUID; -- References storage.objects(id) implicitly or managed by app logic

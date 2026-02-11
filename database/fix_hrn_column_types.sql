-- 1. Drop the generated column FIRST to allow modifying its dependencies
ALTER TABLE risk_entries DROP COLUMN IF EXISTS hrn_number;

-- 2. Now it is safe to change the base columns to decimals (Numeric)
ALTER TABLE risk_entries 
  ALTER COLUMN hrn_severity TYPE NUMERIC(10, 4),
  ALTER COLUMN hrn_probability TYPE NUMERIC(10, 4),
  ALTER COLUMN hrn_frequency TYPE NUMERIC(10, 4);

-- 3. Re-add hrn_number as generated column with the new numeric type
ALTER TABLE risk_entries 
  ADD COLUMN hrn_number NUMERIC(10, 4) GENERATED ALWAYS AS (hrn_severity * hrn_probability * hrn_frequency) STORED;

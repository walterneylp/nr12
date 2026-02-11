-- Add missing columns to risk_entries table
ALTER TABLE risk_entries 
ADD COLUMN IF NOT EXISTS hazard_location TEXT,
ADD COLUMN IF NOT EXISTS possible_consequence TEXT;

-- Verify/Add standard HRN columns if they are missing (safety check)
-- (They seemed to be there in schema.sql but just in case)
-- ALTER TABLE risk_entries ADD COLUMN IF NOT EXISTS hrn_severity INTEGER;
-- ...

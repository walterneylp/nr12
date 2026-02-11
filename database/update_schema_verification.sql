-- Database updates based on Verification Report (Phase 4.2)

-- 1. Machines: Add technical specifications
ALTER TABLE machines
ADD COLUMN IF NOT EXISTS power TEXT,              -- e.g., "15 kW"
ADD COLUMN IF NOT EXISTS energy_sources TEXT[],   -- Array of strings: ['ELETRICA', 'PNEUMATICA', 'HIDRAULICA']
ADD COLUMN IF NOT EXISTS productivity_capacity TEXT, -- e.g., "1000 pçs/hora"
ADD COLUMN IF NOT EXISTS limits TEXT;             -- Description of machine limits (ISO 12100)

-- 2. Risk Entries: Add Safety Category and Performance Level
-- Based on NBR 14153 (Cat B, 1, 2, 3, 4) and ISO 13849 (PL a, b, c, d, e)
ALTER TABLE risk_entries
ADD COLUMN IF NOT EXISTS safety_category TEXT,    -- 'B', '1', '2', '3', '4'
ADD COLUMN IF NOT EXISTS performance_level TEXT;  -- 'a', 'b', 'c', 'd', 'e'

-- 3. Action Items: Add Discipline
DO $$ BEGIN
    CREATE TYPE action_discipline AS ENUM ('MECHANICAL', 'ELECTRICAL', 'AUTOMATION', 'HYDRAULIC', 'PNEUMATIC', 'OPERATIONAL', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE action_items
ADD COLUMN IF NOT EXISTS discipline action_discipline DEFAULT 'OTHER';

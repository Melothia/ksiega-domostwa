-- ============================================
-- Migracja 14: Dodaj kolumnę payload do chronicle
-- ============================================

-- Dodaj kolumnę payload typu JSONB
ALTER TABLE chronicle
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;

-- Zweryfikuj dodanie kolumny
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chronicle' 
  AND column_name = 'payload';

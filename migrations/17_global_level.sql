-- ============================================
-- Migracja 17: Poziom globalny (nie resetowany)
-- ============================================

-- Dodaj kolumny do tabeli players
ALTER TABLE players
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xp_required INTEGER DEFAULT 100;

-- Przenieś obecne poziomy z monthly_progress do players (jeśli istnieją)
UPDATE players p
SET 
  level = mp.level,
  total_xp = (mp.xp + (mp.xp_required * (mp.level - 1))),
  xp_required = mp.xp_required
FROM monthly_progress mp
WHERE p.id = mp.player_id;

-- Usuń kolumny level i xp_required z monthly_progress (zostaje tylko miesięczny XP)
ALTER TABLE monthly_progress
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS xp_required;

-- Zweryfikuj strukturę
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name IN ('level', 'total_xp', 'xp_required');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'monthly_progress';

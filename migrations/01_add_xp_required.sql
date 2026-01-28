-- ============================================
-- KROK 1: Dodanie kolumny xp_required
-- ============================================

-- Dodaj kolumnę xp_required do monthly_progress
ALTER TABLE public.monthly_progress 
ADD COLUMN IF NOT EXISTS xp_required INTEGER NOT NULL DEFAULT 100;

-- ============================================
-- KROK 2: Przelicz xp_required dla istniejących graczy
-- ============================================

-- Ustaw wartości na podstawie aktualnego poziomu
-- Wzór: 100 * 1.2^(level-1)
UPDATE public.monthly_progress
SET xp_required = FLOOR(100 * POWER(1.2, level - 1));

-- ============================================
-- KROK 3: Sprawdź wynik
-- ============================================

SELECT 
  p.nick,
  mp.level,
  mp.xp,
  mp.xp_required,
  CONCAT(mp.xp, '/', mp.xp_required) as progress_display
FROM monthly_progress mp
JOIN players p ON mp.player_id = p.id
ORDER BY mp.level DESC, mp.xp DESC;

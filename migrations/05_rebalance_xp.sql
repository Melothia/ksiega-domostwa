-- ============================================
-- Rebalans XP dla questów - osiągnięcie 10 lvl w ~2-3 miesiące
-- ============================================

-- System poziomów (dla odniesienia):
-- Level 1→2: 100 XP
-- Level 2→3: 120 XP
-- Level 3→4: 144 XP
-- Level 4→5: 173 XP
-- Level 5→6: 207 XP
-- Level 6→7: 249 XP
-- Level 7→8: 299 XP
-- Level 8→9: 358 XP
-- Level 9→10: 430 XP
-- SUMA do lvl 10: ~2080 XP

-- Założenia:
-- - 4 graczy dzielących się questami
-- - Każdy robi ~50% questów miesięcznie
-- - 10 level osiągalny w 2-3 miesiące (700-1000 XP/miesiąc)
-- - Emergency +30% jako bonus za punctualność

-- ============================================
-- QUESTY CODZIENNE (1-2 dni) - fundament
-- ============================================

-- Wynoszenie śmieci (co 2 dni, 15x/mies = 225 XP)
UPDATE quests SET base_xp = 15 
WHERE name = 'Wynoszenie śmieci';

-- Odkurzanie (co 2 dni, 15x/mies = 300 XP)
UPDATE quests SET base_xp = 20 
WHERE name = 'Odkurzanie';

-- Szybkie ogarnięcie (codziennie, 30x/mies = 300 XP)
UPDATE quests SET base_xp = 10 
WHERE name = 'Szybkie ogólne ogarnięcie przestrzeni wspólnej';

-- Mycie przedpokoju zima (codziennie, 30x/mies = 300 XP)
UPDATE quests SET base_xp = 10 
WHERE name = 'Mycie przedpokoju (zima)';

-- ============================================
-- QUESTY COTYGODNIOWE (7 dni) - regularne
-- ============================================

-- Czesanie kota (co 7 dni, 4x/mies = 120 XP)
UPDATE quests SET base_xp = 30 
WHERE name = 'Czesanie kota';

-- ============================================
-- QUESTY CO 2 TYGODNIE (14 dni) - średnie
-- ============================================

-- Mycie kuchni (co 14 dni, 2x/mies = 140 XP)
UPDATE quests SET base_xp = 70 
WHERE name = 'Mycie kuchni';

-- Mycie łazienki - wanna (co 14 dni, 2x/mies = 140 XP)
UPDATE quests SET base_xp = 70 
WHERE name = 'Mycie łazienki (wanna)';

-- Mycie łazienki - prysznic (co 14 dni, 2x/mies = 140 XP)
UPDATE quests SET base_xp = 70 
WHERE name = 'Mycie łazienki (prysznic)';

-- Wycieranie kurzu (co 14 dni, 2x/mies = 100 XP)
UPDATE quests SET base_xp = 50 
WHERE name = 'Wycieranie kurzu';

-- ============================================
-- QUESTY MIESIĘCZNE (30 dni) - większe
-- ============================================

-- Mycie luster (co 30 dni, 1x/mies = 100 XP)
UPDATE quests SET base_xp = 100 
WHERE name = 'Mycie luster';

-- Odkurzanie sofy (co 30 dni, 1x/mies = 100 XP)
UPDATE quests SET base_xp = 100 
WHERE name = 'Odkurzanie sofy';

-- Sprzątanie tarasu (co 30 dni, 1x/mies = 150 XP, grupowy)
UPDATE quests SET base_xp = 150 
WHERE name = 'Sprzątanie tarasu';

-- Zamiatanie/Mycie podłóg (co 30 dni, 1x/mies = 150 XP, grupowy)
UPDATE quests SET base_xp = 150 
WHERE name = 'Zamiatanie / Mycie podłóg';

-- ============================================
-- QUESTY 2-MIESIĘCZNE (60 dni) - rzadkie
-- ============================================

-- Pranie dywaników (co 60 dni, 0.5x/mies = 75 XP)
UPDATE quests SET base_xp = 150 
WHERE name = 'Pranie dywaników łazienkowych';

-- ============================================
-- QUESTY KWARTALNE (90 dni) - rzadkie
-- ============================================

-- Mycie okien (co 90 dni, 0.33x/mies = 100 XP, grupowy)
UPDATE quests SET base_xp = 300 
WHERE name = 'Mycie okien';

-- Mycie schodów (co 90 dni, 0.33x/mies = 67 XP)
UPDATE quests SET base_xp = 200 
WHERE name = 'Mycie schodów';

-- Sprawdzanie dat (lodówka) (co 90 dni, 0.33x/mies = 50 XP)
UPDATE quests SET base_xp = 150 
WHERE name = 'Sprawdzanie dat ważności (lodówka)';

-- ============================================
-- QUESTY PÓŁROCZNE (180 dni) - epicki
-- ============================================

-- Pranie kocy (co 180 dni, 0.16x/mies = 50 XP)
UPDATE quests SET base_xp = 300 
WHERE name = 'Pranie kocy';

-- Mycie piekarnika (co 180 dni, 0.16x/mies = 67 XP)
UPDATE quests SET base_xp = 400 
WHERE name = 'Mycie piekarnika';

-- Mycie zmywarki (co 180 dni, 0.16x/mies = 67 XP)
UPDATE quests SET base_xp = 400 
WHERE name = 'Mycie zmywarki';

-- Sprawdzanie dat (leki) (co 180 dni, 0.16x/mies = 33 XP)
UPDATE quests SET base_xp = 200 
WHERE name = 'Sprawdzanie dat ważności (leki)';

-- ============================================
-- QUESTY ROCZNE (365 dni) - legendarny
-- ============================================

-- Mycie żyrandoli (co 365 dni, 0.08x/mies = 42 XP)
UPDATE quests SET base_xp = 500 
WHERE name = 'Mycie żyrandoli i lamp';

-- Mycie lodówki (co 365 dni, 0.08x/mies = 42 XP)
UPDATE quests SET base_xp = 500 
WHERE name = 'Mycie lodówki';

-- ============================================
-- Podsumowanie miesięcznego potencjału XP
-- ============================================

-- Wyświetl podsumowanie
SELECT 
  name,
  frequency_days,
  base_xp,
  FLOOR(base_xp * 1.3) as emergency_xp,
  quest_type,
  -- Ile razy w miesiącu (30 dni)
  CASE 
    WHEN frequency_days <= 30 THEN FLOOR(30.0 / frequency_days)
    ELSE 0
  END as times_per_month,
  -- Miesięczny potencjał XP
  CASE 
    WHEN frequency_days <= 30 THEN base_xp * FLOOR(30.0 / frequency_days)
    ELSE FLOOR(base_xp * 30.0 / frequency_days)
  END as monthly_xp_potential
FROM quests
WHERE active = true
ORDER BY frequency_days ASC, base_xp DESC;

-- ============================================
-- KALKULACJA CAŁKOWITEGO POTENCJAŁU
-- ============================================

SELECT 
  'SUMA MIESIĘCZNA (gdyby jedna osoba robiła wszystko)' as info,
  SUM(
    CASE 
      WHEN frequency_days <= 30 THEN base_xp * FLOOR(30.0 / frequency_days)
      ELSE FLOOR(base_xp * 30.0 / frequency_days)
    END
  ) as total_monthly_xp,
  '~700-1000 XP/os przy 4 graczach dzielących się' as expected_per_player
FROM quests
WHERE active = true;

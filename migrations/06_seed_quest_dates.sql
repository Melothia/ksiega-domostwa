-- ============================================
-- Ustawienie początkowych dat wykonania questów
-- Cel: Rozłożenie questów w czasie, żeby nie wszystkie były dostępne od razu
-- ============================================

-- Dzisiejsza data: 2026-01-28
-- Strategia:
-- 1. Questy codzienne/2-dniowe: niedawno wykonane (dostępne za 1-2 dni)
-- 2. Questy tygodniowe: rozłożone przez ostatni tydzień
-- 3. Questy 2-tygodniowe: rozłożone przez ostatnie 2 tygodnie
-- 4. Questy miesięczne: rozłożone przez ostatni miesiąc
-- 5. Questy rzadkie (>60 dni): rozłożone tak, żeby wpadały w różne miesiące

-- ============================================
-- QUESTY CODZIENNE I 2-DNIOWE
-- Ostatnie wykonanie: wczoraj/przedwczoraj (dostępne teraz lub wkrótce)
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
SELECT 
  q.id,
  (SELECT id FROM players LIMIT 1), -- pierwszy gracz jako "wykonujący"
  '2026-01-27'::timestamp - (random() * INTERVAL '1 day'),
  q.base_xp,
  false,
  false
FROM quests q
WHERE q.frequency_days <= 2 AND q.active = true;

-- ============================================
-- QUESTY TYGODNIOWE (7 dni)
-- Rozłożone: 1-7 dni temu
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
SELECT 
  q.id,
  (SELECT id FROM players LIMIT 1),
  '2026-01-28'::timestamp - (q.frequency_days || ' days')::interval + (random() * INTERVAL '3 days'),
  q.base_xp,
  false,
  false
FROM quests q
WHERE q.frequency_days = 7 AND q.active = true;

-- ============================================
-- QUESTY 2-TYGODNIOWE (14 dni)
-- Rozłożone równomiernie: niektóre dostępne teraz, inne za tydzień
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Mycie kuchni - dostępne za 7 dni
  ((SELECT id FROM quests WHERE name = 'Mycie kuchni'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-21'::timestamp, 30, false, false),
  
  -- Mycie łazienki wanna - dostępne za 3 dni
  ((SELECT id FROM quests WHERE name = 'Mycie łazienki (wanna)'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-17'::timestamp, 30, false, false),
  
  -- Mycie łazienki prysznic - dostępne teraz
  ((SELECT id FROM quests WHERE name = 'Mycie łazienki (prysznic)'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-14'::timestamp, 30, false, false),
  
  -- Wycieranie kurzu - dostępne za 10 dni
  ((SELECT id FROM quests WHERE name = 'Wycieranie kurzu'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-24'::timestamp, 30, false, false);

-- ============================================
-- QUESTY MIESIĘCZNE (30 dni)
-- Rozłożone: niektóre niedawno, niektóre dawno
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Mycie luster - dostępne za 15 dni
  ((SELECT id FROM quests WHERE name = 'Mycie luster'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-13'::timestamp, 50, false, false),
  
  -- Odkurzanie sofy - dostępne za 5 dni
  ((SELECT id FROM quests WHERE name = 'Odkurzanie sofy'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-03'::timestamp, 50, false, false),
  
  -- Sprzątanie tarasu - dostępne za 20 dni
  ((SELECT id FROM quests WHERE name = 'Sprzątanie tarasu'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-18'::timestamp, 100, false, false),
  
  -- Zamiatanie/Mycie podłóg - dostępne teraz
  ((SELECT id FROM quests WHERE name = 'Zamiatanie / Mycie podłóg'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-12-29'::timestamp, 100, false, false);

-- ============================================
-- QUESTY 2-MIESIĘCZNE (60 dni)
-- Rozłożone: różne miesiące dostępności
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Pranie dywaników - dostępny w marcu (60 dni od 28.01 = ~30.03)
  ((SELECT id FROM quests WHERE name = 'Pranie dywaników łazienkowych'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-12-29'::timestamp, 100, false, false);

-- ============================================
-- QUESTY KWARTALNE (90 dni)
-- Rozłożone w różnych miesiącach
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Mycie okien - dostępny w lutym (90 dni temu = początek listopada)
  ((SELECT id FROM quests WHERE name = 'Mycie okien'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-11-30'::timestamp, 200, false, false),
  
  -- Mycie schodów - dostępny w marcu (90 dni od dziś minus 30 dni = luty)
  ((SELECT id FROM quests WHERE name = 'Mycie schodów'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-12-29'::timestamp, 150, false, false),
  
  -- Sprawdzanie dat (lodówka) - dostępny w kwietniu (90 dni od dziś + 30 dni)
  ((SELECT id FROM quests WHERE name = 'Sprawdzanie dat ważności (lodówka)'), 
   (SELECT id FROM players LIMIT 1), 
   '2026-01-28'::timestamp, 100, false, false);

-- ============================================
-- QUESTY PÓŁROCZNE (180 dni)
-- Każdy w innym kwartale roku
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Pranie kocy - dostępny w lipcu (180 dni od stycznia)
  ((SELECT id FROM quests WHERE name = 'Pranie kocy'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-08-01'::timestamp, 200, false, false),
  
  -- Mycie piekarnika - dostępny w kwietniu (180 dni temu = sierpień, +180 = luty)
  ((SELECT id FROM quests WHERE name = 'Mycie piekarnika'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-10-31'::timestamp, 300, false, false),
  
  -- Mycie zmywarki - dostępny w maju (180 dni od listopada = maj)
  ((SELECT id FROM quests WHERE name = 'Mycie zmywarki'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-11-30'::timestamp, 300, false, false),
  
  -- Sprawdzanie dat (leki) - dostępny w czerwcu (180 dni od grudnia)
  ((SELECT id FROM quests WHERE name = 'Sprawdzanie dat ważności (leki)'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-12-29'::timestamp, 150, false, false);

-- ============================================
-- QUESTY ROCZNE (365 dni)
-- Rozłożone w różnych półroczach
-- ============================================

INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded, is_emergency, is_coop)
VALUES
  -- Mycie żyrandoli - dostępny w lipcu (365 dni od lipca 2025)
  ((SELECT id FROM quests WHERE name = 'Mycie żyrandoli i lamp'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-07-28'::timestamp, 400, false, false),
  
  -- Mycie lodówki - dostępny w grudniu (365 dni od grudnia 2025)
  ((SELECT id FROM quests WHERE name = 'Mycie lodówki'), 
   (SELECT id FROM players LIMIT 1), 
   '2025-12-28'::timestamp, 400, false, false);

-- ============================================
-- Sprawdź wynik - kiedy questy będą dostępne
-- ============================================

SELECT 
  q.name,
  q.frequency_days,
  qc.completed_at as last_completed,
  (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) as next_available,
  CASE 
    WHEN NOW() < (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) THEN 
      '⏳ Nadchodzący (za ' || 
      EXTRACT(DAY FROM (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) - NOW()) || ' dni)'
    WHEN NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL + (q.emergency_after_days || ' days')::INTERVAL) THEN 
      '🚨 Emergency!'
    ELSE 
      '✅ Do wykonania'
  END as status
FROM quests q
LEFT JOIN LATERAL (
  SELECT completed_at 
  FROM quest_completions 
  WHERE quest_id = q.id 
  ORDER BY completed_at DESC 
  LIMIT 1
) qc ON TRUE
WHERE q.active = true
ORDER BY 
  CASE 
    WHEN NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) THEN 0
    ELSE 1
  END,
  q.frequency_days ASC;

-- ============================================
-- FULL RESET - Poziomy, osiągnięcia, paragony, rozłożenie questów
-- ============================================

-- ========== 1. RESET POZIOMÓW ==========
UPDATE players
SET 
  level = 1,
  total_xp = 0,
  xp_required = 100;

-- ========== 2. RESET MIESIĘCZNEGO PROGRESSU ==========
UPDATE monthly_progress
SET xp = 0;

-- ========== 3. WYCZYŚĆ OSIĄGNIĘCIA ==========
DELETE FROM player_achievements;

-- ========== 4. WYCZYŚĆ PARAGONY ==========
DELETE FROM receipts;

-- ========== 5. WYCZYŚĆ QUEST COMPLETIONS ==========
DELETE FROM quest_completions;

-- ========== 6. WYCZYŚĆ KRONIKĘ ==========
DELETE FROM chronicle;

-- ========== 7. WYCZYŚĆ MONTHLY WINNERS ==========
DELETE FROM monthly_winners;

-- ========== 8. ROZŁÓŻ QUESTY W CZASIE ==========
-- Dodaj quest completions z różnymi datami aby questy były rozłożone zgodnie z frequency_days

-- Wszystkie questy aktywne
UPDATE quests SET active = true;

-- Dla każdego questa dodaj completion z datą wstecz, tak aby był dostępny w różnym czasie
-- Formula: completed_at = NOW() - (frequency_days * random_multiplier) days

WITH quest_schedule AS (
  SELECT 
    id,
    name,
    frequency_days,
    -- Rozłóż questy na przestrzeni 3x ich częstotliwości
    CASE 
      WHEN ROW_NUMBER() OVER (ORDER BY name) % 5 = 0 THEN frequency_days * 0.5  -- Dostępne teraz (połowa czasu)
      WHEN ROW_NUMBER() OVER (ORDER BY name) % 5 = 1 THEN frequency_days * 1.2  -- Za kilka dni
      WHEN ROW_NUMBER() OVER (ORDER BY name) % 5 = 2 THEN frequency_days * 2.0  -- Za dłużej
      WHEN ROW_NUMBER() OVER (ORDER BY name) % 5 = 3 THEN frequency_days * 0.1  -- Niedawno wykonane
      ELSE frequency_days * 3.0  -- Dawno temu
    END as days_ago
  FROM quests
  WHERE active = true
)
INSERT INTO quest_completions (quest_id, player_id, xp_awarded, completed_at, is_emergency, is_coop)
SELECT 
  qs.id,
  (SELECT id FROM players ORDER BY RANDOM() LIMIT 1),  -- Losowy gracz
  (SELECT base_xp FROM quests WHERE id = qs.id),
  NOW() - (qs.days_ago || ' days')::INTERVAL,
  false,
  false
FROM quest_schedule qs
WHERE qs.days_ago IS NOT NULL;

-- ========== WERYFIKACJA ==========
SELECT 'PLAYERS' as table_name, COUNT(*) as count, AVG(level) as avg_level, AVG(total_xp) as avg_xp FROM players
UNION ALL
SELECT 'MONTHLY_PROGRESS', COUNT(*), AVG(xp), 0 FROM monthly_progress
UNION ALL
SELECT 'PLAYER_ACHIEVEMENTS', COUNT(*), 0, 0 FROM player_achievements
UNION ALL
SELECT 'RECEIPTS', COUNT(*), 0, 0 FROM receipts
UNION ALL
SELECT 'QUEST_COMPLETIONS', COUNT(*), 0, 0 FROM quest_completions
UNION ALL
SELECT 'CHRONICLE', COUNT(*), 0, 0 FROM chronicle
UNION ALL
SELECT 'MONTHLY_WINNERS', COUNT(*), 0, 0 FROM monthly_winners;

-- Pokaż dostępne questy
SELECT 
  q.name,
  q.base_xp,
  q.time_minutes,
  q.max_slots,
  COUNT(qc.id) as times_completed
FROM quests q
LEFT JOIN quest_completions qc ON qc.quest_id = q.id
WHERE q.active = true
GROUP BY q.id, q.name, q.base_xp, q.time_minutes, q.max_slots
ORDER BY q.name;

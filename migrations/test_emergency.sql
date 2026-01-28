-- ============================================
-- TEST EMERGENCY QUEST
-- Ten skrypt symuluje przeterminowane zadanie
-- ============================================

-- Sprawdź obecny stan questów
SELECT 
  q.name,
  q.frequency_days,
  qc.completed_at,
  NOW() - qc.completed_at AS time_since_completion,
  (q.frequency_days || ' days')::INTERVAL + INTERVAL '48 hours' AS emergency_threshold
FROM quests q
LEFT JOIN LATERAL (
  SELECT completed_at 
  FROM quest_completions 
  WHERE quest_id = q.id 
  ORDER BY completed_at DESC 
  LIMIT 1
) qc ON TRUE
ORDER BY q.frequency_days ASC
LIMIT 10;

-- ===========================================
-- Symuluj quest "Zmywanie naczyń" jako emergency
-- (częstotliwość: 1 dzień, więc emergency po 3 dniach)
-- ===========================================

-- 1. Znajdź quest "Zmywanie naczyń" (lub inny z niską częstotliwością)
DO $$
DECLARE
  v_quest_id UUID;
  v_player_id UUID;
BEGIN
  -- Pobierz quest z najniższą częstotliwością
  SELECT id INTO v_quest_id 
  FROM quests 
  ORDER BY frequency_days ASC 
  LIMIT 1;
  
  -- Pobierz pierwszego gracza
  SELECT id INTO v_player_id 
  FROM players 
  LIMIT 1;
  
  -- Usuń stare completion dla tego questa (aby uniknąć konfliktów)
  DELETE FROM quest_completions 
  WHERE quest_id = v_quest_id;
  
  -- Dodaj completion sprzed 5 dni (dla questa z frequency_days=1 to wystarczy dla emergency)
  INSERT INTO quest_completions (quest_id, player_id, completed_at, xp_awarded)
  VALUES (
    v_quest_id,
    v_player_id,
    NOW() - INTERVAL '5 days',
    20
  );
  
  RAISE NOTICE 'Dodano testowe completion sprzed 5 dni dla questa: %', v_quest_id;
END $$;

-- 2. Sprawdź status - quest powinien być teraz emergency
SELECT 
  q.name,
  q.frequency_days,
  qc.completed_at AS last_completed,
  NOW() - qc.completed_at AS time_passed,
  (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) AS should_be_available,
  (qc.completed_at + (q.frequency_days || ' days')::INTERVAL + INTERVAL '48 hours') AS emergency_after,
  CASE
    WHEN NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL + INTERVAL '48 hours') THEN '🚨 EMERGENCY'
    WHEN NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) THEN '✅ ACTIVE'
    ELSE '⏳ UPCOMING'
  END AS status
FROM quests q
LEFT JOIN LATERAL (
  SELECT completed_at 
  FROM quest_completions 
  WHERE quest_id = q.id 
  ORDER BY completed_at DESC 
  LIMIT 1
) qc ON TRUE
WHERE qc.completed_at IS NOT NULL
ORDER BY qc.completed_at ASC
LIMIT 5;

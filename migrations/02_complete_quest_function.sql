-- ============================================
-- Funkcja: complete_quest
-- Wykonanie questa + naliczenie XP + automatyczny level up
-- ============================================

-- Usuń starą funkcję jeśli istnieje
DROP FUNCTION IF EXISTS public.complete_quest(UUID, UUID);

CREATE OR REPLACE FUNCTION public.complete_quest(
  p_player_id UUID,
  p_quest_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_quest RECORD;
  v_xp_earned INTEGER;
  v_is_emergency BOOLEAN := FALSE;
  v_progress RECORD;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_new_xp_required INTEGER;
  v_levelups INTEGER := 0;
BEGIN
  -- Pobierz dane questa
  SELECT * INTO v_quest FROM quests WHERE id = p_quest_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;
  
  -- Sprawdź czy emergency
  -- Quest jest emergency jeśli minęło emergency_after_days dni od ostatniego wykonania
  SELECT 
    CASE 
      WHEN qc.completed_at IS NOT NULL AND 
           NOW() >= (qc.completed_at + (v_quest.frequency_days || ' days')::INTERVAL + (v_quest.emergency_after_days || ' days')::INTERVAL)
      THEN TRUE
      ELSE FALSE
    END
  INTO v_is_emergency
  FROM (
    SELECT completed_at 
    FROM quest_completions 
    WHERE quest_id = p_quest_id AND player_id = p_player_id
    ORDER BY completed_at DESC 
    LIMIT 1
  ) qc;
  
  -- Jeśli brak poprzedniego wykonania, nie jest emergency
  v_is_emergency := COALESCE(v_is_emergency, FALSE);
  
  -- Oblicz XP (emergency daje +30%)
  v_xp_earned := CASE 
    WHEN v_is_emergency THEN FLOOR(v_quest.base_xp * 1.3)
    ELSE v_quest.base_xp 
  END;
  
  -- Zapisz completion do historii
  INSERT INTO quest_completions (
    quest_id, 
    player_id, 
    xp_awarded, 
    is_emergency,
    is_coop,
    completed_at
  )
  VALUES (
    p_quest_id, 
    p_player_id, 
    v_xp_earned, 
    v_is_emergency,
    FALSE,
    NOW()
  );
  
  -- Pobierz aktualny progress gracza
  SELECT * INTO v_progress
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player progress not found';
  END IF;
  
  -- Dodaj XP
  v_new_xp := v_progress.xp + v_xp_earned;
  v_new_level := v_progress.level;
  v_new_xp_required := v_progress.xp_required;
  
  -- Sprawdź level up (może być kilka levelów na raz)
  WHILE v_new_xp >= v_new_xp_required LOOP
    v_new_xp := v_new_xp - v_new_xp_required;
    v_new_level := v_new_level + 1;
    v_new_xp_required := FLOOR(v_new_xp_required * 1.2);
    v_levelups := v_levelups + 1;
  END LOOP;
  
  -- Aktualizuj progress
  UPDATE monthly_progress
  SET 
    xp = v_new_xp,
    level = v_new_level,
    xp_required = v_new_xp_required
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Jeśli był level up, dodaj do kroniki
  IF v_levelups > 0 THEN
    INSERT INTO chronicle (player_id, type, message, created_at)
    VALUES (
      p_player_id,
      'level_up',
      'Awansował(a) na poziom ' || v_new_level,
      NOW()
    );
  END IF;
  
  -- Dodaj wykonanie questa do kroniki
  INSERT INTO chronicle (player_id, type, message, created_at)
  VALUES (
    p_player_id,
    'quest_complete',
    'Wykonał(a): ' || v_quest.name || ' (' || v_xp_earned || ' XP' || 
      CASE WHEN v_is_emergency THEN ' 🚨)' ELSE ')' END,
    NOW()
  );
  
  -- Zwróć info o wykonaniu
  RETURN json_build_object(
    'success', TRUE,
    'xp_earned', v_xp_earned,
    'was_emergency', v_is_emergency,
    'levelups', v_levelups,
    'new_level', v_new_level,
    'new_xp', v_new_xp,
    'new_xp_required', v_new_xp_required
  );
  
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funkcja: complete_group_quest
-- Wykonanie questa przez dwóch graczy
-- ============================================

-- Usuń starą funkcję jeśli istnieje
DROP FUNCTION IF EXISTS public.complete_group_quest(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION public.complete_group_quest(
  p_player_1 UUID,
  p_player_2 UUID,
  p_quest_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result_1 JSON;
  v_result_2 JSON;
BEGIN
  -- Wykonaj dla obu graczy
  SELECT complete_quest(p_player_1, p_quest_id) INTO v_result_1;
  SELECT complete_quest(p_player_2, p_quest_id) INTO v_result_2;
  
  -- Dodaj wspólny wpis do kroniki
  INSERT INTO chronicle (player_id, type, message, created_at)
  SELECT p.id, 'quest_coop', 'Wykonali razem quest grupowy', NOW()
  FROM players p
  WHERE p.id IN (p_player_1, p_player_2);
  
  -- Zwróć oba wyniki
  RETURN json_build_object(
    'success', TRUE,
    'player_1', v_result_1,
    'player_2', v_result_2
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Test funkcji
-- ============================================

-- Pobierz ID pierwszego gracza i questa
DO $$
DECLARE
  v_player_id UUID;
  v_quest_id UUID;
  v_result JSON;
BEGIN
  SELECT id INTO v_player_id FROM players LIMIT 1;
  SELECT id INTO v_quest_id FROM quests LIMIT 1;
  
  RAISE NOTICE 'Testing complete_quest for player % and quest %', v_player_id, v_quest_id;
  
  -- Test: nie wykonuj naprawdę, tylko sprawdź czy funkcja istnieje
  -- SELECT complete_quest(v_player_id, v_quest_id) INTO v_result;
  -- RAISE NOTICE 'Result: %', v_result;
END $$;

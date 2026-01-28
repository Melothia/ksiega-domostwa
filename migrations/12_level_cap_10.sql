-- ============================================
-- NAPRAW LEVEL CAP NA 10 I WYBÓR GRACZA MIESIĄCA
-- ============================================

-- Zaktualizuj complete_quest - zatrzymaj levelowanie na poziomie 10
DROP FUNCTION IF EXISTS complete_quest(UUID, UUID);

CREATE OR REPLACE FUNCTION complete_quest(
  p_player_id UUID,
  p_quest_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_base_xp INTEGER;
  v_xp_earned INTEGER;
  v_is_emergency BOOLEAN := FALSE;
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_xp_required INTEGER;
  v_new_level INTEGER;
  v_quest_name TEXT;
  v_player_nick TEXT;
BEGIN
  -- Pobierz dane questa i gracza
  SELECT base_xp, name INTO v_base_xp, v_quest_name FROM quests WHERE id = p_quest_id;
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;
  
  -- Sprawdź czy emergency
  SELECT 
    CASE 
      WHEN qc.completed_at IS NOT NULL AND 
           NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL + INTERVAL '48 hours')
      THEN TRUE
      ELSE FALSE
    END
  INTO v_is_emergency
  FROM quests q
  LEFT JOIN LATERAL (
    SELECT completed_at 
    FROM quest_completions 
    WHERE quest_id = p_quest_id 
    ORDER BY completed_at DESC 
    LIMIT 1
  ) qc ON TRUE
  WHERE q.id = p_quest_id;
  
  -- Oblicz XP
  v_xp_earned := CASE WHEN v_is_emergency THEN FLOOR(v_base_xp * 1.3) ELSE v_base_xp END;
  
  -- Zapisz completion
  INSERT INTO quest_completions (quest_id, player_id, xp_earned, was_emergency)
  VALUES (p_quest_id, p_player_id, v_xp_earned, v_is_emergency);
  
  -- KRONIKA: Wykonanie zadania
  PERFORM add_chronicle_entry(
    'quest_solo',
    v_player_nick || ' wykonał(a) zadanie: ' || v_quest_name,
    p_player_id,
    jsonb_build_object('quest', v_quest_name, 'xp', v_xp_earned, 'emergency', v_is_emergency)
  );
  
  -- Pobierz obecny stan
  SELECT xp, level, xp_required INTO v_current_xp, v_current_level, v_xp_required
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Aktualizuj progress
  v_current_xp := v_current_xp + v_xp_earned;
  v_new_level := v_current_level;
  
  -- Sprawdź level up (TYLKO DO POZIOMU 10)
  WHILE v_current_xp >= v_xp_required AND v_new_level < 10 LOOP
    v_current_xp := v_current_xp - v_xp_required;
    v_new_level := v_new_level + 1;
    v_xp_required := FLOOR(v_xp_required * 1.2);
    
    -- KRONIKA: Nowy poziom
    PERFORM add_chronicle_entry(
      'level_up',
      v_player_nick || ' awansował(a) na poziom ' || v_new_level,
      p_player_id,
      jsonb_build_object('level', v_new_level)
    );
  END LOOP;
  
  UPDATE monthly_progress
  SET xp = v_current_xp, level = v_new_level, xp_required = v_xp_required
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

-- Zaktualizuj add_receipt - zatrzymaj levelowanie na poziomie 10
DROP FUNCTION IF EXISTS add_receipt(UUID, TEXT, NUMERIC);

CREATE OR REPLACE FUNCTION add_receipt(
  p_player_id UUID,
  p_store TEXT,
  p_amount NUMERIC
)
RETURNS VOID AS $$
DECLARE
  v_xp_reward INTEGER := 50;
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_xp_required INTEGER;
  v_new_level INTEGER;
  v_player_nick TEXT;
BEGIN
  -- Pobierz nick gracza
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;
  
  -- Dodaj paragon
  INSERT INTO receipts (store, amount, added_by, xp_awarded)
  VALUES (p_store, p_amount, p_player_id, v_xp_reward);
  
  -- KRONIKA: Dodanie paragonu
  PERFORM add_chronicle_entry(
    'receipt',
    v_player_nick || ' dodał(a) paragon z ' || p_store || ' (' || p_amount || ' zł)',
    p_player_id,
    jsonb_build_object('store', p_store, 'amount', p_amount)
  );
  
  -- Pobierz obecny stan
  SELECT xp, level, xp_required INTO v_current_xp, v_current_level, v_xp_required
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Aktualizuj XP
  v_current_xp := v_current_xp + v_xp_reward;
  v_new_level := v_current_level;
  
  -- Sprawdź level up (TYLKO DO POZIOMU 10)
  WHILE v_current_xp >= v_xp_required AND v_new_level < 10 LOOP
    v_current_xp := v_current_xp - v_xp_required;
    v_new_level := v_new_level + 1;
    v_xp_required := FLOOR(v_xp_required * 1.2);
    
    -- KRONIKA: Nowy poziom
    PERFORM add_chronicle_entry(
      'level_up',
      v_player_nick || ' awansował(a) na poziom ' || v_new_level,
      p_player_id,
      jsonb_build_object('level', v_new_level)
    );
  END LOOP;
  
  UPDATE monthly_progress
  SET xp = v_current_xp, level = v_new_level, xp_required = v_xp_required
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

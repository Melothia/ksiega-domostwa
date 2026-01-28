-- ============================================
-- Migracja 18: Zaktualizuj complete_quest dla globalnego poziomu
-- ============================================

DROP FUNCTION IF EXISTS complete_quest(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION complete_quest(
  p_player_id UUID,
  p_quest_id UUID,
  p_is_coop BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  v_base_xp INTEGER;
  v_xp_earned INTEGER;
  v_is_emergency BOOLEAN := FALSE;
  v_quest_name TEXT;
  v_quest_time INTEGER;
  v_player_nick TEXT;
  
  -- Globalny poziom (w players)
  v_global_level INTEGER;
  v_global_xp INTEGER;
  v_global_xp_required INTEGER;
  v_new_level INTEGER;
  
  -- Miesięczny XP (w monthly_progress)
  v_monthly_xp INTEGER;
BEGIN
  -- Pobierz dane questa i gracza
  SELECT base_xp, name, time_minutes INTO v_base_xp, v_quest_name, v_quest_time FROM quests WHERE id = p_quest_id;
  SELECT nick, level, total_xp, xp_required INTO v_player_nick, v_global_level, v_global_xp, v_global_xp_required FROM players WHERE id = p_player_id;
  
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
  INSERT INTO quest_completions (quest_id, player_id, xp_awarded, is_coop, is_emergency)
  VALUES (p_quest_id, p_player_id, v_xp_earned, p_is_coop, v_is_emergency);
  
  -- KRONIKA: Wykonanie zadania
  BEGIN
    PERFORM add_chronicle_entry(
      'quest_solo',
      v_player_nick || ' wykonał(a) zadanie: ' || v_quest_name,
      p_player_id,
      jsonb_build_object('quest', v_quest_name, 'xp', v_xp_earned, 'emergency', v_is_emergency)
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
  
  -- ========== GLOBALNY POZIOM (nie resetowany) ==========
  v_global_xp := v_global_xp + v_xp_earned;
  v_new_level := v_global_level;
  
  -- Sprawdź level up (TYLKO DO POZIOMU 10)
  WHILE v_global_xp >= v_global_xp_required AND v_new_level < 10 LOOP
    v_global_xp := v_global_xp - v_global_xp_required;
    v_new_level := v_new_level + 1;
    v_global_xp_required := FLOOR(v_global_xp_required * 1.2);
    
    -- KRONIKA: Nowy poziom
    BEGIN
      PERFORM add_chronicle_entry(
        'level_up',
        v_player_nick || ' awansował(a) na poziom ' || v_new_level,
        p_player_id,
        jsonb_build_object('level', v_new_level)
      );
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
  
  -- Aktualizuj poziom globalny w players
  UPDATE players
  SET 
    total_xp = (total_xp + v_xp_earned), 
    level = v_new_level, 
    xp_required = v_global_xp_required
  WHERE id = p_player_id;
  
  -- ========== MIESIĘCZNY XP (dla rankingu) ==========
  -- Pobierz obecny miesięczny XP
  SELECT xp INTO v_monthly_xp
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Aktualizuj miesięczny XP
  UPDATE monthly_progress
  SET xp = xp + v_xp_earned
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Sprawdź osiągnięcia
  BEGIN
    PERFORM check_and_unlock_achievements(
      p_player_id => p_player_id,
      p_quest_name => v_quest_name,
      p_quest_time => v_quest_time,
      p_is_emergency => v_is_emergency,
      p_is_coop => p_is_coop,
      p_new_level => v_new_level
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
END;
$$ LANGUAGE plpgsql;

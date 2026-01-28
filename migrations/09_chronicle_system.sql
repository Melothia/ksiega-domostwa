-- ============================================
-- SYSTEM KRONIKI - KOMPLETNY BACKLOG ZDARZEŃ
-- ============================================

-- Dodaj kolumnę payload do tabeli chronicle (jeśli nie istnieje)
ALTER TABLE chronicle ADD COLUMN IF NOT EXISTS payload JSONB;

-- ============================================
-- FUNKCJA: add_chronicle_entry
-- Dodaje wpis do kroniki
-- ============================================
CREATE OR REPLACE FUNCTION add_chronicle_entry(
  p_type TEXT,
  p_message TEXT,
  p_player_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO chronicle (type, message, player_id, payload)
  VALUES (p_type, p_message, p_player_id, p_payload);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ZAKTUALIZUJ complete_quest - dodaj logowanie do kroniki
-- ============================================
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
  
  -- Sprawdź level up
  WHILE v_current_xp >= v_xp_required LOOP
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

-- ============================================
-- ZAKTUALIZUJ add_receipt - dodaj logowanie do kroniki
-- ============================================
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
  
  -- Sprawdź level up
  WHILE v_current_xp >= v_xp_required LOOP
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

-- ============================================
-- FUNKCJA: unlock_achievement
-- Odblokowuje osiągnięcie i dodaje wpis do kroniki
-- ============================================
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_player_id UUID,
  p_achievement_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_player_nick TEXT;
  v_achievement_title TEXT;
BEGIN
  -- Sprawdź czy już odblokowane
  IF EXISTS (
    SELECT 1 FROM player_achievements 
    WHERE player_id = p_player_id AND achievement_id = p_achievement_id
  ) THEN
    RETURN;
  END IF;
  
  -- Pobierz dane
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;
  SELECT title INTO v_achievement_title FROM achievements WHERE id = p_achievement_id;
  
  -- Odblokuj osiągnięcie
  INSERT INTO player_achievements (player_id, achievement_id)
  VALUES (p_player_id, p_achievement_id);
  
  -- KRONIKA: Zdobycie osiągnięcia
  PERFORM add_chronicle_entry(
    'achievement',
    v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement_title,
    p_player_id,
    jsonb_build_object('title', v_achievement_title)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJA: set_monthly_winner
-- Ustawia gracza miesiąca i dodaje wpis do kroniki
-- ============================================
CREATE OR REPLACE FUNCTION set_monthly_winner(
  p_player_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_player_nick TEXT;
  v_reward TEXT;
BEGIN
  -- Pobierz nick gracza
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;
  
  -- Określ nagrodę na podstawie nicku
  v_reward := CASE v_player_nick
    WHEN 'Reu' THEN 'Wyjście do kina'
    WHEN 'Melothy' THEN 'Wieczór planszówkowy'
    WHEN 'Pshemcky' THEN 'Wspólna aktywność sportowa'
    WHEN 'Benditt' THEN 'Wspólny ramen'
    ELSE 'Nagroda specjalna'
  END;
  
  -- KRONIKA: Gracz miesiąca
  PERFORM add_chronicle_entry(
    'monthly_winner',
    '🏆 ' || v_player_nick || ' został(a) graczem miesiąca! Nagroda: ' || v_reward,
    p_player_id,
    jsonb_build_object('nick', v_player_nick, 'reward', v_reward, 'month', p_month, 'year', p_year)
  );
END;
$$ LANGUAGE plpgsql;

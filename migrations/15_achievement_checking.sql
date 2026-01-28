-- ============================================
-- Migracja 15: Automatyczne sprawdzanie osiągnięć
-- ============================================

-- Funkcja sprawdzająca i przyznająca osiągnięcia po wykonaniu questa
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_player_id UUID,
  p_quest_name TEXT DEFAULT NULL,
  p_quest_time INTEGER DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT FALSE,
  p_is_coop BOOLEAN DEFAULT FALSE,
  p_new_level INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_achievement RECORD;
  v_count INTEGER;
  v_player_nick TEXT;
BEGIN
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;

  -- Iteruj przez wszystkie osiągnięcia
  FOR v_achievement IN 
    SELECT a.id, a.title, a.condition
    FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM player_achievements pa 
      WHERE pa.player_id = p_player_id AND pa.achievement_id = a.id
    )
  LOOP
    
    -- ========== LEVEL 10 ==========
    IF v_achievement.condition ILIKE '%level 10%' AND p_new_level = 10 THEN
      INSERT INTO player_achievements (player_id, achievement_id)
      VALUES (p_player_id, v_achievement.id);
      
      PERFORM add_chronicle_entry(
        'achievement',
        v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
        p_player_id,
        jsonb_build_object('title', v_achievement.title)
      );
      CONTINUE;
    END IF;
    
    -- ========== POJEDYNCZE WYKONANIE ZADANIA ==========
    IF p_quest_name IS NOT NULL 
       AND v_achievement.condition ILIKE '%' || p_quest_name || '%' 
       AND v_achievement.condition NOT ILIKE '%x%'
       AND v_achievement.condition NOT ILIKE '%emergency%'
       AND v_achievement.condition NOT ILIKE '%grupowych%'
       AND v_achievement.condition NOT ILIKE '%≥%'
       AND v_achievement.condition NOT ILIKE '%≤%'
       AND v_achievement.condition NOT ILIKE '%miesiąca%'
       AND v_achievement.condition NOT ILIKE '%po innym%'
       AND v_achievement.condition NOT ILIKE '%epic%' THEN
      
      INSERT INTO player_achievements (player_id, achievement_id)
      VALUES (p_player_id, v_achievement.id);
      
      PERFORM add_chronicle_entry(
        'achievement',
        v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
        p_player_id,
        jsonb_build_object('title', v_achievement.title)
      );
      CONTINUE;
    END IF;
    
    -- ========== WIELOKROTNE WYKONANIE ZADANIA (np. "Mycie okien x3") ==========
    IF v_achievement.condition ~* '(.*) x(\d+)' THEN
      DECLARE
        v_quest_pattern TEXT;
        v_required_count INTEGER;
      BEGIN
        v_quest_pattern := TRIM((regexp_match(v_achievement.condition, '(.*) x(\d+)'))[1]);
        v_required_count := (regexp_match(v_achievement.condition, '(.*) x(\d+)'))[2]::INTEGER;
        
        IF p_quest_name IS NOT NULL AND p_quest_name ILIKE '%' || v_quest_pattern || '%' THEN
          SELECT COUNT(*) INTO v_count
          FROM quest_completions qc
          JOIN quests q ON q.id = qc.quest_id
          WHERE qc.player_id = p_player_id
            AND q.name ILIKE '%' || v_quest_pattern || '%';
          
          IF v_count >= v_required_count THEN
            INSERT INTO player_achievements (player_id, achievement_id)
            VALUES (p_player_id, v_achievement.id);
            
            PERFORM add_chronicle_entry(
              'achievement',
              v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
              p_player_id,
              jsonb_build_object('title', v_achievement.title)
            );
          END IF;
        END IF;
      END;
    END IF;
    
    -- ========== EMERGENCY QUESTY (np. "5 emergency") ==========
    IF v_achievement.condition ~* '(\d+) emergency' THEN
      DECLARE
        v_required_emergency INTEGER;
      BEGIN
        v_required_emergency := (regexp_match(v_achievement.condition, '(\d+) emergency'))[1]::INTEGER;
        
        SELECT COUNT(*) INTO v_count
        FROM quest_completions
        WHERE player_id = p_player_id AND is_emergency = TRUE;
        
        IF v_count >= v_required_emergency THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          PERFORM add_chronicle_entry(
            'achievement',
            v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
            p_player_id,
            jsonb_build_object('title', v_achievement.title)
          );
        END IF;
      END;
    END IF;
    
    -- ========== QUESTY GRUPOWE (np. "5 questów grupowych") ==========
    IF v_achievement.condition ~* '(\d+) quest.*grupowych' THEN
      DECLARE
        v_required_coop INTEGER;
      BEGIN
        v_required_coop := (regexp_match(v_achievement.condition, '(\d+) quest'))[1]::INTEGER;
        
        SELECT COUNT(*) INTO v_count
        FROM quest_completions
        WHERE player_id = p_player_id AND is_coop = TRUE;
        
        IF v_count >= v_required_coop THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          PERFORM add_chronicle_entry(
            'achievement',
            v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
            p_player_id,
            jsonb_build_object('title', v_achievement.title)
          );
        END IF;
      END;
    END IF;
    
    -- ========== QUESTY O OKREŚLONEJ DŁUGOŚCI (np. "10 questów ≥30 min") ==========
    IF v_achievement.condition ~* '(\d+) quest.*[≥>=](\d+)' THEN
      DECLARE
        v_required_count INTEGER;
        v_min_time INTEGER;
      BEGIN
        v_required_count := (regexp_match(v_achievement.condition, '(\d+) quest'))[1]::INTEGER;
        v_min_time := (regexp_match(v_achievement.condition, '[≥>=](\d+)'))[1]::INTEGER;
        
        SELECT COUNT(*) INTO v_count
        FROM quest_completions qc
        JOIN quests q ON q.id = qc.quest_id
        WHERE qc.player_id = p_player_id
          AND q.time_minutes >= v_min_time;
        
        IF v_count >= v_required_count THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          PERFORM add_chronicle_entry(
            'achievement',
            v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
            p_player_id,
            jsonb_build_object('title', v_achievement.title)
          );
        END IF;
      END;
    END IF;
    
    -- ========== QUESTY KRÓTKIE (np. "10 questów ≤25 min") ==========
    IF v_achievement.condition ~* '(\d+) quest.*[≤<=](\d+)' THEN
      DECLARE
        v_required_count INTEGER;
        v_max_time INTEGER;
      BEGIN
        v_required_count := (regexp_match(v_achievement.condition, '(\d+) quest'))[1]::INTEGER;
        v_max_time := (regexp_match(v_achievement.condition, '[≤<=](\d+)'))[1]::INTEGER;
        
        SELECT COUNT(*) INTO v_count
        FROM quest_completions qc
        JOIN quests q ON q.id = qc.quest_id
        WHERE qc.player_id = p_player_id
          AND q.time_minutes <= v_max_time;
        
        IF v_count >= v_required_count THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          PERFORM add_chronicle_entry(
            'achievement',
            v_player_nick || ' zdobył(a) osiągnięcie: ' || v_achievement.title,
            p_player_id,
            jsonb_build_object('title', v_achievement.title)
          );
        END IF;
      END;
    END IF;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Funkcja sprawdzająca osiągnięcie "Gracz miesiąca"
-- ============================================

CREATE OR REPLACE FUNCTION check_monthly_winner_achievement(
  p_player_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_achievement_id UUID;
  v_player_nick TEXT;
BEGIN
  SELECT nick INTO v_player_nick FROM players WHERE id = p_player_id;
  
  -- Znajdź osiągnięcie "Gracz miesiąca"
  SELECT id INTO v_achievement_id
  FROM achievements
  WHERE condition ILIKE '%gracz miesiąca%'
  LIMIT 1;
  
  IF v_achievement_id IS NOT NULL THEN
    -- Sprawdź czy gracz już ma to osiągnięcie
    IF NOT EXISTS (
      SELECT 1 FROM player_achievements 
      WHERE player_id = p_player_id AND achievement_id = v_achievement_id
    ) THEN
      -- Przyznaj osiągnięcie
      INSERT INTO player_achievements (player_id, achievement_id)
      VALUES (p_player_id, v_achievement_id);
      
      -- Kronika
      PERFORM add_chronicle_entry(
        'achievement',
        v_player_nick || ' zdobył(a) osiągnięcie: Czempion/ka Domostwa',
        p_player_id,
        jsonb_build_object('title', 'Czempion/ka Domostwa')
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

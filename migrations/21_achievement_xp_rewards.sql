-- ============================================
-- Dodaj nagrody XP za osiągnięcia
-- ============================================

-- Dodaj kolumnę xp_reward do tabeli achievements
ALTER TABLE achievements
ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 0;

-- Ustaw nagrody XP dla wszystkich osiągnięć
-- Single quest achievements (podstawowe questy)
UPDATE achievements SET xp_reward = 70 WHERE title IN (
  'Strażnik/czka Chłodu',  -- Mycie lodówki
  'Światłonośca/śna',  -- Mycie żyrandoli
  'Pogromca/czyni Maszyn',  -- Mycie zmywarki
  'Z Piekarodem',  -- Mycie piekarnika
  'Niczym Alladyn',  -- Pranie dywaników
  'Tkacz/ka Komfortu',  -- Pranie koców
  'Wyniesiony/na',  -- Umycie schodów
  'Nieustraszony/a',  -- Sprzątnięcie tarasu
  'Druga Szansa'  -- Uratowanie questa po zgłoszeniu
);

-- Multiple completions (x2, x3, x5, x10, x25 wykonań)
UPDATE achievements SET xp_reward = 100 WHERE title IN (
  'Iluzjonista/tka',  -- Mycie luster x2
  'Wabik',  -- Odkurzanie sofy x2
  'Wszechwiedzący/a',  -- Sprawdzenie dat ważności x2
  'Śliski/a jak gad',  -- Mycie podłóg x3
  'Pan/Pani Widoków',  -- Mycie okien x3
  'Pan/Pani Kuchni',  -- Mycie kuchni x5
  'Władca/czyni Odpływów',  -- Mycie łazienek x5
  'Pogromca/czyni Błota',  -- Mycie przedpokoju (zima) x5
  'Obserwator/ka',  -- Szybkie ogarnięcie x5
  'Opiekun/ka Równowagi',  -- 2 questy po innym graczu
  'Zaklinacz/ka Kurzu',  -- Odkurzanie x10
  'Latający/a na Miotle',  -- Wycieranie kurzy x10
  'Koci/a Zaklinacz/ka',  -- Czesanie kota x10
  'Strażnik/czka Porządku',  -- Wynoszenie śmieci x10
  'Ulubieniec/ica Bestii'  -- Czesanie kota x25
);

-- Emergency quests
UPDATE achievements SET xp_reward = 80 WHERE title IN (
  'Bohater/ka Gildii',  -- Emergency x1 (epicki)
  'Cały/Cała na Biało',  -- Emergency x3
  'Strażnik/czka Natury',  -- Emergency x5
  'Ostatnia Linia Obrony'  -- Emergency x10
);

-- Group quests
UPDATE achievements SET xp_reward = 90 WHERE title IN (
  'Towarzysz/ka Broni',  -- 5 questów grupowych
  'Filary Gildii',  -- 10 questów grupowych
  'Weteran/ka Domostwa'  -- Wspólny epic quest
);

-- Duration (szybkie/długie questy)
UPDATE achievements SET xp_reward = 100 WHERE title IN (
  'Cień Korytarzy',  -- 10 questów ≤25 min
  'Wartownik/czka'  -- 10 questów ≥30 min
);

-- Level 10
UPDATE achievements SET xp_reward = 150 WHERE title = 'Legenda Gildii';  -- Level 10

-- Monthly winner
UPDATE achievements SET xp_reward = 200 WHERE title = 'Czempion/ka Domostwa';  -- Gracz miesiąca

-- Special achievements
UPDATE achievements SET xp_reward = 120 WHERE title = 'Niezłomny/a';  -- 3 miesiące z rzędu

-- Zaktualizuj funkcję check_and_unlock_achievements aby przyznawała XP
CREATE OR REPLACE FUNCTION check_and_unlock_achievements(
  p_player_id UUID,
  p_quest_id UUID DEFAULT NULL,
  p_quest_time INTEGER DEFAULT NULL,
  p_new_level INTEGER DEFAULT NULL,
  p_is_emergency BOOLEAN DEFAULT false,
  p_is_coop BOOLEAN DEFAULT false
)
RETURNS TABLE(achievement_name TEXT, achievement_description TEXT, xp_awarded INTEGER) AS $$
DECLARE
  v_achievement RECORD;
  v_quest_name TEXT;
  v_count INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Jeśli podano quest_id, pobierz nazwę questa
  IF p_quest_id IS NOT NULL THEN
    SELECT name INTO v_quest_name FROM quests WHERE id = p_quest_id;
  END IF;

  -- Iteruj przez wszystkie osiągnięcia
  FOR v_achievement IN SELECT * FROM achievements LOOP
    v_already_unlocked := EXISTS(
      SELECT 1 FROM player_achievements 
      WHERE player_id = p_player_id AND achievement_id = v_achievement.id
    );
    
    IF v_already_unlocked THEN
      CONTINUE;
    END IF;

    -- Sprawdź warunki na podstawie achievement_type
    CASE v_achievement.achievement_type
      -- SINGLE QUEST: ukończ konkretny quest
      WHEN 'single_quest' THEN
        IF v_achievement.quest_name = v_quest_name THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          -- Dodaj XP do gracza
          IF v_achievement.xp_reward > 0 THEN
            UPDATE players 
            SET total_xp = total_xp + v_achievement.xp_reward
            WHERE id = p_player_id;
            
            UPDATE monthly_progress
            SET xp = xp + v_achievement.xp_reward
            WHERE player_id = p_player_id;
          END IF;
          
          achievement_name := v_achievement.name;
          achievement_description := v_achievement.description;
          xp_awarded := v_achievement.xp_reward;
          RETURN NEXT;
        END IF;

      -- MULTIPLE COMPLETIONS: ukończ dowolny quest X razy
      WHEN 'multiple_completions' THEN
        SELECT COUNT(*) INTO v_count
        FROM quest_completions
        WHERE player_id = p_player_id;
        
        IF v_count >= v_achievement.required_count THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          IF v_achievement.xp_reward > 0 THEN
            UPDATE players 
            SET total_xp = total_xp + v_achievement.xp_reward
            WHERE id = p_player_id;
            
            UPDATE monthly_progress
            SET xp = xp + v_achievement.xp_reward
            WHERE player_id = p_player_id;
          END IF;
          
          achievement_name := v_achievement.name;
          achievement_description := v_achievement.description;
          xp_awarded := v_achievement.xp_reward;
          RETURN NEXT;
        END IF;

      -- EMERGENCY: ukończ X emergency questów
      WHEN 'emergency' THEN
        IF p_is_emergency THEN
          SELECT COUNT(*) INTO v_count
          FROM quest_completions
          WHERE player_id = p_player_id AND is_emergency = true;
          
          IF v_count >= v_achievement.required_count THEN
            INSERT INTO player_achievements (player_id, achievement_id)
            VALUES (p_player_id, v_achievement.id);
            
            IF v_achievement.xp_reward > 0 THEN
              UPDATE players 
              SET total_xp = total_xp + v_achievement.xp_reward
              WHERE id = p_player_id;
              
              UPDATE monthly_progress
              SET xp = xp + v_achievement.xp_reward
              WHERE player_id = p_player_id;
            END IF;
            
            achievement_name := v_achievement.name;
            achievement_description := v_achievement.description;
            xp_awarded := v_achievement.xp_reward;
            RETURN NEXT;
          END IF;
        END IF;

      -- GROUP QUEST: ukończ X questów grupowych
      WHEN 'group_quest' THEN
        IF p_is_coop THEN
          SELECT COUNT(*) INTO v_count
          FROM quest_completions
          WHERE player_id = p_player_id AND is_coop = true;
          
          IF v_count >= v_achievement.required_count THEN
            INSERT INTO player_achievements (player_id, achievement_id)
            VALUES (p_player_id, v_achievement.id);
            
            IF v_achievement.xp_reward > 0 THEN
              UPDATE players 
              SET total_xp = total_xp + v_achievement.xp_reward
              WHERE id = p_player_id;
              
              UPDATE monthly_progress
              SET xp = xp + v_achievement.xp_reward
              WHERE player_id = p_player_id;
            END IF;
            
            achievement_name := v_achievement.name;
            achievement_description := v_achievement.description;
            xp_awarded := v_achievement.xp_reward;
            RETURN NEXT;
          END IF;
        END IF;

      -- DURATION: ukończ quest o określonym czasie trwania
      WHEN 'duration' THEN
        IF p_quest_time IS NOT NULL THEN
          IF (v_achievement.min_duration IS NOT NULL AND p_quest_time >= v_achievement.min_duration) OR
             (v_achievement.max_duration IS NOT NULL AND p_quest_time <= v_achievement.max_duration) THEN
            INSERT INTO player_achievements (player_id, achievement_id)
            VALUES (p_player_id, v_achievement.id);
            
            IF v_achievement.xp_reward > 0 THEN
              UPDATE players 
              SET total_xp = total_xp + v_achievement.xp_reward
              WHERE id = p_player_id;
              
              UPDATE monthly_progress
              SET xp = xp + v_achievement.xp_reward
              WHERE player_id = p_player_id;
            END IF;
            
            achievement_name := v_achievement.name;
            achievement_description := v_achievement.description;
            xp_awarded := v_achievement.xp_reward;
            RETURN NEXT;
          END IF;
        END IF;

      -- LEVEL: osiągnij konkretny poziom
      WHEN 'level' THEN
        IF p_new_level IS NOT NULL AND p_new_level >= v_achievement.required_level THEN
          INSERT INTO player_achievements (player_id, achievement_id)
          VALUES (p_player_id, v_achievement.id);
          
          IF v_achievement.xp_reward > 0 THEN
            UPDATE players 
            SET total_xp = total_xp + v_achievement.xp_reward
            WHERE id = p_player_id;
            
            UPDATE monthly_progress
            SET xp = xp + v_achievement.xp_reward
            WHERE player_id = p_player_id;
          END IF;
          
          achievement_name := v_achievement.name;
          achievement_description := v_achievement.description;
          xp_awarded := v_achievement.xp_reward;
          RETURN NEXT;
        END IF;

      ELSE
        -- Nieznany typ osiągnięcia, pomiń
        CONTINUE;
    END CASE;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Dodaj informację o XP do kroniki przy zdobywaniu osiągnięć
CREATE OR REPLACE FUNCTION check_monthly_winner_achievement(p_winner_id UUID, p_winner_nick TEXT)
RETURNS void AS $$
DECLARE
  v_achievement_id UUID;
  v_xp_reward INTEGER;
BEGIN
  -- Znajdź osiągnięcie "Gracz miesiąca"
  SELECT id, xp_reward INTO v_achievement_id, v_xp_reward
  FROM achievements
  WHERE achievement_type = 'monthly_winner'
  LIMIT 1;
  
  IF v_achievement_id IS NULL THEN
    RETURN;
  END IF;

  -- Sprawdź czy gracz już ma to osiągnięcie
  IF NOT EXISTS(
    SELECT 1 FROM player_achievements 
    WHERE player_id = p_winner_id AND achievement_id = v_achievement_id
  ) THEN
    -- Dodaj osiągnięcie
    INSERT INTO player_achievements (player_id, achievement_id)
    VALUES (p_winner_id, v_achievement_id);
    
    -- Dodaj XP
    IF v_xp_reward > 0 THEN
      UPDATE players 
      SET total_xp = total_xp + v_xp_reward
      WHERE id = p_winner_id;
      
      UPDATE monthly_progress
      SET xp = xp + v_xp_reward
      WHERE player_id = p_winner_id;
    END IF;
    
    -- Dodaj wpis do kroniki
    INSERT INTO chronicle (event_type, player_nick, xp, payload)
    VALUES (
      'achievement_unlocked',
      p_winner_nick,
      v_xp_reward,
      jsonb_build_object(
        'achievement_name', 'Gracz miesiąca',
        'xp_reward', v_xp_reward
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AKTUALIZACJA reset_month_if_needed
-- Dodaj logowanie gracza miesiąca do kroniki
-- ============================================

DROP FUNCTION IF EXISTS public.reset_month_if_needed();

CREATE OR REPLACE FUNCTION public.reset_month_if_needed()
RETURNS JSON AS $$
DECLARE
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW());
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
  v_reset_count INTEGER := 0;
  v_winner_id UUID;
  v_old_month INTEGER;
  v_old_year INTEGER;
BEGIN
  -- Sprawdź czy są jakieś rekordy z innym miesiącem/rokiem
  IF EXISTS (
    SELECT 1 FROM monthly_progress 
    WHERE month != v_current_month OR year != v_current_year
  ) THEN
    
    -- Pobierz poprzedni miesiąc/rok
    SELECT DISTINCT month, year INTO v_old_month, v_old_year
    FROM monthly_progress
    WHERE month != v_current_month OR year != v_current_year
    LIMIT 1;
    
    -- Znajdź zwycięzcę poprzedniego miesiąca (na podstawie całkowitego XP zdobytego w miesiącu)
    -- Całkowity XP = suma XP potrzebnego na dotychczasowe poziomy + obecny XP
    SELECT player_id INTO v_winner_id
    FROM monthly_progress
    WHERE month = v_old_month AND year = v_old_year
    ORDER BY (
      -- Oblicz całkowity XP zdobyty w miesiącu
      CASE 
        WHEN level = 1 THEN xp
        ELSE (
          -- Suma XP ze wszystkich poprzednich poziomów + obecny XP
          xp + (
            SELECT SUM(FLOOR(100 * POWER(1.2, lvl - 1)))
            FROM generate_series(1, level - 1) AS lvl
          )
        )
      END
    ) DESC
    LIMIT 1;
    
    -- Zapisz zwycięzcę do monthly_winners
    IF v_winner_id IS NOT NULL THEN
      INSERT INTO monthly_winners (year, month, player_id, xp)
      SELECT 
        year,
        month,
        player_id,
        -- Całkowity XP zdobyty w miesiącu
        CASE 
          WHEN level = 1 THEN xp
          ELSE (
            xp + (
              SELECT SUM(FLOOR(100 * POWER(1.2, lvl - 1)))
              FROM generate_series(1, level - 1) AS lvl
            )
          )
        END AS total_xp
      FROM monthly_progress
      WHERE player_id = v_winner_id 
        AND month = v_old_month 
        AND year = v_old_year
      ON CONFLICT DO NOTHING;
      
      -- Dodaj wpis do kroniki o graczu miesiąca
      PERFORM set_monthly_winner(v_winner_id, v_old_month, v_old_year);
    END IF;
    
    -- Usuń stare rekordy
    DELETE FROM monthly_progress 
    WHERE month != v_current_month OR year != v_current_year;
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;
    
    -- Utwórz nowe rekordy dla wszystkich graczy
    INSERT INTO monthly_progress (player_id, month, year, xp, level, xp_required)
    SELECT id, v_current_month, v_current_year, 0, 1, 100
    FROM players
    ON CONFLICT DO NOTHING;
    
    -- Dodaj wpis do kroniki o resecie
    INSERT INTO chronicle (type, message, created_at)
    VALUES (
      'month_reset',
      '🔄 Nowy miesiąc - reset postępu!',
      NOW()
    );
    
    RETURN json_build_object(
      'reset', TRUE,
      'deleted_records', v_reset_count,
      'new_month', v_current_month,
      'new_year', v_current_year,
      'winner_recorded', v_winner_id IS NOT NULL
    );
  END IF;
  
  RETURN json_build_object('reset', FALSE);
END;
$$ LANGUAGE plpgsql;

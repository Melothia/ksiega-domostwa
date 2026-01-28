-- ============================================
-- Migracja 20: Zaktualizuj reset_month_if_needed - NIE resetuj poziomu
-- ============================================

DROP FUNCTION IF EXISTS public.reset_month_if_needed();

CREATE OR REPLACE FUNCTION public.reset_month_if_needed()
RETURNS JSON AS $$
DECLARE
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW());
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
  v_reset_count INTEGER := 0;
  v_winner_id UUID;
BEGIN
  -- Sprawdź czy są jakieś rekordy z innym miesiącem/rokiem
  IF EXISTS (
    SELECT 1 FROM monthly_progress 
    WHERE month != v_current_month OR year != v_current_year
  ) THEN
    
    -- Zapisz zwycięzcę poprzedniego miesiąca (na podstawie miesięcznego XP)
    INSERT INTO monthly_winners (year, month, player_id, xp)
    SELECT 
      year,
      month,
      player_id,
      xp  -- Tylko miesięczny XP
    FROM monthly_progress
    WHERE month != v_current_month OR year != v_current_year
    ORDER BY xp DESC
    LIMIT 1
    ON CONFLICT DO NOTHING
    RETURNING player_id INTO v_winner_id;
    
    -- Przyznaj osiągnięcie zwycięzcy
    IF v_winner_id IS NOT NULL THEN
      BEGIN
        PERFORM check_monthly_winner_achievement(v_winner_id);
      EXCEPTION WHEN undefined_function THEN
        NULL;
      END;
    END IF;
    
    -- WAŻNE: USUŃ TYLKO miesięczny progress, NIE ruszamy poziomu w players!
    DELETE FROM monthly_progress 
    WHERE month != v_current_month OR year != v_current_year;
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;
    
    -- Utwórz nowe rekordy dla wszystkich graczy (TYLKO miesięczny XP = 0)
    INSERT INTO monthly_progress (player_id, month, year, xp)
    SELECT id, v_current_month, v_current_year, 0
    FROM players
    ON CONFLICT DO NOTHING;
    
    -- Dodaj wpis do kroniki
    INSERT INTO chronicle (type, message, created_at)
    VALUES (
      'month_reset',
      'Nowy miesiąc - reset miesięcznego XP! Poziomy zostają bez zmian.',
      NOW()
    );
    
    RETURN json_build_object(
      'reset', TRUE,
      'deleted_records', v_reset_count,
      'new_month', v_current_month,
      'new_year', v_current_year
    );
  END IF;
  
  RETURN json_build_object('reset', FALSE);
END;
$$ LANGUAGE plpgsql;

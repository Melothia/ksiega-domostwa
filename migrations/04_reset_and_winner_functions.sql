-- ============================================
-- Funkcja: reset_month_if_needed
-- Resetuje postęp na początku nowego miesiąca
-- ============================================

-- Usuń starą funkcję jeśli istnieje
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
    
    -- Zapisz zwycięzców poprzedniego miesiąca
    INSERT INTO monthly_winners (year, month, player_id, xp)
    SELECT 
      year,
      month,
      player_id,
      (xp + (xp_required * (level - 1))) AS total_xp
    FROM monthly_progress
    WHERE month != v_current_month OR year != v_current_year
    ORDER BY level DESC, xp DESC
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
    
    -- Usuń stare rekordy
    DELETE FROM monthly_progress 
    WHERE month != v_current_month OR year != v_current_year;
    
    GET DIAGNOSTICS v_reset_count = ROW_COUNT;
    
    -- Utwórz nowe rekordy dla wszystkich graczy
    INSERT INTO monthly_progress (player_id, month, year, xp, level, xp_required)
    SELECT id, v_current_month, v_current_year, 0, 1, 100
    FROM players
    ON CONFLICT DO NOTHING;
    
    -- Dodaj wpis do kroniki
    INSERT INTO chronicle (type, message, created_at)
    VALUES (
      'month_reset',
      'Nowy miesiąc - reset postępu!',
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

-- ============================================
-- Funkcja: last_month_winner
-- Zwraca gracza miesiąca z poprzedniego miesiąca
-- ============================================

-- Usuń starą funkcję jeśli istnieje
DROP FUNCTION IF EXISTS public.last_month_winner();

CREATE OR REPLACE FUNCTION public.last_month_winner()
RETURNS TEXT AS $$
DECLARE
  v_winner_nick TEXT;
  v_last_month INTEGER;
  v_last_year INTEGER;
BEGIN
  -- Oblicz poprzedni miesiąc
  IF EXTRACT(MONTH FROM NOW()) = 1 THEN
    v_last_month := 12;
    v_last_year := EXTRACT(YEAR FROM NOW()) - 1;
  ELSE
    v_last_month := EXTRACT(MONTH FROM NOW()) - 1;
    v_last_year := EXTRACT(YEAR FROM NOW());
  END IF;
  
  -- Znajdź zwycięzcę z monthly_winners
  SELECT p.nick INTO v_winner_nick
  FROM monthly_winners mw
  JOIN players p ON mw.player_id = p.id
  WHERE mw.month = v_last_month AND mw.year = v_last_year
  ORDER BY mw.xp DESC
  LIMIT 1;
  
  -- Jeśli nie ma w monthly_winners, nie zwracaj niczego
  RETURN COALESCE(v_winner_nick, '—');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJE DLA SYSTEMU PARAGONÓW
-- ============================================

-- ============================================
-- FUNKCJA: add_receipt
-- Dodaje paragon i przyznaje 50 XP graczowi
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
BEGIN
  -- Dodaj paragon
  INSERT INTO receipts (store, amount, added_by, xp_awarded)
  VALUES (p_store, p_amount, p_player_id, v_xp_reward);
  
  -- Dodaj 50 XP do monthly_progress
  UPDATE monthly_progress
  SET xp = xp + v_xp_reward
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Sprawdź level up
  SELECT xp, level, xp_required INTO v_current_xp, v_current_level, v_xp_required
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Auto level up loop
  WHILE v_current_xp >= v_xp_required LOOP
    v_current_xp := v_current_xp - v_xp_required;
    v_current_level := v_current_level + 1;
    v_xp_required := FLOOR(v_xp_required * 1.2);
  END LOOP;
  
  UPDATE monthly_progress
  SET xp = v_current_xp, level = v_current_level, xp_required = v_xp_required
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJA: current_month_receipts_summary
-- Zwraca podsumowanie wydatków w bieżącym miesiącu
-- Pokazuje wydatki per gracz i kwotę na osobę (1/4)
-- ============================================
CREATE OR REPLACE FUNCTION current_month_receipts_summary()
RETURNS TABLE(
  player_nick TEXT,
  player_total NUMERIC,
  month_total NUMERIC,
  per_person NUMERIC
) AS $$
DECLARE
  v_month_total NUMERIC;
  v_per_person NUMERIC;
BEGIN
  -- Oblicz całkowite wydatki w bieżącym miesiącu
  SELECT COALESCE(SUM(amount), 0)
  INTO v_month_total
  FROM receipts
  WHERE EXTRACT(MONTH FROM added_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM added_at) = EXTRACT(YEAR FROM NOW());
  
  -- Oblicz kwotę na osobę (1/4)
  v_per_person := v_month_total / 4;
  
  -- Zwróć wydatki per gracz z totałami
  RETURN QUERY
  SELECT 
    p.nick,
    COALESCE(SUM(r.amount), 0) AS player_total,
    v_month_total AS month_total,
    v_per_person AS per_person
  FROM players p
  LEFT JOIN receipts r ON r.added_by = p.id 
    AND EXTRACT(MONTH FROM r.added_at) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(YEAR FROM r.added_at) = EXTRACT(YEAR FROM NOW())
  GROUP BY p.nick, p.id
  ORDER BY player_total DESC;
END;
$$ LANGUAGE plpgsql;

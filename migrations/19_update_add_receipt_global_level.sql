-- ============================================
-- Migracja 19: Zaktualizuj add_receipt dla globalnego poziomu
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
  v_player_nick TEXT;
  
  -- Globalny poziom
  v_global_level INTEGER;
  v_global_xp INTEGER;
  v_global_xp_required INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Pobierz dane gracza
  SELECT nick, level, total_xp, xp_required INTO v_player_nick, v_global_level, v_global_xp, v_global_xp_required FROM players WHERE id = p_player_id;
  
  -- Dodaj paragon
  INSERT INTO receipts (store, amount, added_by, xp_awarded)
  VALUES (p_store, p_amount, p_player_id, v_xp_reward);
  
  -- KRONIKA: Dodanie paragonu
  BEGIN
    PERFORM add_chronicle_entry(
      'receipt',
      v_player_nick || ' dodał(a) paragon z ' || p_store || ' (' || p_amount || ' zł)',
      p_player_id,
      jsonb_build_object('store', p_store, 'amount', p_amount)
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;
  
  -- ========== GLOBALNY POZIOM ==========
  v_global_xp := v_global_xp + v_xp_reward;
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
  
  -- Aktualizuj poziom globalny
  UPDATE players
  SET 
    total_xp = (total_xp + v_xp_reward),
    level = v_new_level,
    xp_required = v_global_xp_required
  WHERE id = p_player_id;
  
  -- ========== MIESIĘCZNY XP ==========
  UPDATE monthly_progress
  SET xp = xp + v_xp_reward
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
END;
$$ LANGUAGE plpgsql;

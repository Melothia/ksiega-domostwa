-- ============================================
-- FIX: Level up dla graczy z nadmiarem XP
-- Ten skrypt wykonuje level up dla graczy, którzy mają xp >= xp_required
-- ============================================

DO $$
DECLARE
  player_record RECORD;
  current_xp INTEGER;
  current_level INTEGER;
  current_xp_required INTEGER;
  levelups INTEGER;
BEGIN
  -- Dla każdego gracza w monthly_progress
  FOR player_record IN 
    SELECT * FROM monthly_progress 
    WHERE xp >= xp_required
  LOOP
    current_xp := player_record.xp;
    current_level := player_record.level;
    current_xp_required := player_record.xp_required;
    levelups := 0;
    
    -- Pętla level up
    WHILE current_xp >= current_xp_required LOOP
      current_xp := current_xp - current_xp_required;
      current_level := current_level + 1;
      current_xp_required := FLOOR(current_xp_required * 1.2);
      levelups := levelups + 1;
      
      RAISE NOTICE 'Player % leveled up to %', player_record.player_id, current_level;
    END LOOP;
    
    -- Aktualizuj gracza
    UPDATE monthly_progress
    SET 
      xp = current_xp,
      level = current_level,
      xp_required = current_xp_required
    WHERE id = player_record.id;
    
    RAISE NOTICE 'Player % updated: Level %, XP %/%', 
      player_record.player_id, current_level, current_xp, current_xp_required;
  END LOOP;
END $$;

-- ============================================
-- Sprawdź wynik
-- ============================================

SELECT 
  p.nick,
  mp.level,
  mp.xp,
  mp.xp_required,
  CONCAT(mp.xp, '/', mp.xp_required) as progress,
  CASE 
    WHEN mp.xp >= mp.xp_required THEN '⚠️ WYMAGA LEVEL UP'
    ELSE '✅ OK'
  END as status
FROM monthly_progress mp
JOIN players p ON mp.player_id = p.id
ORDER BY mp.level DESC, mp.xp DESC;

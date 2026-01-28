-- ============================================
-- KSIĘGA DOMOSTWA - Inicjalizacja bazy danych
-- ============================================

-- Włącz UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: players
-- ============================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nick TEXT NOT NULL UNIQUE,
  avatar TEXT,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: quests
-- ============================================
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_xp INTEGER NOT NULL DEFAULT 10,
  time_minutes INTEGER NOT NULL DEFAULT 15,
  frequency_days INTEGER NOT NULL DEFAULT 7,
  max_slots INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELA: monthly_progress
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp_required INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, month, year)
);

-- ============================================
-- TABELA: quest_completions
-- ============================================
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  was_emergency BOOLEAN DEFAULT FALSE,
  helper_id UUID REFERENCES players(id) ON DELETE SET NULL
);

-- ============================================
-- WSTAWIENIE GRACZY
-- ============================================
INSERT INTO players (id, nick, avatar, title) VALUES
  ('b45ef046-f815-4eda-8015-d9212d9ac2ee', 'Melothy', 'melothy.png', 'Zaklinaczka Mopa'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Reu', 'reu.png', 'Cień Domostwa'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Pshemcky', 'pshemcky.png', 'Strażnik Natury'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Benditt', 'benditt.png', 'Koci Kleryk')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PRZYKŁADOWE QUESTY
-- ============================================
INSERT INTO quests (name, base_xp, time_minutes, frequency_days, max_slots) VALUES
  ('Zmywanie naczyń', 20, 15, 1, 2),
  ('Odkurzanie mieszkania', 30, 30, 3, 1),
  ('Mycie łazienki', 40, 45, 7, 1),
  ('Wyniesienie śmieci', 15, 10, 2, 1),
  ('Zrobienie zakupów', 25, 60, 3, 2),
  ('Pranie', 20, 20, 3, 1),
  ('Prasowanie', 25, 40, 7, 1),
  ('Mycie okien', 50, 90, 30, 2),
  ('Gotowanie obiadu', 30, 45, 2, 2),
  ('Sprzątanie kuchni', 20, 20, 2, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- INICJALIZACJA monthly_progress dla wszystkich graczy
-- ============================================
INSERT INTO monthly_progress (player_id, month, year, xp, level, xp_required)
SELECT 
  id,
  EXTRACT(MONTH FROM NOW())::INTEGER,
  EXTRACT(YEAR FROM NOW())::INTEGER,
  0,
  1,
  100
FROM players
ON CONFLICT (player_id, month, year) DO NOTHING;

-- ============================================
-- FUNKCJA: reset_month_if_needed
-- Resetuje postęp na początku nowego miesiąca
-- ============================================
CREATE OR REPLACE FUNCTION reset_month_if_needed()
RETURNS VOID AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  -- Sprawdź czy są jakieś rekordy z innym miesiącem/rokiem
  IF EXISTS (
    SELECT 1 FROM monthly_progress 
    WHERE month != current_month OR year != current_year
  ) THEN
    -- Usuń stare rekordy
    DELETE FROM monthly_progress 
    WHERE month != current_month OR year != current_year;
    
    -- Utwórz nowe rekordy dla wszystkich graczy
    INSERT INTO monthly_progress (player_id, month, year, xp, level, xp_required)
    SELECT id, current_month, current_year, 0, 1, 100
    FROM players
    ON CONFLICT (player_id, month, year) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJA: get_quests_for_today
-- Zwraca questy podzielone na emergency, active, upcoming
-- ============================================
CREATE OR REPLACE FUNCTION get_quests_for_today()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH quest_status AS (
    SELECT 
      q.*,
      qc.completed_at AS last_completed,
      CASE
        -- Nigdy nie wykonany
        WHEN qc.completed_at IS NULL THEN 'active'
        -- Upcoming (za wcześnie)
        WHEN NOW() < (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) THEN 'upcoming'
        -- Emergency (po 48h od terminu)
        WHEN NOW() >= (qc.completed_at + (q.frequency_days || ' days')::INTERVAL + INTERVAL '48 hours') THEN 'emergency'
        -- Active
        ELSE 'active'
      END AS status,
      (qc.completed_at + (q.frequency_days || ' days')::INTERVAL) AS next_available
    FROM quests q
    LEFT JOIN LATERAL (
      SELECT completed_at 
      FROM quest_completions 
      WHERE quest_id = q.id 
      ORDER BY completed_at DESC 
      LIMIT 1
    ) qc ON TRUE
  )
  SELECT json_build_object(
    'emergency', COALESCE(json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'base_xp', base_xp,
        'final_xp', FLOOR(base_xp * 1.3),
        'time_minutes', time_minutes,
        'max_slots', max_slots,
        'status', 'emergency'
      )
    ) FILTER (WHERE status = 'emergency'), '[]'::json),
    'active', COALESCE(json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'base_xp', base_xp,
        'final_xp', base_xp,
        'time_minutes', time_minutes,
        'max_slots', max_slots,
        'status', 'active'
      )
    ) FILTER (WHERE status = 'active'), '[]'::json),
    'upcoming', COALESCE(json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'base_xp', base_xp,
        'time_minutes', time_minutes,
        'max_slots', max_slots,
        'next_available', next_available,
        'status', 'upcoming'
      )
    ) FILTER (WHERE status = 'upcoming'), '[]'::json)
  ) INTO result
  FROM quest_status;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJA: complete_quest (solo)
-- Wykonanie questa przez jednego gracza
-- ============================================
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
BEGIN
  -- Pobierz XP questa
  SELECT base_xp INTO v_base_xp FROM quests WHERE id = p_quest_id;
  
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
  
  -- Aktualizuj progress
  UPDATE monthly_progress
  SET xp = xp + v_xp_earned
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
  -- Sprawdź level up
  SELECT xp, level, xp_required INTO v_current_xp, v_current_level, v_xp_required
  FROM monthly_progress
  WHERE player_id = p_player_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
  
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
-- FUNKCJA: complete_group_quest
-- Wykonanie questa przez dwóch graczy
-- ============================================
CREATE OR REPLACE FUNCTION complete_group_quest(
  p_player_1 UUID,
  p_player_2 UUID,
  p_quest_id UUID
)
RETURNS VOID AS $$
BEGIN
  PERFORM complete_quest(p_player_1, p_quest_id);
  PERFORM complete_quest(p_player_2, p_quest_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNKCJA: last_month_winner
-- Zwraca gracza miesiąca z poprzedniego miesiąca
-- ============================================
CREATE OR REPLACE FUNCTION last_month_winner()
RETURNS TEXT AS $$
DECLARE
  winner_nick TEXT;
  last_month INTEGER;
  last_year INTEGER;
BEGIN
  -- Oblicz poprzedni miesiąc
  IF EXTRACT(MONTH FROM NOW()) = 1 THEN
    last_month := 12;
    last_year := EXTRACT(YEAR FROM NOW()) - 1;
  ELSE
    last_month := EXTRACT(MONTH FROM NOW()) - 1;
    last_year := EXTRACT(YEAR FROM NOW());
  END IF;
  
  -- Znajdź zwycięzcę
  SELECT p.nick INTO winner_nick
  FROM monthly_progress mp
  JOIN players p ON mp.player_id = p.id
  WHERE mp.month = last_month AND mp.year = last_year
  ORDER BY mp.level DESC, mp.xp DESC
  LIMIT 1;
  
  RETURN COALESCE(winner_nick, '—');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- WŁĄCZ RLS (Row Level Security) - opcjonalnie
-- ============================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- Polityki pozwalające na odczyt wszystkim
CREATE POLICY "Allow read access to all users" ON players FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON quests FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON monthly_progress FOR SELECT USING (true);
CREATE POLICY "Allow read access to all users" ON quest_completions FOR SELECT USING (true);

-- Polityki pozwalające na zapis (możesz dostosować według potrzeb)
CREATE POLICY "Allow insert for authenticated users" ON quest_completions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON monthly_progress FOR UPDATE USING (true);

-- ============================================
-- GOTOWE!
-- ============================================

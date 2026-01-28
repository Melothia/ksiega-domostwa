-- ============================================
-- Funkcja: get_quests_for_today
-- Zwraca questy podzielone na emergency, active, upcoming
-- WAŻNE: Status questa jest GLOBALNY (ostatnie wykonanie przez KOGOKOLWIEK)
-- ============================================

-- Usuń starą wersję
DROP FUNCTION IF EXISTS public.get_quests_for_today(UUID);
DROP FUNCTION IF EXISTS public.get_quests_for_today();

CREATE OR REPLACE FUNCTION public.get_quests_for_today()
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH quest_status AS (
    SELECT 
      q.id,
      q.name,
      q.base_xp,
      q.time_minutes,
      q.max_slots,
      q.frequency_days,
      q.emergency_after_days,
      qc.last_completed,
      qc.next_available,
      CASE
        -- Nigdy nie wykonany (przez nikogo)
        WHEN qc.last_completed IS NULL THEN 'active'
        -- Upcoming (za wcześnie)
        WHEN NOW() < qc.next_available THEN 'upcoming'
        -- Emergency (przekroczony termin + emergency_after_days)
        WHEN NOW() >= (qc.next_available + (q.emergency_after_days || ' days')::INTERVAL) THEN 'emergency'
        -- Active (można wykonać)
        ELSE 'active'
      END AS status
    FROM quests q
    LEFT JOIN LATERAL (
      SELECT 
        completed_at AS last_completed,
        (completed_at + (q.frequency_days || ' days')::INTERVAL) AS next_available
      FROM quest_completions 
      WHERE quest_id = q.id
      ORDER BY completed_at DESC 
      LIMIT 1
    ) qc ON TRUE
    WHERE q.active = TRUE
  )
  SELECT json_build_object(
    'emergency', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'base_xp', base_xp,
          'final_xp', FLOOR(base_xp * 1.3),
          'time_minutes', time_minutes,
          'max_slots', max_slots,
          'status', 'emergency'
        )
      )
      FROM quest_status
      WHERE status = 'emergency'),
      '[]'::json
    ),
    'active', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'base_xp', base_xp,
          'final_xp', base_xp,
          'time_minutes', time_minutes,
          'max_slots', max_slots,
          'status', 'active'
        )
      )
      FROM quest_status
      WHERE status = 'active'),
      '[]'::json
    ),
    'upcoming', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'base_xp', base_xp,
          'time_minutes', time_minutes,
          'max_slots', max_slots,
          'next_available', next_available,
          'status', 'upcoming'
        )
      )
      FROM quest_status
      WHERE status = 'upcoming'),
      '[]'::json
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Test funkcji
-- ============================================

-- Test globalny (bez player_id)
SELECT get_quests_for_today();

-- ============================================
-- SORTOWANIE QUESTÓW CHRONOLOGICZNIE
-- ============================================

DROP FUNCTION IF EXISTS get_quests_for_today();

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
  ),
  -- Posortowane questy emergency - najstarsze przeterminowane na górze
  emergency_sorted AS (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'base_xp', base_xp,
      'final_xp', FLOOR(base_xp * 1.3),
      'time_minutes', time_minutes,
      'max_slots', max_slots,
      'next_available', next_available,
      'status', 'emergency'
    ) AS quest_json
    FROM quest_status
    WHERE status = 'emergency'
    ORDER BY next_available ASC NULLS LAST
  ),
  -- Posortowane questy active - alfabetycznie
  active_sorted AS (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'base_xp', base_xp,
      'final_xp', base_xp,
      'time_minutes', time_minutes,
      'max_slots', max_slots,
      'status', 'active'
    ) AS quest_json
    FROM quest_status
    WHERE status = 'active'
    ORDER BY name ASC
  ),
  -- Posortowane questy upcoming - najbliższa data dostępności na górze
  upcoming_sorted AS (
    SELECT json_build_object(
      'id', id,
      'name', name,
      'base_xp', base_xp,
      'time_minutes', time_minutes,
      'max_slots', max_slots,
      'next_available', next_available,
      'status', 'upcoming'
    ) AS quest_json
    FROM quest_status
    WHERE status = 'upcoming'
    ORDER BY next_available ASC NULLS LAST
  )
  SELECT json_build_object(
    'emergency', COALESCE((SELECT json_agg(quest_json) FROM emergency_sorted), '[]'::json),
    'active', COALESCE((SELECT json_agg(quest_json) FROM active_sorted), '[]'::json),
    'upcoming', COALESCE((SELECT json_agg(quest_json) FROM upcoming_sorted), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

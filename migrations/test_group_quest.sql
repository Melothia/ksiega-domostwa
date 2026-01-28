-- Test script: Activate "Mycie lodówki" for testing
-- Run this in Supabase SQL Editor

-- Step 1: Find "Mycie lodówki" quest
WITH target_quest AS (
  SELECT id FROM quests WHERE name ILIKE '%lodówk%' AND active = true LIMIT 1
)
-- Step 2: Delete old completion records to make it available NOW
DELETE FROM quest_completions
WHERE quest_id IN (SELECT id FROM target_quest);

-- Verify: Show the quest status
SELECT 
  q.id,
  q.name,
  q.max_slots,
  q.base_xp,
  q.time_minutes,
  MAX(qc.completed_at) as last_completed,
  CASE
    WHEN MAX(qc.completed_at) IS NULL THEN '✅ ACTIVE (available now)'
    WHEN NOW() < (MAX(qc.completed_at) + (q.frequency_days || ' days')::INTERVAL) THEN '⏳ UPCOMING'
    WHEN NOW() >= (MAX(qc.completed_at) + (q.frequency_days || ' days')::INTERVAL + (q.emergency_after_days || ' days')::INTERVAL) THEN '🚨 EMERGENCY'
    ELSE '✅ ACTIVE'
  END as quest_status
FROM quests q
LEFT JOIN quest_completions qc ON qc.quest_id = q.id
WHERE q.name ILIKE '%lodówk%' AND q.active = true
GROUP BY q.id, q.name, q.max_slots, q.base_xp, q.time_minutes, q.frequency_days, q.emergency_after_days;

-- ============================================
-- TEST KRONIKI - Dodaj testowy wpis
-- ============================================

-- 1. Sprawdź czy kolumna payload istnieje
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'chronicle' 
      AND column_name = 'payload'
  ) THEN
    ALTER TABLE chronicle ADD COLUMN payload JSONB;
  END IF;
END $$;

-- 2. Dodaj testowy wpis do kroniki
INSERT INTO chronicle (type, message, player_id, payload, created_at)
VALUES (
  'quest_solo',
  'Test wykonania zadania',
  (SELECT id FROM players LIMIT 1),
  '{"quest": "Test Quest", "xp": 20, "emergency": false}'::jsonb,
  NOW()
);

-- 3. Sprawdź czy wpis został dodany
SELECT 
  id, 
  type, 
  message, 
  payload,
  created_at,
  (SELECT nick FROM players WHERE id = chronicle.player_id) as player_nick
FROM chronicle 
ORDER BY created_at DESC 
LIMIT 5;

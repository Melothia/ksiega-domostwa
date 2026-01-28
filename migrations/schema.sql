-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  condition text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.players(id)
);
CREATE TABLE public.chronicle (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  type text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicle_pkey PRIMARY KEY (id),
  CONSTRAINT chronicle_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id),
  CONSTRAINT chronicle_player_fk FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.chronicle_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL,
  message text NOT NULL,
  player_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicle_entries_pkey PRIMARY KEY (id),
  CONSTRAINT chronicle_entries_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.monthly_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  year integer NOT NULL,
  month integer NOT NULL,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  xp_required integer NOT NULL DEFAULT 100,
  CONSTRAINT monthly_progress_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_progress_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.monthly_winners (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL,
  player_id uuid,
  xp integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_winners_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_winners_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.player_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  player_id uuid,
  achievement_id uuid,
  unlocked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT player_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT player_achievements_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id),
  CONSTRAINT player_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nick text NOT NULL,
  class text NOT NULL,
  avatar_url text,
  active_title text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT players_pkey PRIMARY KEY (id)
);
CREATE TABLE public.quest_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quest_id uuid,
  player_id uuid,
  completed_at timestamp with time zone DEFAULT now(),
  xp_awarded integer NOT NULL,
  is_emergency boolean DEFAULT false,
  is_coop boolean DEFAULT false,
  CONSTRAINT quest_completions_pkey PRIMARY KEY (id),
  CONSTRAINT quest_completions_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id),
  CONSTRAINT quest_completions_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.quest_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quest_id uuid,
  player_id uuid,
  occupied_at timestamp with time zone DEFAULT now(),
  active boolean DEFAULT true,
  CONSTRAINT quest_slots_pkey PRIMARY KEY (id),
  CONSTRAINT quest_slots_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id),
  CONSTRAINT quest_slots_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id)
);
CREATE TABLE public.quests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frequency_days integer NOT NULL,
  time_minutes integer NOT NULL,
  base_xp integer NOT NULL,
  max_slots integer NOT NULL,
  bonus_classes ARRAY,
  quest_type text NOT NULL,
  active boolean DEFAULT true,
  emergency_after_days integer NOT NULL DEFAULT 3,
  CONSTRAINT quests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  store text NOT NULL,
  amount numeric NOT NULL,
  added_by uuid,
  added_at timestamp with time zone DEFAULT now(),
  xp_awarded integer NOT NULL,
  split_count integer DEFAULT 4,
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.players(id)
);
CREATE TABLE public.shopping_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  added_by uuid,
  purchased boolean DEFAULT false,
  purchased_by uuid,
  purchased_at timestamp with time zone,
  CONSTRAINT shopping_items_pkey PRIMARY KEY (id),
  CONSTRAINT shopping_items_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.players(id),
  CONSTRAINT shopping_items_purchased_by_fkey FOREIGN KEY (purchased_by) REFERENCES public.players(id)
);
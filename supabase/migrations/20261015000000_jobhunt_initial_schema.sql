-- Job Hunt MVP — Database Migration Schema & Policies
-- Designed for PostgreSQL / Supabase with Row Level Security (RLS)

-- 1. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id TEXT UNIQUE,
  auth_subject TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Hoops Rookie',
  character_config JSONB NOT NULL DEFAULT '{
    "modelId": "arcade_runner_v1",
    "shirtColor": "#F23855",
    "trouserColor": "#193A46",
    "skinColor": "#F5C19B",
    "shoesColor": "#08BFE8",
    "accessoryId": "headband"
  }'::jsonb,
  total_coins INTEGER NOT NULL DEFAULT 0 CHECK (total_coins >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hiring_chance NUMERIC(3,2) NOT NULL DEFAULT 0.70,
  game_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'under_review', 'offered', 'rejected', 'accepted', 'declined')),
  shot_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. EMPLOYMENT TABLE
CREATE TABLE IF NOT EXISTS public.employment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  role_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index enforcing at most one active or paused job per player
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_current_job_per_player 
ON public.employment (player_id) 
WHERE (status IN ('active', 'paused'));

-- 5. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_id UUID NOT NULL REFERENCES public.employment(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deliverable_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  reward_coins INTEGER NOT NULL DEFAULT 10 CHECK (reward_coins > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. COIN TRANSACTIONS TABLE (Authoritative Ledger)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PUBLIC LEADERBOARD VIEW (Safe public view without sensitive auth/email data)
CREATE OR REPLACE VIEW public.public_leaderboard AS
SELECT 
  DENSE_RANK() OVER (ORDER BY p.total_coins DESC, p.updated_at ASC) AS rank,
  p.id AS player_id,
  p.display_name,
  p.character_config,
  p.total_coins,
  p.updated_at
FROM public.players p
WHERE p.total_coins > 0
ORDER BY rank ASC
LIMIT 100;

-- 8. TRUSTED BACKEND FUNCTION FOR ATOMIC REWARD CLAIM
CREATE OR REPLACE FUNCTION public.claim_assignment_reward(
  p_player_id UUID,
  p_employment_id UUID,
  p_assignment_id UUID,
  p_amount INTEGER,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emp_status TEXT;
  v_assign_status TEXT;
  v_current_coins INTEGER;
  v_tx_id UUID;
  v_new_coins INTEGER;
BEGIN
  -- Check existing idempotency key
  IF EXISTS (SELECT 1 FROM public.coin_transactions WHERE idempotency_key = p_idempotency_key) THEN
    SELECT total_coins INTO v_current_coins FROM public.players WHERE id = p_player_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Duplicate transaction prevented by idempotency key.',
      'coins_awarded', 0,
      'new_total_coins', v_current_coins
    );
  END IF;

  -- Validate employment status is active
  SELECT status INTO v_emp_status FROM public.employment 
  WHERE id = p_employment_id AND player_id = p_player_id;
  
  IF v_emp_status IS NULL OR v_emp_status != 'active' THEN
    RAISE EXCEPTION 'Employment must be active to claim assignment rewards.';
  END IF;

  -- Validate assignment is available
  SELECT status INTO v_assign_status FROM public.assignments
  WHERE id = p_assignment_id AND employment_id = p_employment_id;

  IF v_assign_status IS NULL OR v_assign_status = 'completed' THEN
    RAISE EXCEPTION 'Assignment is already completed or invalid.';
  END IF;

  -- Insert ledger transaction
  INSERT INTO public.coin_transactions (player_id, amount, reason, reference_id, idempotency_key)
  VALUES (p_player_id, p_amount, 'Assignment Completion', p_assignment_id::TEXT, p_idempotency_key)
  RETURNING id INTO v_tx_id;

  -- Mark assignment as completed
  UPDATE public.assignments 
  SET status = 'completed', completed_at = now()
  WHERE id = p_assignment_id;

  -- Increment player coin balance
  UPDATE public.players
  SET total_coins = total_coins + p_amount, updated_at = now()
  WHERE id = p_player_id
  RETURNING total_coins INTO v_new_coins;

  RETURN jsonb_build_object(
    'success', true,
    'coins_awarded', p_amount,
    'new_total_coins', v_new_coins,
    'transaction_id', v_tx_id::TEXT
  );
END;
$$;

-- 9. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Companies: Public readable
CREATE POLICY "Companies are publicly readable" 
ON public.companies FOR SELECT TO public USING (true);

-- Players: Public can read basic profile for leaderboard; users can update own profile
CREATE POLICY "Players can view profile" 
ON public.players FOR SELECT TO public USING (true);

CREATE POLICY "Players can update own profile" 
ON public.players FOR UPDATE TO authenticated 
USING (auth.uid() = id OR auth.uid()::TEXT = auth_subject)
WITH CHECK (auth.uid() = id OR auth.uid()::TEXT = auth_subject);

-- Applications: Players can only view and insert their own applications
CREATE POLICY "Players can view own applications"
ON public.applications FOR SELECT TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Players can insert own applications"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (player_id = auth.uid());

-- Employment: Players can only view, insert, update own employment
CREATE POLICY "Players can view own employment"
ON public.employment FOR SELECT TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Players can manage own employment"
ON public.employment FOR ALL TO authenticated
USING (player_id = auth.uid());

-- Assignments: Players can view assignments for their employment
CREATE POLICY "Players can view own assignments"
ON public.assignments FOR SELECT TO authenticated
USING (
  employment_id IN (SELECT id FROM public.employment WHERE player_id = auth.uid())
);

-- Coin Transactions: Players can view their own ledger
CREATE POLICY "Players can view own coin transactions"
ON public.coin_transactions FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- Seed Companies
INSERT INTO public.companies (id, name, role_title, difficulty, accent_color, is_active, hiring_chance)
VALUES
  ('comp_cloudbounce', 'CloudBounce', 'Full Stack Engineer', 'Mid', '#F23855', true, 0.75),
  ('comp_neongrid', 'NeonGrid Labs', 'Frontend Architect', 'Junior', '#08BFE8', true, 0.85),
  ('comp_apex', 'Apex Ventures', 'Product Lead', 'Senior', '#FFC629', true, 0.65),
  ('comp_bytehoops', 'ByteHoops Inc', 'Game Systems Engineer', 'Lead', '#39CF61', true, 0.55)
ON CONFLICT (id) DO NOTHING;

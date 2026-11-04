
-- ===== Module platform =====
CREATE TABLE public.learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Core',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  default_path text,
  storage_path text,
  practice_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_modules TO authenticated;
GRANT ALL ON public.learning_modules TO service_role;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published modules are public" ON public.learning_modules FOR SELECT USING (is_published OR private.is_admin(auth.uid()));
CREATE POLICY "Admins manage modules" ON public.learning_modules FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE TRIGGER trg_learning_modules_updated BEFORE UPDATE ON public.learning_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_slug text NOT NULL,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  sections_done integer NOT NULL DEFAULT 0,
  sections_total integer NOT NULL DEFAULT 0,
  quiz_correct integer,
  quiz_total integer,
  completed_at timestamptz,
  certificate_claimed_at timestamptz,
  certificate_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_slug)
);
GRANT SELECT, INSERT, UPDATE ON public.module_progress TO authenticated;
GRANT ALL ON public.module_progress TO service_role;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own module progress read" ON public.module_progress FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "Own module progress insert" ON public.module_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own module progress update" ON public.module_progress FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_module_progress_updated BEFORE UPDATE ON public.module_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.module_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_slug text NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX module_events_user_idx ON public.module_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.module_events TO authenticated;
GRANT ALL ON public.module_events TO service_role;
ALTER TABLE public.module_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own module events read" ON public.module_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "Own module events insert" ON public.module_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===== Character simulator (fresh start, no old data) =====
CREATE TABLE public.sim_profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cash_balance numeric NOT NULL DEFAULT 10000.00,
  reputation_score numeric NOT NULL DEFAULT 50.00,
  character_name text, relationship text,
  avatar text NOT NULL DEFAULT '🙂', backstory text,
  last_guided_on date, neglect_through date, paused_until date, last_pause_on date,
  stress numeric, stress_updated_at timestamptz,
  goal_started_at timestamptz, goal_baseline numeric,
  goal_cycle integer NOT NULL DEFAULT 0, bankrupt_count integer NOT NULL DEFAULT 0,
  comeback_at timestamptz,
  debt_strategy text NOT NULL DEFAULT 'avalanche', debt_autopay boolean NOT NULL DEFAULT false, debt_plan_at timestamptz
);
CREATE TABLE public.cash_ledger (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, amount numeric NOT NULL, reason text NOT NULL, related_table text, related_id bigint, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.instruments (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, ticker text NOT NULL UNIQUE, name text NOT NULL, kind text NOT NULL, current_price numeric NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE public.instrument_price_history (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, instrument_id bigint NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE, price numeric NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.trades (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, instrument_id bigint NOT NULL REFERENCES public.instruments(id), side text NOT NULL, quantity numeric NOT NULL, price_at_trade numeric NOT NULL, total_value numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.holdings (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, instrument_id bigint NOT NULL REFERENCES public.instruments(id), quantity numeric NOT NULL DEFAULT 0, avg_buy_price numeric NOT NULL DEFAULT 0);
CREATE TABLE public.ventures (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, name text NOT NULL, category text NOT NULL, status text NOT NULL DEFAULT 'active', starting_capital numeric NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz, capital numeric, retained numeric NOT NULL DEFAULT 0, insured_until timestamptz, shock_guard_until timestamptz, income_mult numeric NOT NULL DEFAULT 1, income_mult_until timestamptz, last_income_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.venture_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, venture_id bigint NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE, kind text NOT NULL, amount numeric NOT NULL, description text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.debts (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, lender_kind text NOT NULL, principal numeric NOT NULL, outstanding_balance numeric NOT NULL, annual_interest_rate numeric NOT NULL, status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), story_tag text, product text, structure text NOT NULL DEFAULT 'flexible', term_months integer, installment numeric, billed_cycles integer NOT NULL DEFAULT 0, due_amount numeric NOT NULL DEFAULT 0, due_since timestamptz, last_accrual_at timestamptz NOT NULL DEFAULT now(), missed_count integer NOT NULL DEFAULT 0, rollovers integer NOT NULL DEFAULT 0);
CREATE TABLE public.reputation_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, delta numeric NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.net_worth_snapshots (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, cash numeric NOT NULL, investments_value numeric NOT NULL, ventures_value numeric NOT NULL, debt_outstanding numeric NOT NULL, net_worth numeric NOT NULL, snapshot_date date NOT NULL);
CREATE TABLE public.sim_config (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE public.story_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, event_key text NOT NULL UNIQUE, category text NOT NULL, trigger_type text NOT NULL, trigger_config jsonb NOT NULL DEFAULT '{}', eligibility_config jsonb NOT NULL DEFAULT '{}', unlocks_feature text, character_key text, title text, intro text, entry_node text NOT NULL DEFAULT 'start', repeatable boolean NOT NULL DEFAULT false, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.story_nodes (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, event_id bigint NOT NULL REFERENCES public.story_events(id) ON DELETE CASCADE, node_key text NOT NULL, body text, choices jsonb NOT NULL DEFAULT '[]');
CREATE TABLE public.lesson_flag_map (lesson_id text PRIMARY KEY, flag_key text NOT NULL, reputation_delta numeric NOT NULL DEFAULT 1);
CREATE TABLE public.lender_limit_rules (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, lender_kind text NOT NULL, ceiling numeric NOT NULL, requires_flag text, excludes_flag text, min_days_since_signup integer NOT NULL DEFAULT 0, note text);
CREATE TABLE public.learner_feature_unlocks (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, feature_key text NOT NULL, unlocked_at timestamptz, unlocked_via_event_id bigint REFERENCES public.story_events(id));
CREATE TABLE public.learner_flags (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, flag_key text NOT NULL, set_by_event_id bigint REFERENCES public.story_events(id), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.learner_pending_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, event_id bigint NOT NULL REFERENCES public.story_events(id), node_key text NOT NULL, status text NOT NULL DEFAULT 'pending', available_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz, context jsonb);
CREATE TABLE public.learner_event_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, event_id bigint REFERENCES public.story_events(id), node_key text, choice_index integer, cash_delta numeric, reputation_delta numeric, flag_set text, note text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.learner_daily_check (profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, check_date date NOT NULL, rolled boolean NOT NULL DEFAULT false, fired_event_id bigint REFERENCES public.story_events(id), PRIMARY KEY (profile_id, check_date));
CREATE TABLE public.venture_category_rates (category text PRIMARY KEY, monthly_revenue_rate numeric NOT NULL, cost_ratio numeric NOT NULL, volatility numeric NOT NULL);
CREATE TABLE public.character_trait_rules (flag_key text NOT NULL, trait text NOT NULL CHECK (trait IN ('prudence','discipline','generosity','boldness')), points integer NOT NULL, note text NOT NULL, PRIMARY KEY (flag_key, trait));
CREATE TABLE public.learner_lessons (profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, lesson_id text NOT NULL, completed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (profile_id, lesson_id));
CREATE TABLE public.yungsta_questions (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, question_key text NOT NULL UNIQUE, lesson_id text NOT NULL, topic text, question text NOT NULL, options jsonb NOT NULL, correct_index integer NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE public.learner_practice (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, lesson_id text NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, correct_count integer);
CREATE TABLE public.learner_questions (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, question_id bigint NOT NULL REFERENCES public.yungsta_questions(id), attempt integer NOT NULL DEFAULT 1, option_order integer[] NOT NULL, status text NOT NULL DEFAULT 'pending', available_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), answered_at timestamptz, chosen_index integer, correct boolean, practice_id bigint REFERENCES public.learner_practice(id));
CREATE TABLE public.yungsta_blunders (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, blunder_key text NOT NULL UNIQUE, title text NOT NULL, story text NOT NULL, loss_mult numeric NOT NULL DEFAULT 1, debrief_question text NOT NULL, debrief_options jsonb NOT NULL, correct_index integer NOT NULL, recovery_text text NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE public.learner_blunders (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, blunder_id bigint NOT NULL REFERENCES public.yungsta_blunders(id), missed_on date NOT NULL, amount numeric NOT NULL, option_order integer[] NOT NULL, status text NOT NULL DEFAULT 'new', recovered numeric NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), debriefed_at timestamptz);
CREATE TABLE public.quiz_presets (id integer PRIMARY KEY, question_key text NOT NULL UNIQUE, emoji text NOT NULL, prompt text NOT NULL, options jsonb NOT NULL, wise_index integer NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE public.quizzes (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, code text NOT NULL UNIQUE, creator_name text NOT NULL, theme text NOT NULL DEFAULT 'gwagon', question_ids integer[] NOT NULL, accepted integer[], token_hash text NOT NULL, response_count integer NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), picks integer[], bluffs integer[], creator_traits jsonb, creator_archetype text);
CREATE TABLE public.quiz_responses (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, quiz_id bigint NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE, name text NOT NULL, name_key text NOT NULL, answers integer[] NOT NULL, traits jsonb NOT NULL, matches integer NOT NULL, character text, created_at timestamptz NOT NULL DEFAULT now(), guesses integer[], compat integer, judge integer, archetype text);
CREATE TABLE public.quiz_rate (ip_hash text NOT NULL, kind text NOT NULL, bucket timestamptz NOT NULL, n integer NOT NULL DEFAULT 1, PRIMARY KEY (ip_hash, kind, bucket));
CREATE TABLE public.quiz_archetypes (key text PRIMARY KEY, emoji text NOT NULL, title text NOT NULL, blurb text NOT NULL, power text NOT NULL, blind text NOT NULL, likely text NOT NULL, lesson_file text NOT NULL, lesson_title text NOT NULL, lesson_pitch text NOT NULL, z jsonb NOT NULL, bias numeric NOT NULL DEFAULT 0, sort integer NOT NULL);
CREATE TABLE public.quiz_dim_stats (dim text PRIMARY KEY, mean numeric NOT NULL, std numeric NOT NULL);
CREATE TABLE public.quiz_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, kind text NOT NULL, code text, vid text, meta jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.stress_flag_effects (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, flag_key text NOT NULL, delta numeric NOT NULL, delay_months numeric NOT NULL DEFAULT 0, fade_months numeric NOT NULL DEFAULT 3, why text NOT NULL, pattern_key text, cancelled_by text[]);
CREATE TABLE public.sim_goals (backstory text PRIMARY KEY, title text NOT NULL, emoji text NOT NULL DEFAULT '🎯', amount numeric NOT NULL, game_months numeric NOT NULL DEFAULT 6);
CREATE TABLE public.bankruptcies (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), turning_points jsonb NOT NULL DEFAULT '[]', note text, resolved_at timestamptz);
CREATE TABLE public.stress_history (profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, day date NOT NULL, stress numeric NOT NULL, stress_sum numeric NOT NULL, samples integer NOT NULL DEFAULT 1, PRIMARY KEY (profile_id, day));
CREATE TABLE public.lesson_titles (lesson_id text PRIMARY KEY, title text NOT NULL);
CREATE TABLE public.story_event_lessons (event_key text NOT NULL, ord integer NOT NULL DEFAULT 1, lesson_id text NOT NULL REFERENCES public.lesson_titles(lesson_id), point text NOT NULL, PRIMARY KEY (event_key, ord));
CREATE TABLE public.lender_products (product text PRIMARY KEY, label text NOT NULL, annual_rate numeric NOT NULL, structure text NOT NULL, term_default integer, term_options integer[], late_fee_pct numeric NOT NULL DEFAULT 5, rollover_fee_pct numeric, lesson_id text NOT NULL DEFAULT '1-2', note text);
CREATE TABLE public.story_loan_products (story_tag text PRIMARY KEY, product text NOT NULL, term_months integer);
CREATE TABLE public.learner_mirror (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, profile_id uuid NOT NULL REFERENCES public.sim_profiles(id) ON DELETE CASCADE, lesson_id text NOT NULL, practice_id bigint NOT NULL UNIQUE REFERENCES public.learner_practice(id), advice text NOT NULL, stance text NOT NULL, barrier text, commit_when text, status text NOT NULL DEFAULT 'noted', due_at timestamptz, nudges integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), checked_at timestamptz);
CREATE TABLE public.sim_personal_decisions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL, pending_id bigint, event_title text, advice text, scenario text NOT NULL, options jsonb NOT NULL, wise_index integer NOT NULL, chosen_index integer NOT NULL, was_wise boolean NOT NULL, amount_committed numeric, reflection text, created_at timestamptz NOT NULL DEFAULT now());

-- Grants + RLS: player-owned tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cash_ledger','trades','holdings','ventures','debts','reputation_events','net_worth_snapshots','learner_feature_unlocks','learner_flags','learner_pending_events','learner_event_log','learner_daily_check','learner_lessons','learner_practice','learner_questions','learner_blunders','bankruptcies','stress_history','learner_mirror','sim_personal_decisions'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Own rows read" ON public.%I FOR SELECT TO authenticated USING (profile_id = auth.uid() OR private.is_admin(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "Own rows insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid())', t);
    EXECUTE format('CREATE POLICY "Own rows update" ON public.%I FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid())', t);
  END LOOP;
  -- shared game content: signed-in read, admins manage
  FOREACH t IN ARRAY ARRAY['instruments','instrument_price_history','sim_config','story_events','story_nodes','lesson_flag_map','lender_limit_rules','venture_category_rates','character_trait_rules','yungsta_questions','yungsta_blunders','quiz_presets','quiz_archetypes','quiz_dim_stats','stress_flag_effects','sim_goals','lesson_titles','story_event_lessons','lender_products','story_loan_products'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Signed-in read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()))', t);
  END LOOP;
  -- server-only tables (accessed through functions)
  FOREACH t IN ARRAY ARRAY['quizzes','quiz_responses','quiz_rate','quiz_events','venture_events'] LOOP
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Admins read" ON public.%I FOR SELECT TO authenticated USING (private.is_admin(auth.uid()))', t);
  END LOOP;
END $$;
GRANT SELECT ON public.quizzes, public.quiz_responses, public.quiz_rate, public.quiz_events, public.venture_events TO authenticated;
CREATE POLICY "Own venture events read" ON public.venture_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ventures v WHERE v.id = venture_id AND v.profile_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.sim_profiles TO authenticated;
GRANT ALL ON public.sim_profiles TO service_role;
ALTER TABLE public.sim_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own player read" ON public.sim_profiles FOR SELECT TO authenticated USING (id = auth.uid() OR private.is_admin(auth.uid()));
CREATE POLICY "Own player insert" ON public.sim_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Own player update" ON public.sim_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

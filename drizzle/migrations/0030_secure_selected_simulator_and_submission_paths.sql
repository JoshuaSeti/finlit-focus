REVOKE INSERT, UPDATE, DELETE ON public.assessment_checks, public.debts, public.learner_daily_check, public.learner_feature_unlocks, public.ventures FROM anon, authenticated;
DROP POLICY IF EXISTS "Learners manage own checks" ON public.assessment_checks;
CREATE POLICY "Learners read own checks" ON public.assessment_checks FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Own rows insert" ON public.debts;
DROP POLICY IF EXISTS "Own rows update" ON public.debts;
DROP POLICY IF EXISTS "Own rows insert" ON public.learner_daily_check;
DROP POLICY IF EXISTS "Own rows update" ON public.learner_daily_check;
DROP POLICY IF EXISTS "Own rows insert" ON public.ventures;
DROP POLICY IF EXISTS "Own rows update" ON public.ventures;

ALTER TABLE public.sim_profiles ADD COLUMN IF NOT EXISTS initial_situation text;
REVOKE INSERT, UPDATE, DELETE ON public.sim_profiles FROM anon, authenticated;
GRANT UPDATE (display_name, character_name, relationship, avatar, backstory) ON public.sim_profiles TO authenticated;
DROP POLICY IF EXISTS "Own player insert" ON public.sim_profiles;

CREATE OR REPLACE FUNCTION public.initialize_simulator(p_situation text, p_backstory text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); starting numeric; player public.sim_profiles;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501'; END IF;
  starting := CASE p_situation WHEN 'student' THEN 300 WHEN 'employee' THEN 2500 WHEN 'trader' THEN 6000 WHEN 'family' THEN 3500 WHEN 'piecework' THEN 500 ELSE NULL END;
  IF starting IS NULL THEN RAISE EXCEPTION 'Invalid life situation' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.placement_results WHERE user_id = uid AND server_scored IS TRUE) THEN
    RAISE EXCEPTION 'Complete placement first' USING ERRCODE = '42501';
  END IF;
  PERFORM public.story_bootstrap();
  SELECT * INTO player FROM public.sim_profiles WHERE id = uid FOR UPDATE;
  IF player.initial_situation IS NOT NULL THEN RETURN jsonb_build_object('ok', true, 'initialized', false); END IF;
  IF player.cash_balance <> 10000
     OR EXISTS (SELECT 1 FROM public.cash_ledger WHERE profile_id = uid)
     OR EXISTS (SELECT 1 FROM public.ventures WHERE profile_id = uid)
     OR EXISTS (SELECT 1 FROM public.debts WHERE profile_id = uid)
     OR EXISTS (SELECT 1 FROM public.holdings WHERE profile_id = uid)
     OR EXISTS (SELECT 1 FROM public.trades WHERE profile_id = uid) THEN
    RETURN jsonb_build_object('ok', true, 'initialized', false, 'existing_game_preserved', true);
  END IF;
  UPDATE public.sim_profiles SET initial_situation = p_situation, cash_balance = starting,
    character_name = coalesce(character_name, 'Yungsta'), backstory = left(coalesce(p_backstory, ''), 200)
    WHERE id = uid;
  RETURN jsonb_build_object('ok', true, 'initialized', true);
END $$;
REVOKE ALL ON FUNCTION public.initialize_simulator(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_simulator(text,text) TO authenticated, service_role;

ALTER TABLE public.wall_notes ALTER COLUMN is_approved SET DEFAULT false;
ALTER POLICY "Anyone posts wall notes for active members" ON public.wall_notes WITH CHECK (
  is_approved IS FALSE AND EXISTS (SELECT 1 FROM public.team_members t WHERE t.id = wall_notes.member_id AND t.is_active IS TRUE)
);
ALTER POLICY "Anyone submits application to active program" ON public.program_applications WITH CHECK (
  status = 'pending' AND reviewer_notes IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL
  AND EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_applications.program_id AND p.is_active IS TRUE AND p.is_accepting_applications IS TRUE)
);

CREATE OR REPLACE FUNCTION public.mirror_advice(p uuid, p_lesson text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE ev public.story_events; lg public.learner_event_log; nd public.story_nodes;
BEGIN
 IF auth.uid() IS NULL OR p IS DISTINCT FROM auth.uid() THEN
   RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 SELECT * INTO ev FROM public.story_events WHERE category = 'lesson_bridge' AND trigger_config ->> 'lesson_id' = p_lesson AND is_active ORDER BY id LIMIT 1;
 IF ev.id IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO lg FROM public.learner_event_log WHERE profile_id = p AND event_id = ev.id AND node_key = 'start' ORDER BY created_at DESC, id DESC LIMIT 1;
 IF lg.id IS NULL OR lg.choice_index IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO nd FROM public.story_nodes WHERE event_id = ev.id AND node_key = 'start';
 RETURN nullif(public.story_fill(p, nd.choices -> lg.choice_index ->> 'label'), '');
END $$;
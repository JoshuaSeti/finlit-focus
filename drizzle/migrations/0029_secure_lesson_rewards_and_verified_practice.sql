CREATE OR REPLACE FUNCTION private.user_can_access_lesson(p_user uuid, p_lesson text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_slug text;
  v_scores jsonb;
  v_g text;
  v_c numeric;
  v_t numeric;
  v_work text := NULL;
  v_free text;
BEGIN
  IF p_user IS NULL OR p_lesson IS NULL OR p_lesson !~ '^[a-z0-9-]{1,8}$' THEN
    RETURN false;
  END IF;
  v_slug := 'module-' || p_lesson;
  IF private.is_admin(p_user) THEN
    RETURN EXISTS (SELECT 1 FROM public.learning_modules WHERE slug = v_slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.learning_modules WHERE slug = v_slug AND is_published) THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.lesson_access WHERE user_id = p_user) THEN
    RETURN true;
  END IF;
  SELECT scores INTO v_scores
  FROM public.placement_results
  WHERE user_id = p_user AND server_scored = true
  ORDER BY created_at DESC
  LIMIT 1;
  IF v_scores IS NULL THEN
    RETURN false;
  END IF;
  FOREACH v_g IN ARRAY ARRAY['group-0','group-1','group-2','group-3','group-4'] LOOP
    v_c := coalesce((v_scores -> v_g ->> 'c')::numeric, 0);
    v_t := coalesce((v_scores -> v_g ->> 't')::numeric, 0);
    IF NOT (v_t > 0 AND v_c / v_t >= 0.66) THEN
      v_work := v_g;
      EXIT;
    END IF;
  END LOOP;
  v_free := CASE coalesce(v_work, 'group-4')
    WHEN 'group-0' THEN '0a'
    WHEN 'group-1' THEN '1-0'
    WHEN 'group-2' THEN '2-0'
    WHEN 'group-3' THEN '3-0'
    ELSE '4-0'
  END;
  RETURN v_free = p_lesson;
END
$fn$;

CREATE OR REPLACE FUNCTION private.award_verified_lesson(p_user uuid, p_lesson text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  m public.lesson_flag_map;
  v_flags text[] := '{}';
  v_has_q_bank boolean;
  v_has_bridge boolean;
  v_passed_practice boolean := true;
  v_done_bridge boolean := true;
BEGIN
  IF NOT private.user_can_access_lesson(p_user, p_lesson) THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text || ':lesson:' || p_lesson, 0));
  IF EXISTS (SELECT 1 FROM public.learner_lessons WHERE profile_id = p_user AND lesson_id = p_lesson) THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.yungsta_questions WHERE is_active AND lesson_id = p_lesson
  ) INTO v_has_q_bank;

  SELECT EXISTS (
    SELECT 1 FROM public.story_events
    WHERE category = 'lesson_bridge' AND is_active
      AND trigger_type = 'external_signal'
      AND trigger_config->>'lesson_id' = p_lesson
  ) INTO v_has_bridge;

  IF NOT v_has_q_bank AND NOT v_has_bridge THEN
    RETURN false;
  END IF;

  IF v_has_q_bank THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.learner_practice lp
      JOIN public.learner_questions lq
        ON lq.practice_id = lp.id AND lq.profile_id = p_user
      WHERE lp.profile_id = p_user AND lp.lesson_id = p_lesson
      GROUP BY lp.id
      HAVING count(*) > 0
         AND bool_and(lq.status = 'answered')
         AND count(*) FILTER (WHERE lq.correct IS true) >= ceil(count(*)::numeric / 2.0)
    ) INTO v_passed_practice;
  END IF;

  IF v_has_bridge THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.learner_pending_events pe
      JOIN public.story_events e ON e.id = pe.event_id
      WHERE pe.profile_id = p_user
        AND pe.status = 'done'
        AND e.category = 'lesson_bridge'
        AND e.is_active
        AND e.trigger_config->>'lesson_id' = p_lesson
    ) INTO v_done_bridge;
  END IF;

  IF NOT (v_passed_practice AND v_done_bridge) THEN
    RETURN false;
  END IF;

  INSERT INTO public.learner_lessons (profile_id, lesson_id)
  VALUES (p_user, p_lesson)
  ON CONFLICT DO NOTHING;

  PERFORM public.yungsta_mark_guided(p_user);
  SELECT * INTO m FROM public.lesson_flag_map WHERE lesson_id = p_lesson;
  IF FOUND AND NOT public.story_has_flag(p_user, m.flag_key) THEN
    PERFORM public.story_set_flag(p_user, m.flag_key, null);
    PERFORM public.adjust_reputation_score(p_user, m.reputation_delta, 'lesson_completed:' || p_lesson);
    v_flags := ARRAY[m.flag_key];
  END IF;
  PERFORM public.story_schedule_followups(p_user, v_flags);
  PERFORM public.story_run_unlocks(p_user);
  RETURN true;
END
$fn$;

CREATE OR REPLACE FUNCTION public.story_fire_lesson(p_lesson text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  e public.story_events;
  v_new int := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_signed_in');
  END IF;
  IF p_lesson IS NULL OR p_lesson !~ '^[a-z0-9-]{1,8}$' THEN
    RETURN jsonb_build_object('error', 'bad_lesson');
  END IF;
  IF NOT private.user_can_access_lesson(uid, p_lesson) THEN
    RETURN jsonb_build_object('error', 'lesson_locked');
  END IF;
  PERFORM public.story_bootstrap();
  FOR e IN
    SELECT * FROM public.story_events
    WHERE category = 'lesson_bridge'
      AND is_active
      AND trigger_type = 'external_signal'
      AND trigger_config->>'lesson_id' = p_lesson
    ORDER BY id
  LOOP
    IF (e.repeatable OR NOT EXISTS (
      SELECT 1 FROM public.learner_pending_events
      WHERE profile_id = uid AND event_id = e.id
    )) AND public.story_eligible(uid, e) THEN
      INSERT INTO public.learner_pending_events (profile_id, event_id, node_key)
      VALUES (uid, e.id, e.entry_node);
      v_new := v_new + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object(
    'ok', true,
    'scenarios', v_new,
    'reward_requires_practice', NOT EXISTS (
      SELECT 1 FROM public.learner_lessons WHERE profile_id = uid AND lesson_id = p_lesson
    )
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.practice_start(p_lesson text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  s public.learner_practice;
  v_fire jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error', 'not_signed_in'); END IF;
  IF p_lesson IS NULL OR p_lesson !~ '^[a-z0-9-]{1,8}$' THEN RETURN jsonb_build_object('error', 'bad_lesson'); END IF;
  IF NOT private.user_can_access_lesson(uid, p_lesson) THEN RETURN jsonb_build_object('error', 'lesson_locked'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sim_profiles WHERE id = uid) THEN RETURN jsonb_build_object('error', 'no_profile'); END IF;
  v_fire := public.story_fire_lesson(p_lesson);
  IF v_fire ? 'error' THEN RETURN v_fire; END IF;
  SELECT * INTO s FROM public.learner_practice
  WHERE profile_id = uid AND lesson_id = p_lesson
  ORDER BY started_at DESC, id DESC LIMIT 1;
  IF s.id IS NULL OR (s.completed_at IS NOT NULL AND s.completed_at < now() - interval '15 minutes') THEN
    INSERT INTO public.learner_practice (profile_id, lesson_id) VALUES (uid, p_lesson) RETURNING * INTO s;
    INSERT INTO public.learner_questions (profile_id, question_id, option_order, available_at, practice_id)
    SELECT uid, q.id,
      array(SELECT i FROM generate_series(0, jsonb_array_length(q.options) - 1) i ORDER BY random()),
      timestamptz 'epoch' + (q.rn * interval '1 second'),
      s.id
    FROM (
      SELECT yq.id, yq.options,
        row_number() OVER (
          ORDER BY (SELECT max(lq.created_at) FROM public.learner_questions lq
            WHERE lq.profile_id = uid AND lq.question_id = yq.id) ASC NULLS FIRST,
            random()
        ) AS rn
      FROM public.yungsta_questions yq
      WHERE yq.is_active AND yq.lesson_id = p_lesson
    ) q
    WHERE q.rn <= 3;
  END IF;
  RETURN public.practice_progress(uid, p_lesson, s.id);
END
$function$;

CREATE OR REPLACE FUNCTION public.practice_progress(p uuid, p_lesson text, p_session bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_total int := 0;
  v_ans int := 0;
  v_ok int := 0;
  v_has boolean := false;
  v_sdone boolean := true;
  v_done boolean;
  v_passed boolean;
  v_rewarded boolean := false;
BEGIN
  IF auth.uid() IS NULL OR p IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('error', 'not_authorized');
  END IF;
  IF p_session IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.learner_practice
    WHERE id = p_session AND profile_id = auth.uid() AND lesson_id = p_lesson
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_session');
  END IF;
  SELECT count(*),
         count(*) FILTER (WHERE lq.status = 'answered'),
         count(*) FILTER (WHERE lq.correct IS true)
    INTO v_total, v_ans, v_ok
  FROM public.learner_questions lq
  WHERE lq.profile_id = p AND lq.practice_id = p_session;

  SELECT count(*) > 0, coalesce(bool_and(pe.status = 'done'), true)
    INTO v_has, v_sdone
  FROM public.learner_pending_events pe
  JOIN public.story_events e ON e.id = pe.event_id
  WHERE pe.profile_id = p
    AND e.category = 'lesson_bridge'
    AND e.trigger_config->>'lesson_id' = p_lesson;

  v_done := (v_total = 0 AND NOT v_has) OR (v_ans >= v_total AND v_sdone);
  v_passed := (v_total = 0 OR v_ok >= ceil(v_total::numeric / 2.0));

  IF v_done THEN
    UPDATE public.learner_practice
    SET completed_at = coalesce(completed_at, now()), correct_count = v_ok
    WHERE id = p_session AND profile_id = auth.uid() AND lesson_id = p_lesson;
    IF (v_total > 0 OR v_has) AND v_passed THEN
      v_rewarded := private.award_verified_lesson(p, p_lesson);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'available', NOT (v_total = 0 AND NOT v_has),
    'done', v_done,
    'passed', v_passed,
    'rewarded', v_rewarded OR EXISTS (
      SELECT 1 FROM public.learner_lessons WHERE profile_id = p AND lesson_id = p_lesson
    ),
    'title', public.practice_title(p_lesson),
    'answered', v_ans,
    'total', v_total,
    'questions', jsonb_build_object('total', v_total, 'answered', v_ans, 'correct', v_ok),
    'scenario', jsonb_build_object('has', v_has, 'done', (v_has AND v_sdone))
  );
END
$fn$;

CREATE OR REPLACE FUNCTION public.yungsta_answer(p_id bigint, p_choice integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  lq public.learner_questions;
  q public.yungsta_questions;
  v_orig int;
  v_ok boolean;
  v_n int;
  v_lesson text;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error', 'not_signed_in'); END IF;
  SELECT * INTO lq FROM public.learner_questions
  WHERE id = p_id AND profile_id = uid AND status = 'pending' AND available_at <= now()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  v_n := array_length(lq.option_order, 1);
  IF p_choice IS NULL OR p_choice < 0 OR p_choice >= v_n THEN
    RETURN jsonb_build_object('error', 'bad_choice');
  END IF;
  SELECT * INTO q FROM public.yungsta_questions WHERE id = lq.question_id;
  v_orig := lq.option_order[p_choice + 1];
  v_ok := (v_orig = q.correct_index);
  UPDATE public.learner_questions
  SET status = 'answered', answered_at = now(), chosen_index = v_orig, correct = v_ok
  WHERE id = lq.id;
  PERFORM public.yungsta_mark_guided(uid);
  IF v_ok AND lq.attempt = 1 THEN
    PERFORM public.adjust_reputation_score(uid, 0.5, 'taught correctly: ' || q.question_key);
  END IF;
  IF NOT v_ok AND lq.attempt < 3 THEN
    INSERT INTO public.learner_questions (profile_id, question_id, attempt, option_order, available_at)
    VALUES (
      uid, q.id, lq.attempt + 1,
      array(SELECT i FROM generate_series(0, v_n - 1) i ORDER BY random()),
      now() + interval '2 days'
    );
  END IF;
  IF lq.practice_id IS NOT NULL THEN
    SELECT lesson_id INTO v_lesson
    FROM public.learner_practice
    WHERE id = lq.practice_id AND profile_id = uid;
    IF v_lesson IS NOT NULL THEN
      PERFORM public.practice_progress(uid, v_lesson, lq.practice_id);
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'correct', v_ok,
    'reaction', public.story_fill(uid, CASE WHEN v_ok THEN '{name}: "Ohh, that makes sense! I will remember that."'
      ELSE '{name}: "Hmm, okay. I will try it your way. Let''s check this one again soon."' END),
    'feedback', public.story_fill(uid, q.options -> v_orig ->> 'fb'),
    'right_text', public.story_fill(uid, q.options -> q.correct_index ->> 'text'),
    'explanation', public.story_fill(uid, q.options -> q.correct_index ->> 'fb'),
    'returns', (NOT v_ok AND lq.attempt < 3)
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.story_choose(p_pending_id bigint, p_choice_index integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_ch jsonb;
  v_key text;
  v_cat text;
  v_lesson text;
  r jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error', 'not_signed_in'); END IF;
  SELECT n.choices -> p_choice_index, e.event_key, e.category, e.trigger_config->>'lesson_id'
    INTO v_ch, v_key, v_cat, v_lesson
  FROM public.learner_pending_events pe
  JOIN public.story_events e ON e.id = pe.event_id
  JOIN public.story_nodes n ON n.event_id = pe.event_id AND n.node_key = pe.node_key
  WHERE pe.id = p_pending_id AND pe.profile_id = uid AND pe.status = 'pending';
  IF v_ch IS NOT NULL AND (v_ch ? 'needs_calm') AND NOT public.stress_calm_enough(uid) THEN
    RETURN jsonb_build_object('error', 'overloaded');
  END IF;
  r := public.story_choose_core(p_pending_id, p_choice_index);
  IF v_key IS NOT NULL AND coalesce((r->>'done')::boolean, false) THEN
    IF v_cat = 'lesson_bridge' AND v_lesson IS NOT NULL THEN
      PERFORM private.award_verified_lesson(uid, v_lesson);
    END IF;
    r := r || jsonb_build_object('lessons', public.story_lessons_for(v_key));
  END IF;
  RETURN r;
END
$function$;

REVOKE DELETE ON public.learner_pending_events FROM anon, authenticated;

DROP POLICY IF EXISTS "Own rows insert" ON public.reputation_events;
DROP POLICY IF EXISTS "Own rows update" ON public.reputation_events;
REVOKE INSERT, UPDATE, DELETE ON public.reputation_events FROM anon, authenticated;
GRANT SELECT ON public.reputation_events TO authenticated;
GRANT ALL ON public.reputation_events TO service_role;

REVOKE ALL ON FUNCTION private.user_can_access_lesson(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.award_verified_lesson(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.story_set_flag(uuid, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.story_schedule_followups(uuid, text[], jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.story_run_unlocks(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.yungsta_mark_guided(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.story_choose_core(bigint, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.story_fire_lesson(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.story_fire_lesson(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.practice_start(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.practice_start(text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.practice_progress(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.practice_progress(uuid, text, bigint) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.yungsta_answer(bigint, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.yungsta_answer(bigint, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.story_choose(bigint, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.story_choose(bigint, integer) TO authenticated, service_role;
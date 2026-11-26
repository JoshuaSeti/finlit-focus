-- 1. Restrict internal story helper functions from direct client invocation
REVOKE ALL ON FUNCTION public.story_visible_choices(uuid, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.story_visible_choices(uuid, jsonb, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.story_trigger_met(uuid, public.story_events) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.story_trigger_met(uuid, public.story_events) TO service_role;

REVOKE ALL ON FUNCTION public.story_daily_roll(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.story_daily_roll(uuid) TO service_role;

-- 2. Enforce unexpired monthly subscription on placement retakes and lesson entitlement
CREATE OR REPLACE FUNCTION public.submit_placement(p_answers integer[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  groups text[] := ARRAY['group-0','group-0','group-1','group-1','group-1','group-1','group-1','group-2','group-2','group-2','group-3','group-3','group-3','group-4','group-4'];
  scores jsonb := '{}';
  g text;
  c integer;
  t integer;
  correct integer := 0;
  start_group text := NULL;
  i integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
  IF p_answers IS NULL OR cardinality(p_answers) <> 15 OR array_ndims(p_answers) <> 1 OR array_lower(p_answers,1) <> 1 THEN
    RAISE EXCEPTION 'Invalid answers';
  END IF;
  FOR i IN 1..15 LOOP
    IF p_answers[i] IS NULL OR p_answers[i] < -1 OR p_answers[i] > 3 THEN
      RAISE EXCEPTION 'Invalid answer';
    END IF;
  END LOOP;
  PERFORM pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  IF EXISTS (SELECT 1 FROM public.placement_results WHERE user_id = uid AND server_scored)
     AND NOT EXISTS (SELECT 1 FROM public.lesson_access WHERE user_id = uid AND expires_at > now()) THEN
    RAISE EXCEPTION 'Paid access required for retakes' USING ERRCODE='42501';
  END IF;
  FOREACH g IN ARRAY ARRAY['group-0','group-1','group-2','group-3','group-4'] LOOP
    c := 0; t := 0;
    FOR i IN 1..15 LOOP
      IF groups[i] = g THEN
        t := t + 1;
        IF p_answers[i] = 0 THEN c := c + 1; END IF;
      END IF;
    END LOOP;
    correct := correct + c;
    scores := scores || jsonb_build_object(g, jsonb_build_object('c', c, 't', t));
    IF start_group IS NULL AND c::numeric / t < 0.66 THEN start_group := g; END IF;
  END LOOP;
  start_group := coalesce(start_group, 'group-4');
  INSERT INTO public.placement_results(user_id, scores, start_group, correct, total, server_scored)
  VALUES (uid, scores, start_group, correct, 15, true);
  RETURN jsonb_build_object('scores', scores, 'start_group', start_group, 'correct', correct, 'total', 15);
END
$function$;

CREATE OR REPLACE FUNCTION private.user_can_access_lesson(p_user uuid, p_lesson text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  IF EXISTS (SELECT 1 FROM public.lesson_access WHERE user_id = p_user AND expires_at > now()) THEN
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
$function$;

-- 3. Prevent signed-in admins from mutating simulator instrument prices directly
DROP POLICY IF EXISTS "Admins manage" ON public.instruments;
REVOKE INSERT, UPDATE, DELETE ON public.instruments FROM anon, authenticated;

-- 4. Remove unverified reputation gain from self-reported mirror check-ins
CREATE OR REPLACE FUNCTION public.mirror_check(p_id bigint, p_done boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  m learner_mirror;
begin
  if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
  select * into m from learner_mirror where id = p_id and profile_id = uid and status = 'open' for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if p_done then
    update learner_mirror set status = 'done', checked_at = now() where id = m.id;
    return jsonb_build_object('ok', true, 'status', 'done', 'reaction', story_fill(uid, '{name}: "You did it yourself. That is the hard part. I am proud of you."'));
  end if;
  if m.nudges >= 1 then
    update learner_mirror set status = 'dropped', nudges = m.nudges + 1, checked_at = now() where id = m.id;
    return jsonb_build_object('ok', true, 'status', 'dropped', 'reaction', story_fill(uid, '{name}: "No stress. Maybe try it after your next lesson. I am not going anywhere."'));
  end if;
  update learner_mirror set nudges = m.nudges + 1, due_at = now() + interval '3 days', checked_at = now() where id = m.id;
  return jsonb_build_object('ok', true, 'status', 'open', 'reaction', story_fill(uid, '{name}: "No stress. I will ask again in a few days."'));
end
$function$;

-- 5. Server-verified lesson completion and certificate claiming
CREATE OR REPLACE FUNCTION private.award_verified_lesson(p_user uuid, p_lesson text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    INSERT INTO public.module_progress (user_id, module_slug, completed_at)
    VALUES (p_user, 'module-' || p_lesson, now())
    ON CONFLICT (user_id, module_slug) DO UPDATE
      SET completed_at = COALESCE(public.module_progress.completed_at, now()),
          updated_at = now();
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

  INSERT INTO public.module_progress (user_id, module_slug, completed_at)
  VALUES (p_user, 'module-' || p_lesson, now())
  ON CONFLICT (user_id, module_slug) DO UPDATE
    SET completed_at = COALESCE(public.module_progress.completed_at, now()),
        updated_at = now();

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
$function$;

CREATE OR REPLACE FUNCTION public.claim_module_certificate(p_slug text, p_name text DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  v_lesson text;
  v_clean_name text;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_signed_in');
  END IF;
  IF p_slug IS NULL OR p_slug !~ '^module-[a-z0-9-]{1,20}$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_module');
  END IF;
  v_lesson := regexp_replace(p_slug, '^module-', '');

  IF NOT EXISTS (
    SELECT 1 FROM public.learner_lessons
    WHERE profile_id = uid AND lesson_id = v_lesson
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'lesson_not_completed');
  END IF;

  v_clean_name := NULLIF(left(trim(coalesce(p_name, '')), 120), '');

  INSERT INTO public.module_progress (user_id, module_slug, completed_at, certificate_claimed_at, certificate_name)
  VALUES (uid, p_slug, now(), now(), v_clean_name)
  ON CONFLICT (user_id, module_slug) DO UPDATE
    SET completed_at = COALESCE(public.module_progress.completed_at, now()),
        certificate_claimed_at = COALESCE(public.module_progress.certificate_claimed_at, now()),
        certificate_name = COALESCE(v_clean_name, public.module_progress.certificate_name),
        updated_at = now();

  RETURN jsonb_build_object('ok', true);
END
$function$;

REVOKE ALL ON FUNCTION public.claim_module_certificate(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_module_certificate(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.module_progress_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.completed_at := NULL;
    NEW.certificate_claimed_at := NULL;
    NEW.certificate_name := NULL;
    RETURN NEW;
  END IF;
  NEW.user_id := OLD.user_id;
  NEW.module_slug := OLD.module_slug;
  NEW.created_at := OLD.created_at;
  NEW.completed_at := OLD.completed_at;
  NEW.certificate_claimed_at := OLD.certificate_claimed_at;
  NEW.certificate_name := OLD.certificate_name;
  RETURN NEW;
END
$function$;

-- 6. Replace stored signed avatar URLs with storage object paths and serve opaque indicators from RPCs
UPDATE public.profiles
SET avatar_url = regexp_replace(
  split_part(avatar_url, '?', 1),
  '^https?://[^/]+/storage/v1/object/sign/avatars/',
  ''
)
WHERE avatar_url ~ '^https?://[^/]+/storage/v1/object/sign/avatars/[0-9a-f-]{36}/[^/?#]+(\?.*)?$'
  AND regexp_replace(
    split_part(avatar_url, '?', 1),
    '^https?://[^/]+/storage/v1/object/sign/avatars/',
    ''
  ) LIKE user_id::text || '/%';

CREATE OR REPLACE FUNCTION public.learner_card_for(p_user uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'id', p.id,
    'name', left(coalesce(nullif(trim(p.display_name), ''), split_part(p.full_name, ' ', 1), 'Learner'), 40),
    'avatar', p.avatar,
    'avatar_url', CASE WHEN nullif(trim(coalesce(p.avatar_url, '')), '') IS NOT NULL THEN 'avatar:' || p.id::text ELSE NULL END,
    'town', left(p.town, 40),
    'bio', left(p.bio, 140),
    'streak', coalesce((SELECT current_streak FROM learner_streaks s WHERE s.user_id = p.user_id), 0),
    'lessons', (SELECT count(*) FROM module_progress m WHERE m.user_id = p.user_id AND m.completed_at IS NOT NULL),
    'calm', (SELECT public.stress_band(sp.stress) FROM sim_profiles sp WHERE sp.id = p.user_id)
  ) FROM profiles p WHERE p.user_id = p_user
$function$;

CREATE OR REPLACE FUNCTION public.public_learners()
 RETURNS TABLE(id uuid, name text, avatar text, avatar_url text, town text, bio text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, left(coalesce(nullif(trim(p.display_name), ''), split_part(p.full_name, ' ', 1)), 40),
         p.avatar,
         CASE WHEN nullif(trim(coalesce(p.avatar_url, '')), '') IS NOT NULL THEN 'avatar:' || p.id::text ELSE NULL END,
         left(p.town, 40), left(p.bio, 140)
  FROM public.profiles p
  WHERE p.show_publicly
    AND coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.full_name), '')) IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id)
  ORDER BY p.updated_at DESC
  LIMIT 60
$function$;
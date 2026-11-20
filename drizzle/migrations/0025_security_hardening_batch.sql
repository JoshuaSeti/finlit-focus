REVOKE EXECUTE ON FUNCTION public.adjust_cash_balance(uuid,numeric,text,text,bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_reputation_score(uuid,numeric,text) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Own rows insert" ON public.learner_event_log;
DROP POLICY IF EXISTS "Own rows update" ON public.learner_event_log;
REVOKE INSERT, UPDATE ON public.learner_event_log FROM anon, authenticated;

DROP POLICY IF EXISTS "Read published module files" ON storage.objects;
CREATE POLICY "Read published module files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'modules' AND (private.is_admin((SELECT auth.uid())) OR (
  EXISTS (SELECT 1 FROM public.learning_modules m WHERE m.is_published AND m.storage_path = objects.name)
  AND EXISTS (SELECT 1 FROM public.lesson_access a WHERE a.user_id = (SELECT auth.uid())))));

CREATE OR REPLACE FUNCTION public.add_friend(p_profile uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT user_id INTO u FROM profiles WHERE id = p_profile;
  IF u IS NULL OR u = auth.uid() THEN RAISE EXCEPTION 'Not found'; END IF;
  INSERT INTO learner_friends (user_id, friend_id) VALUES (auth.uid(), u) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true, 'mutual', EXISTS (SELECT 1 FROM learner_friends WHERE user_id = u AND friend_id = auth.uid()));
END $$;

CREATE OR REPLACE FUNCTION public.my_friends() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce(jsonb_agg(public.learner_card_for(f.friend_id) ORDER BY f.created_at DESC), '[]'::jsonb)
  FROM learner_friends f WHERE f.user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM learner_friends r WHERE r.user_id = f.friend_id AND r.friend_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.learner_card(p_profile uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid; pub boolean;
BEGIN
  SELECT user_id, coalesce(show_publicly, false) INTO u, pub FROM profiles WHERE id = p_profile;
  IF u IS NULL THEN RETURN NULL; END IF;
  IF NOT (pub OR u = auth.uid() OR private.is_admin(auth.uid())
          OR EXISTS (SELECT 1 FROM learner_friends f WHERE f.user_id = u AND f.friend_id = auth.uid())) THEN
    RETURN NULL;
  END IF;
  RETURN learner_card_for(u) || jsonb_build_object(
    'is_me', u = auth.uid(),
    'is_friend', EXISTS (SELECT 1 FROM learner_friends f WHERE f.user_id = auth.uid() AND f.friend_id = u));
END $$;

CREATE OR REPLACE FUNCTION public.story_fire_lesson(p_lesson text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare uid uuid := auth.uid(); m lesson_flag_map; e story_events; v_new int := 0; v_flags text[] := '{}';
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if not exists (select 1 from module_progress mp where mp.user_id = uid and mp.module_slug = 'module-' || p_lesson and mp.completed_at is not null) then
   return jsonb_build_object('error', 'lesson_not_completed');
 end if;
 if exists (select 1 from learner_lessons where profile_id = uid and lesson_id = p_lesson) then
   return jsonb_build_object('ok', true, 'scenarios', 0);
 end if;
 perform story_bootstrap();
 insert into learner_lessons (profile_id, lesson_id) values (uid, p_lesson) on conflict do nothing;
 perform yungsta_mark_guided(uid);
 select * into m from lesson_flag_map where lesson_id = p_lesson;
 if found and not story_has_flag(uid, m.flag_key) then
 perform story_set_flag(uid, m.flag_key, null);
 perform adjust_reputation_score(uid, m.reputation_delta, 'lesson_completed:' || p_lesson);
 v_flags := array[m.flag_key];
 end if;
 for e in select * from story_events where category = 'lesson_bridge' and is_active and trigger_type = 'external_signal' and trigger_config->>'lesson_id' = p_lesson order by id loop
 if (e.repeatable or not exists (select 1 from learner_pending_events where profile_id = uid and event_id = e.id)) and story_eligible(uid, e) then
 insert into learner_pending_events (profile_id, event_id, node_key) values (uid, e.id, e.entry_node);
 v_new := v_new + 1;
 end if;
 end loop;
 perform story_schedule_followups(uid, v_flags);
 perform story_run_unlocks(uid);
 return jsonb_build_object('ok', true, 'scenarios', v_new);
end $function$;

CREATE TABLE IF NOT EXISTS private.job_tokens (name text PRIMARY KEY, token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'));
INSERT INTO private.job_tokens (name) VALUES ('push-reminders') ON CONFLICT DO NOTHING;
REVOKE ALL ON private.job_tokens FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_job_token(p_name text, p_token text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'private' AS $$
  SELECT EXISTS (SELECT 1 FROM private.job_tokens WHERE name = p_name AND token = p_token)
$$;
REVOKE EXECUTE ON FUNCTION public.check_job_token(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_job_token(text,text) TO service_role;

SELECT cron.unschedule('finlit-push-reminders');
SELECT cron.schedule('finlit-push-reminders', '0 * * * *', $$
  SELECT net.http_post(
    url := 'https://jznoczszgcvusizcpzhc.supabase.co/functions/v1/push-reminders',
    headers := jsonb_build_object('Content-Type','application/json','x-job-token',(SELECT token FROM private.job_tokens WHERE name = 'push-reminders')),
    body := '{}'::jsonb
  );
$$);
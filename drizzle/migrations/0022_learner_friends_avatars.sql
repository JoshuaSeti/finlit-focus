ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE TABLE public.learner_friends (
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id)
);
GRANT SELECT ON public.learner_friends TO authenticated;
GRANT ALL ON public.learner_friends TO service_role;
ALTER TABLE public.learner_friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own friendships" ON public.learner_friends FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.learner_card_for(p_user uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'name', left(coalesce(nullif(trim(p.display_name), ''), split_part(p.full_name, ' ', 1), 'Learner'), 40),
    'avatar', p.avatar, 'avatar_url', p.avatar_url, 'town', left(p.town, 40), 'bio', left(p.bio, 140),
    'streak', coalesce((SELECT current_streak FROM learner_streaks s WHERE s.user_id = p.user_id), 0),
    'lessons', (SELECT count(*) FROM module_progress m WHERE m.user_id = p.user_id AND m.completed_at IS NOT NULL),
    'calm', (SELECT public.stress_band(sp.stress) FROM sim_profiles sp WHERE sp.id = p.user_id)
  ) FROM profiles p WHERE p.user_id = p_user
$$;
REVOKE EXECUTE ON FUNCTION public.learner_card_for(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.learner_card(p_profile uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid; pub boolean;
BEGIN
  SELECT user_id, show_publicly INTO u, pub FROM profiles WHERE id = p_profile;
  IF u IS NULL OR EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u) THEN RETURN NULL; END IF;
  IF NOT (pub OR u = auth.uid() OR EXISTS (SELECT 1 FROM learner_friends f WHERE f.user_id = auth.uid() AND f.friend_id = u)) THEN
    -- signed-in visitors with the link can still see the basic card to add a friend
    IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  END IF;
  RETURN learner_card_for(u) || jsonb_build_object(
    'is_me', u = auth.uid(),
    'is_friend', EXISTS (SELECT 1 FROM learner_friends f WHERE f.user_id = auth.uid() AND f.friend_id = u));
END $$;
GRANT EXECUTE ON FUNCTION public.learner_card(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_friend(p_profile uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  SELECT user_id INTO u FROM profiles WHERE id = p_profile;
  IF u IS NULL OR u = auth.uid() THEN RAISE EXCEPTION 'Not found'; END IF;
  INSERT INTO learner_friends (user_id, friend_id) VALUES (auth.uid(), u), (u, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.add_friend(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_friend(p_profile uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  SELECT user_id INTO u FROM profiles WHERE id = p_profile;
  DELETE FROM learner_friends WHERE (user_id = auth.uid() AND friend_id = u) OR (user_id = u AND friend_id = auth.uid());
  RETURN jsonb_build_object('ok', true);
END $$;
GRANT EXECUTE ON FUNCTION public.remove_friend(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.my_friends()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(public.learner_card_for(f.friend_id) ORDER BY f.created_at DESC), '[]'::jsonb)
  FROM learner_friends f WHERE f.user_id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.my_friends() TO authenticated;

DROP FUNCTION IF EXISTS public.public_learners();
CREATE FUNCTION public.public_learners()
RETURNS TABLE(id uuid, name text, avatar text, avatar_url text, town text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, left(coalesce(nullif(trim(p.display_name), ''), split_part(p.full_name, ' ', 1)), 40),
         p.avatar, p.avatar_url, left(p.town, 40), left(p.bio, 140)
  FROM public.profiles p
  WHERE p.show_publicly
    AND coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.full_name), '')) IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id)
  ORDER BY p.updated_at DESC
  LIMIT 60
$$;
GRANT EXECUTE ON FUNCTION public.public_learners() TO anon, authenticated;

CREATE POLICY "Own avatar read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own avatar upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own avatar update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
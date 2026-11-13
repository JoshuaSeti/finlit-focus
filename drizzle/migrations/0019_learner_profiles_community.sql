ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS avatar text NOT NULL DEFAULT '🦁',
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS show_publicly boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.public_learners()
RETURNS TABLE (id uuid, name text, avatar text, town text, bio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, left(coalesce(nullif(trim(p.display_name), ''), split_part(p.full_name, ' ', 1)), 40),
         p.avatar, left(p.town, 40), left(p.bio, 140)
  FROM public.profiles p
  WHERE p.show_publicly
    AND coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.full_name), '')) IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id)
  ORDER BY p.updated_at DESC
  LIMIT 60
$$;
REVOKE ALL ON FUNCTION public.public_learners() FROM public;
GRANT EXECUTE ON FUNCTION public.public_learners() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_learner_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN jsonb_build_object(
    'learners', (SELECT count(*) FROM profiles p WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id)),
    'paid', (SELECT count(*) FROM lesson_access),
    'placed', (SELECT count(DISTINCT user_id) FROM placement_results WHERE user_id IS NOT NULL),
    'new_week', (SELECT count(*) FROM profiles p WHERE p.created_at > now() - interval '7 days'
                   AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id)),
    'applicants', (SELECT count(*) FROM program_applications),
    'pending', (SELECT count(*) FROM program_applications WHERE status = 'pending')
  );
END $$;
REVOKE ALL ON FUNCTION public.admin_learner_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_learner_stats() TO authenticated;
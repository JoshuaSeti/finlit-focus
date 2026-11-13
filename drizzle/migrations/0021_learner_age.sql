ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age smallint CHECK (age IS NULL OR (age BETWEEN 5 AND 120));

CREATE OR REPLACE FUNCTION public.admin_learners()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(x ORDER BY x.created_at DESC) FROM (
    SELECT p.user_id, COALESCE(NULLIF(p.display_name,''), p.full_name) AS name, p.email, p.avatar, p.town, p.age, p.created_at,
      (SELECT jsonb_build_object('correct', pr.correct, 'total', pr.total, 'start_group', pr.start_group, 'at', pr.created_at)
         FROM placement_results pr WHERE pr.user_id = p.user_id ORDER BY pr.created_at DESC LIMIT 1) AS placement,
      (SELECT la.granted_at FROM lesson_access la WHERE la.user_id = p.user_id) AS paid_at,
      (SELECT count(*) FROM module_progress m WHERE m.user_id = p.user_id) AS started,
      (SELECT count(*) FROM module_progress m WHERE m.user_id = p.user_id AND m.completed_at IS NOT NULL) AS completed,
      (SELECT count(*) FROM module_progress m WHERE m.user_id = p.user_id AND m.certificate_claimed_at IS NOT NULL) AS certs,
      s.current_streak AS streak, s.last_active_date AS last_active
    FROM profiles p LEFT JOIN learner_streaks s ON s.user_id = p.user_id
    WHERE NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = p.user_id)
  ) x), '[]'::jsonb);
END $$;
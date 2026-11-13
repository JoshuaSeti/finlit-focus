CREATE OR REPLACE FUNCTION public.admin_learners()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN COALESCE((SELECT jsonb_agg(x ORDER BY x.created_at DESC) FROM (
    SELECT p.user_id, COALESCE(NULLIF(p.display_name,''), p.full_name) AS name, p.email, p.avatar, p.town, p.created_at,
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

CREATE OR REPLACE FUNCTION public.admin_learner_detail(p_user uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN jsonb_build_object(
    'modules', COALESCE((SELECT jsonb_agg(jsonb_build_object('slug', m.module_slug, 'title', lm.title,
        'done', m.sections_done, 'total', m.sections_total, 'completed_at', m.completed_at,
        'quiz_correct', m.quiz_correct, 'quiz_total', m.quiz_total, 'updated_at', m.updated_at) ORDER BY m.module_slug)
      FROM module_progress m LEFT JOIN learning_modules lm ON lm.slug = m.module_slug WHERE m.user_id = p_user), '[]'::jsonb),
    'sim', (SELECT jsonb_build_object('character', sp.character_name, 'cash', sp.cash_balance, 'stress', sp.stress,
        'band', stress_band(sp.stress)) FROM sim_profiles sp WHERE sp.id = p_user),
    'payments', COALESCE((SELECT jsonb_agg(jsonb_build_object('amount', lp.amount, 'phone', lp.phone, 'status', lp.status,
        'ref', lp.reference_id, 'at', lp.created_at) ORDER BY lp.created_at DESC)
      FROM lipila_payments lp WHERE lp.user_id = p_user), '[]'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.admin_learners() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_learner_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_learners() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_learner_detail(uuid) TO authenticated;
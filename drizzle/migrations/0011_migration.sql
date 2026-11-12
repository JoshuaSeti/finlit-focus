CREATE TABLE public.learner_streaks (
  user_id uuid PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  usual_hour integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learner_streaks TO authenticated;
GRANT ALL ON public.learner_streaks TO service_role;
ALTER TABLE public.learner_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own streak" ON public.learner_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.streak_touch(p_hour integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  today date := (now() AT TIME ZONE 'Africa/Lusaka')::date;
  r public.learner_streaks;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  INSERT INTO public.learner_streaks(user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  SELECT * INTO r FROM public.learner_streaks WHERE user_id = uid FOR UPDATE;
  IF r.last_active_date IS DISTINCT FROM today THEN
    IF r.last_active_date = today - 1 THEN r.current_streak := r.current_streak + 1;
    ELSE r.current_streak := 1; END IF;
    r.longest_streak := GREATEST(r.longest_streak, r.current_streak);
    r.last_active_date := today;
  END IF;
  UPDATE public.learner_streaks SET current_streak = r.current_streak, longest_streak = r.longest_streak,
    last_active_date = r.last_active_date,
    usual_hour = CASE WHEN p_hour BETWEEN 0 AND 23 THEN p_hour ELSE usual_hour END, updated_at = now()
  WHERE user_id = uid;
  RETURN jsonb_build_object('current', r.current_streak, 'longest', r.longest_streak, 'today', true);
END $$;
REVOKE ALL ON FUNCTION public.streak_touch(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.streak_touch(integer) TO authenticated;
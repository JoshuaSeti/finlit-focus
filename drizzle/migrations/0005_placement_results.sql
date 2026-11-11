CREATE TABLE public.placement_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  start_group text NOT NULL,
  correct integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX placement_results_user_idx ON public.placement_results(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.placement_results TO authenticated;
GRANT ALL ON public.placement_results TO service_role;
ALTER TABLE public.placement_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own placement read" ON public.placement_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own placement insert" ON public.placement_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
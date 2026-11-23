DROP POLICY IF EXISTS "Learners manage own field progress" ON public.field_progress;
CREATE POLICY "Learners read own field progress" ON public.field_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.field_progress FROM anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.field_progress TO authenticated;

DROP POLICY IF EXISTS "Own rows insert" ON public.learner_feature_unlocks;
DROP POLICY IF EXISTS "Own rows update" ON public.learner_feature_unlocks;
REVOKE INSERT, UPDATE, DELETE ON public.learner_feature_unlocks FROM anon, authenticated;

DROP POLICY IF EXISTS "Own rows insert" ON public.holdings;
DROP POLICY IF EXISTS "Own rows update" ON public.holdings;
REVOKE INSERT, UPDATE, DELETE ON public.holdings FROM anon, authenticated;

CREATE POLICY "Admins delete answers" ON public.question_answers FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()));

REVOKE SELECT ON public.engine_settings FROM anon;

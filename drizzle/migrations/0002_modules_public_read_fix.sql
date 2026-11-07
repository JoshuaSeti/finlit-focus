DROP POLICY "Published modules are public" ON public.learning_modules;
CREATE POLICY "Published modules are public" ON public.learning_modules FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "Admins see all modules" ON public.learning_modules FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));
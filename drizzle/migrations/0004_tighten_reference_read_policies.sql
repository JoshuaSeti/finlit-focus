DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['instrument_price_history','character_trait_rules','lesson_titles','lender_products','venture_category_rates','yungsta_questions','yungsta_blunders','stress_flag_effects','lender_limit_rules','lesson_flag_map','instruments'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Signed-in read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Players read" ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sim_profiles sp WHERE sp.id = auth.uid()) OR private.is_admin(auth.uid()))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Anyone reads engine settings" ON public.engine_settings;
CREATE POLICY "Admins read engine settings" ON public.engine_settings FOR SELECT TO authenticated USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone reads course fields" ON public.course_fields;

DROP POLICY IF EXISTS "Anyone can read module files" ON storage.objects;
CREATE POLICY "Read published module files" ON storage.objects FOR SELECT
USING (bucket_id = 'modules' AND (
  EXISTS (SELECT 1 FROM public.learning_modules m WHERE m.is_published AND m.storage_path = storage.objects.name)
  OR private.is_admin(auth.uid())
));
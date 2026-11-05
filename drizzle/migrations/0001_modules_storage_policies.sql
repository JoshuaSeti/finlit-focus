CREATE POLICY "Anyone can read module files" ON storage.objects FOR SELECT USING (bucket_id = 'modules');
CREATE POLICY "Admins upload module files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'modules' AND private.is_admin(auth.uid()));
CREATE POLICY "Admins update module files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'modules' AND private.is_admin(auth.uid()));
CREATE POLICY "Admins delete module files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'modules' AND private.is_admin(auth.uid()));
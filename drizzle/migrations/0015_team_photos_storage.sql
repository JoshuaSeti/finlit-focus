CREATE POLICY "Anyone can view team photos" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'team-photos');
CREATE POLICY "Super admins upload team photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-photos' AND private.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update team photos" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'team-photos' AND private.is_super_admin(auth.uid()));
CREATE POLICY "Super admins delete team photos" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'team-photos' AND private.is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND char_length(btrim(school_name)) BETWEEN 1 AND 200
  AND char_length(btrim(contact_name)) BETWEEN 1 AND 200
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) <= 30)
  AND char_length(btrim(message)) BETWEEN 1 AND 5000
);

DROP POLICY IF EXISTS "Read published module files" ON storage.objects;
CREATE POLICY "Read published module files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'modules' AND auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.learning_modules m WHERE m.is_published AND m.storage_path = objects.name)
    OR private.is_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "Anyone can view team photos" ON storage.objects;
CREATE POLICY "Admins can view team photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'team-photos' AND private.is_admin(auth.uid()));
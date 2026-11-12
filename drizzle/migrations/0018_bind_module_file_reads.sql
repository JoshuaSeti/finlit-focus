DROP POLICY IF EXISTS "Read published module files" ON storage.objects;
CREATE POLICY "Read published module files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'modules' AND (
    private.is_admin((select auth.uid()))
    OR (
      EXISTS (SELECT 1 FROM public.learning_modules m WHERE m.is_published AND m.storage_path = objects.name)
      AND (
        EXISTS (SELECT 1 FROM public.lesson_access a WHERE a.user_id = (select auth.uid()))
        OR EXISTS (SELECT 1 FROM public.placement_results p WHERE p.user_id = (select auth.uid()))
      )
    )
  )
);
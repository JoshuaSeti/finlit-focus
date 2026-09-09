
-- 1. Recreate policies using the private helper instead of public.has_role
DROP POLICY IF EXISTS "Admins manage announcements" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone views active announcements" ON public.announcements;
CREATE POLICY "Anyone views active announcements" ON public.announcements FOR SELECT
  USING ((is_active = true) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
CREATE POLICY "Admins manage programs" ON public.programs FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone views active programs" ON public.programs;
CREATE POLICY "Anyone views active programs" ON public.programs FOR SELECT
  USING ((is_active = true) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view applications" ON public.program_applications;
CREATE POLICY "Admins view applications" ON public.program_applications FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins update applications" ON public.program_applications;
CREATE POLICY "Admins update applications" ON public.program_applications FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins delete applications" ON public.program_applications;
CREATE POLICY "Admins delete applications" ON public.program_applications FOR DELETE TO authenticated
  USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update engine settings" ON public.engine_settings;
CREATE POLICY "Admins update engine settings" ON public.engine_settings FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins insert engine settings" ON public.engine_settings;
CREATE POLICY "Admins insert engine settings" ON public.engine_settings FOR INSERT TO authenticated
  WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage skill fields" ON public.skill_fields;
CREATE POLICY "Admins manage skill fields" ON public.skill_fields FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone reads published courses" ON public.courses;
CREATE POLICY "Anyone reads published courses" ON public.courses FOR SELECT
  USING ((status = 'published'::publish_status) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage course fields" ON public.course_fields;
CREATE POLICY "Admins manage course fields" ON public.course_fields FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage course lessons" ON public.course_lessons;
CREATE POLICY "Admins manage course lessons" ON public.course_lessons FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Signed in read published lessons" ON public.course_lessons;
CREATE POLICY "Signed in read published lessons" ON public.course_lessons FOR SELECT TO authenticated
  USING ((status = 'published'::publish_status) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage questions" ON public.questions;
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Signed in read published questions" ON public.questions;
CREATE POLICY "Signed in read published questions" ON public.questions FOR SELECT TO authenticated
  USING ((status = 'published'::publish_status) OR private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins manage all enrollments" ON public.course_enrollments FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all field progress" ON public.field_progress;
CREATE POLICY "Admins manage all field progress" ON public.field_progress FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view lesson completions" ON public.lesson_completions;
CREATE POLICY "Admins view lesson completions" ON public.lesson_completions FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view all checks" ON public.assessment_checks;
CREATE POLICY "Admins view all checks" ON public.assessment_checks FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view all answers" ON public.question_answers;
CREATE POLICY "Admins view all answers" ON public.question_answers FOR SELECT TO authenticated
  USING (private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage content versions" ON public.content_versions;
CREATE POLICY "Admins manage content versions" ON public.content_versions FOR ALL TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

-- 2. Remove the publicly callable helper and lock down the signup trigger function
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

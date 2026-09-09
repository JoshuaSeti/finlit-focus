
-- ENUMS
CREATE TYPE public.course_type AS ENUM ('core','elective');
CREATE TYPE public.publish_status AS ENUM ('draft','published');
CREATE TYPE public.lesson_template AS ENUM ('reading','video_reflection','drag_drop','branching_scenario','interactive');
CREATE TYPE public.check_kind AS ENUM ('diagnostic','field_check','lesson_check','refresher','retention');
CREATE TYPE public.field_state AS ENUM ('locked','open','passed','needs_review');

-- SETTINGS (singleton)
CREATE TABLE public.engine_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  core_levels int NOT NULL DEFAULT 3,
  tier_weights jsonb NOT NULL DEFAULT '{"1":1,"2":2,"3":3}'::jsonb,
  check_length int NOT NULL DEFAULT 6,
  pass_threshold numeric NOT NULL DEFAULT 3.5,
  ceiling_tier3_correct int NOT NULL DEFAULT 1,
  min_reliability_questions int NOT NULL DEFAULT 4,
  rolling_window_unit text NOT NULL DEFAULT 'questions',
  rolling_window_size int NOT NULL DEFAULT 15,
  repeat_avoid_checks int NOT NULL DEFAULT 2,
  lessons_before_check int NOT NULL DEFAULT 3,
  diagnostic_questions_per_field int NOT NULL DEFAULT 3,
  refresher_questions_per_field int NOT NULL DEFAULT 3,
  refresher_blocking boolean NOT NULL DEFAULT false,
  lesson_checks_enabled boolean NOT NULL DEFAULT false,
  lesson_check_count int NOT NULL DEFAULT 2,
  lesson_checks_count_toward_mastery boolean NOT NULL DEFAULT false,
  retention_enabled boolean NOT NULL DEFAULT false,
  retention_interval_days int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.engine_settings TO authenticated, anon;
GRANT INSERT, UPDATE ON public.engine_settings TO authenticated;
GRANT ALL ON public.engine_settings TO service_role;
ALTER TABLE public.engine_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads engine settings" ON public.engine_settings FOR SELECT USING (true);
CREATE POLICY "Admins update engine settings" ON public.engine_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins insert engine settings" ON public.engine_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_engine_settings_updated BEFORE UPDATE ON public.engine_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.engine_settings (singleton) VALUES (true);

-- SKILL FIELDS
CREATE TABLE public.skill_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skill_fields TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.skill_fields TO authenticated;
GRANT ALL ON public.skill_fields TO service_role;
ALTER TABLE public.skill_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads skill fields" ON public.skill_fields FOR SELECT USING (true);
CREATE POLICY "Admins manage skill fields" ON public.skill_fields FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_skill_fields_updated BEFORE UPDATE ON public.skill_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  course_type public.course_type NOT NULL DEFAULT 'core',
  track text,
  level int NOT NULL DEFAULT 1,
  description text,
  cover_image_url text,
  icon text,
  accent_color text,
  status public.publish_status NOT NULL DEFAULT 'draft',
  field_order_mode text NOT NULL DEFAULT 'diagnostic',
  prerequisite_rule jsonb NOT NULL DEFAULT '{"mode":"auto","conditions":[]}'::jsonb,
  settings_override jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published courses" ON public.courses FOR SELECT
  USING (status = 'published' OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- COURSE <-> FIELD
CREATE TABLE public.course_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, field_id)
);
GRANT SELECT ON public.course_fields TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.course_fields TO authenticated;
GRANT ALL ON public.course_fields TO service_role;
ALTER TABLE public.course_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads course fields" ON public.course_fields FOR SELECT USING (true);
CREATE POLICY "Admins manage course fields" ON public.course_fields FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));

-- COURSE LESSONS
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE RESTRICT,
  title text NOT NULL,
  template public.lesson_template NOT NULL DEFAULT 'reading',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  position int NOT NULL DEFAULT 0,
  status public.publish_status NOT NULL DEFAULT 'draft',
  comprehension_enabled boolean,
  comprehension_count int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.course_lessons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read published lessons" ON public.course_lessons FOR SELECT TO authenticated
  USING (status = 'published' OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage course lessons" ON public.course_lessons FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_course_lessons_updated BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- QUESTIONS
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  tier int NOT NULL DEFAULT 1,
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index int NOT NULL DEFAULT 0,
  explanation text,
  status public.publish_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read published questions" ON public.questions FOR SELECT TO authenticated
  USING (status = 'published' OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ENROLLMENTS
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  diagnostic_done boolean NOT NULL DEFAULT false,
  field_queue jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage own enrollments" ON public.course_enrollments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all enrollments" ON public.course_enrollments FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FIELD PROGRESS
CREATE TABLE public.field_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE CASCADE,
  state public.field_state NOT NULL DEFAULT 'open',
  star_rating numeric NOT NULL DEFAULT 0,
  lessons_since_check int NOT NULL DEFAULT 0,
  lessons_completed int NOT NULL DEFAULT 0,
  queue_position int NOT NULL DEFAULT 0,
  passed_at timestamptz,
  last_retention_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, field_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_progress TO authenticated;
GRANT ALL ON public.field_progress TO service_role;
ALTER TABLE public.field_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage own field progress" ON public.field_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all field progress" ON public.field_progress FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_field_progress_updated BEFORE UPDATE ON public.field_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LESSON COMPLETIONS
CREATE TABLE public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, DELETE ON public.lesson_completions TO authenticated;
GRANT ALL ON public.lesson_completions TO service_role;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage own lesson completions" ON public.lesson_completions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view lesson completions" ON public.lesson_completions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));

-- CHECKS
CREATE TABLE public.assessment_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid REFERENCES public.skill_fields(id) ON DELETE SET NULL,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  kind public.check_kind NOT NULL,
  length int NOT NULL DEFAULT 6,
  completed boolean NOT NULL DEFAULT false,
  star_rating numeric,
  passed boolean,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_checks TO authenticated;
GRANT ALL ON public.assessment_checks TO service_role;
ALTER TABLE public.assessment_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage own checks" ON public.assessment_checks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all checks" ON public.assessment_checks FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_checks_updated BEFORE UPDATE ON public.assessment_checks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ANSWERS
CREATE TABLE public.question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  check_id uuid REFERENCES public.assessment_checks(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.skill_fields(id) ON DELETE CASCADE,
  kind public.check_kind NOT NULL DEFAULT 'field_check',
  tier int NOT NULL,
  selected_index int,
  is_correct boolean NOT NULL,
  counts_toward_mastery boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.question_answers TO authenticated;
GRANT ALL ON public.question_answers TO service_role;
ALTER TABLE public.question_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learners manage own answers" ON public.question_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all answers" ON public.question_answers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE INDEX idx_answers_user_field ON public.question_answers (user_id, field_id, created_at DESC);

-- VERSION HISTORY
CREATE TABLE public.content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.content_versions TO authenticated;
GRANT ALL ON public.content_versions TO service_role;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage content versions" ON public.content_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE INDEX idx_versions_entity ON public.content_versions (entity_type, entity_id, created_at DESC);

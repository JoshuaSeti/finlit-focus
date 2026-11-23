REVOKE EXECUTE ON FUNCTION public.story_has_flag(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.story_days_since_signup(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.story_fill(uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.story_flag_any(uuid,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.story_lender_ceiling(uuid,text) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Own rows insert" ON public.learner_pending_events;
DROP POLICY IF EXISTS "Own rows update" ON public.learner_pending_events;
REVOKE INSERT, UPDATE ON public.learner_pending_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.module_progress_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('postgres','service_role','supabase_admin') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.user_id := OLD.user_id; NEW.module_slug := OLD.module_slug; NEW.created_at := OLD.created_at;
    IF OLD.completed_at IS NOT NULL THEN NEW.completed_at := OLD.completed_at; RETURN NEW; END IF;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.sections_total > 0 AND NEW.sections_total <= 100
     AND NEW.sections_done >= NEW.sections_total
     AND now() - OLD.created_at >= interval '2 minutes' THEN
    NEW.completed_at := now();
  ELSE
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS module_progress_guard ON public.module_progress;
CREATE TRIGGER module_progress_guard BEFORE INSERT OR UPDATE ON public.module_progress
FOR EACH ROW EXECUTE FUNCTION public.module_progress_guard();
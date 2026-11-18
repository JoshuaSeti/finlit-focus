DROP POLICY IF EXISTS "Signed-in read" ON public.quiz_archetypes;
DROP POLICY IF EXISTS "Signed-in read" ON public.quiz_dim_stats;
DROP POLICY IF EXISTS "Signed-in read" ON public.sim_config;
DROP POLICY IF EXISTS "Anyone reads skill fields" ON public.skill_fields;
DROP POLICY IF EXISTS "Signed-in read" ON public.quiz_presets;
DROP POLICY IF EXISTS "Signed-in read" ON public.story_event_lessons;
DROP POLICY IF EXISTS "Signed-in read" ON public.sim_goals;
DROP POLICY IF EXISTS "Signed-in read" ON public.story_loan_products;
DROP POLICY IF EXISTS "Signed-in read" ON public.story_events;
DROP POLICY IF EXISTS "Signed-in read" ON public.story_nodes;

-- Helpers that read game content from a learner's context keep working.
ALTER FUNCTION public.story_game_months_to_days(numeric) SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.debts_set_schedule() SECURITY DEFINER SET search_path = public;
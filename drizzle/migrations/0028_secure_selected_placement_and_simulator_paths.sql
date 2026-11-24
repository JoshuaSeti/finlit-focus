ALTER TABLE public.placement_results ADD COLUMN IF NOT EXISTS server_scored boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.placement_results.server_scored IS 'Trusted scoring marker; existing earliest placement per learner is preserved as a frozen legacy assignment.';
UPDATE public.placement_results p SET server_scored = true WHERE p.id IN (SELECT DISTINCT ON (user_id) id FROM public.placement_results ORDER BY user_id, created_at, id);
REVOKE INSERT, UPDATE, DELETE ON public.placement_results FROM anon, authenticated;
DROP POLICY IF EXISTS "Own placement insert" ON public.placement_results;
GRANT SELECT ON public.placement_results TO authenticated;
GRANT ALL ON public.placement_results TO service_role;
CREATE OR REPLACE FUNCTION public.submit_placement(p_answers integer[]) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE uid uuid := auth.uid(); groups text[] := ARRAY['group-0','group-0','group-1','group-1','group-1','group-1','group-1','group-2','group-2','group-2','group-3','group-3','group-3','group-4','group-4']; scores jsonb := '{}'; g text; c integer; t integer; correct integer := 0; start_group text := NULL; i integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF p_answers IS NULL OR cardinality(p_answers) <> 15 OR array_ndims(p_answers) <> 1 OR array_lower(p_answers,1) <> 1 THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 FOR i IN 1..15 LOOP IF p_answers[i] IS NULL OR p_answers[i] < -1 OR p_answers[i] > 3 THEN RAISE EXCEPTION 'Invalid answer'; END IF; END LOOP;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text, 0));
 IF EXISTS (SELECT 1 FROM public.placement_results WHERE user_id=uid AND server_scored) AND NOT EXISTS (SELECT 1 FROM public.lesson_access WHERE user_id=uid) THEN RAISE EXCEPTION 'Paid access required for retakes' USING ERRCODE='42501'; END IF;
 FOREACH g IN ARRAY ARRAY['group-0','group-1','group-2','group-3','group-4'] LOOP
 c := 0; t := 0;
 FOR i IN 1..15 LOOP IF groups[i]=g THEN t:=t+1; IF p_answers[i]=0 THEN c:=c+1; END IF; END IF; END LOOP;
 correct := correct+c;
 scores := scores || jsonb_build_object(g,jsonb_build_object('c',c,'t',t));
 IF start_group IS NULL AND c::numeric/t < 0.66 THEN start_group := g; END IF;
 END LOOP;
 start_group := coalesce(start_group,'group-4');
 INSERT INTO public.placement_results(user_id,scores,start_group,correct,total,server_scored) VALUES(uid,scores,start_group,correct,15,true);
 RETURN jsonb_build_object('scores',scores,'start_group',start_group,'correct',correct,'total',15);
END $fn$;
REVOKE ALL ON FUNCTION public.submit_placement(integer[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_placement(integer[]) TO authenticated,service_role;
REVOKE INSERT, UPDATE, DELETE ON public.learner_flags FROM anon, authenticated;
DROP POLICY IF EXISTS "Own rows insert" ON public.learner_flags;
DROP POLICY IF EXISTS "Own rows update" ON public.learner_flags;
GRANT ALL ON public.learner_flags TO service_role;
CREATE OR REPLACE FUNCTION public.debt_quote(p_product text,p_amount numeric,p_term_months integer DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $fn$
DECLARE lp public.lender_products; n int; v_int numeric; v_total numeric;
BEGIN
 IF auth.uid() IS NULL OR NOT (EXISTS(SELECT 1 FROM public.sim_profiles WHERE id=auth.uid()) OR private.is_admin(auth.uid())) THEN RETURN jsonb_build_object('error','not_authorized'); END IF;
 SELECT * INTO lp FROM public.lender_products WHERE product=p_product;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','bad_product'); END IF;
 IF p_amount IS NULL OR p_amount<=0 THEN RETURN jsonb_build_object('error','bad_amount'); END IF;
 n:=coalesce(p_term_months,lp.term_default,1);
 IF lp.term_options IS NOT NULL AND NOT(n=ANY(lp.term_options)) THEN RETURN jsonb_build_object('error','bad_term'); END IF;
 v_int:=round(p_amount*lp.annual_rate/100.0*n/12.0,2); v_total:=p_amount+v_int;
 RETURN jsonb_build_object('product',lp.product,'label',lp.label,'rate',lp.annual_rate,'term_months',n,'structure',lp.structure,'total_interest',v_int,'total_repay',v_total,'monthly_payment',CASE WHEN lp.structure='installment' THEN round(v_total/n,2) WHEN lp.structure='bullet' THEN v_total ELSE 0 END,'rollover_fee_pct',lp.rollover_fee_pct,'lesson',lp.lesson_id,'terms',lp.term_options);
END $fn$;
CREATE OR REPLACE FUNCTION public.practice_progress(p uuid,p_lesson text,p_session bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE v_total int:=0; v_ans int:=0; v_ok int:=0; v_has boolean:=false; v_sdone boolean:=true; v_done boolean;
BEGIN
 IF auth.uid() IS NULL OR p IS DISTINCT FROM auth.uid() THEN RETURN jsonb_build_object('error','not_authorized'); END IF;
 IF p_session IS NULL OR NOT EXISTS(SELECT 1 FROM public.learner_practice WHERE id=p_session AND profile_id=auth.uid() AND lesson_id=p_lesson) THEN RETURN jsonb_build_object('error','invalid_session'); END IF;
 SELECT count(*),count(*) FILTER(WHERE lq.status='answered'),count(*) FILTER(WHERE lq.correct IS true) INTO v_total,v_ans,v_ok FROM public.learner_questions lq WHERE lq.profile_id=p AND lq.practice_id=p_session;
 SELECT count(*)>0,coalesce(bool_and(pe.status='done'),true) INTO v_has,v_sdone FROM public.learner_pending_events pe JOIN public.story_events e ON e.id=pe.event_id WHERE pe.profile_id=p AND e.category='lesson_bridge' AND e.trigger_config->>'lesson_id'=p_lesson;
 v_done:=(v_total=0 AND NOT v_has) OR (v_ans>=v_total AND v_sdone);
 IF v_done THEN UPDATE public.learner_practice SET completed_at=coalesce(completed_at,now()),correct_count=v_ok WHERE id=p_session AND profile_id=auth.uid() AND lesson_id=p_lesson; END IF;
 RETURN jsonb_build_object('available',NOT(v_total=0 AND NOT v_has),'done',v_done,'title',public.practice_title(p_lesson),'answered',v_ans,'total',v_total,'questions',jsonb_build_object('total',v_total,'answered',v_ans,'correct',v_ok),'scenario',jsonb_build_object('has',v_has,'done',(v_has AND v_sdone)));
END $fn$;
REVOKE ALL ON FUNCTION public.debt_quote(text,numeric,integer),public.practice_progress(uuid,text,bigint) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.debt_quote(text,numeric,integer),public.practice_progress(uuid,text,bigint) TO authenticated,service_role;
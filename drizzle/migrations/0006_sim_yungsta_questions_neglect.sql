create index if not exists learner_questions_lookup on public.learner_questions (profile_id, status, available_at);
create index if not exists learner_blunders_lookup on public.learner_blunders (profile_id, status);
revoke all on public.yungsta_questions from anon, authenticated;
revoke insert, update, delete, truncate on public.learner_lessons, public.learner_questions from anon, authenticated;
revoke all on public.yungsta_blunders from anon, authenticated;
revoke insert, update, delete, truncate on public.learner_blunders from anon, authenticated;

create or replace function public.sim_today() returns date language sql stable set search_path = public as $$
 select (now() at time zone 'Africa/Lusaka')::date
$$;
create or replace function public.sim_cfg(k text, d numeric) returns numeric
language sql stable security definer set search_path = public as $$
 select coalesce((select value::numeric from sim_config where key = k), d)
$$;

create or replace function public.yungsta_neglect_check(p uuid)
returns int language plpgsql security definer set search_path = public as $$
declare
 v_today date := sim_today(); pr sim_profiles; v_first date; v_start date; v_from date;
 v_max int; v_pct numeric; v_n int; i int; d date; b yungsta_blunders; v_cash numeric; v_amt numeric;
 v_id bigint; v_made int := 0; v_used bigint[] := '{}';
begin
 select * into pr from sim_profiles where id = p;
 if not found then return 0; end if;
 select (min(completed_at) at time zone 'Africa/Lusaka')::date into v_first from learner_lessons where profile_id = p;
 if v_first is null then return 0; end if;
 v_start := v_first + sim_cfg('neglect_free_days', 3)::int;
 v_from := greatest(v_start, coalesce(pr.last_guided_on + 1, v_start),
 coalesce(pr.neglect_through + 1, v_start), coalesce(pr.paused_until + 1, v_start));
 if v_from > v_today - 1 then return 0; end if;
 v_max := sim_cfg('neglect_max_days', 3)::int;
 v_pct := sim_cfg('neglect_loss_pct', 0.10);
 v_n := least((v_today - 1) - v_from + 1, v_max);
 for i in 1..v_n loop
 d := (v_today - 1) - (v_n - i);
 select * into b from yungsta_blunders where is_active and id <> all (v_used) order by random() limit 1;
 if b.id is null then select * into b from yungsta_blunders where is_active order by random() limit 1; end if;
 exit when b.id is null;
 select cash_balance into v_cash from sim_profiles where id = p;
 v_amt := least(v_cash, round(v_cash * v_pct * b.loss_mult, 2));
 if v_amt <= 0 then continue; end if;
 insert into learner_blunders (profile_id, blunder_id, missed_on, amount, option_order)
 values (p, b.id, d, v_amt, array(select k from generate_series(0, jsonb_array_length(b.debrief_options) - 1) k order by random()))
 returning id into v_id;
 perform adjust_cash_balance(p, -v_amt, 'yungsta_blunder', 'yungsta_blunders', v_id);
 v_used := v_used || b.id; v_made := v_made + 1;
 end loop;
 update sim_profiles set neglect_through = v_today - 1 where id = p;
 if v_made > 0 and not story_has_flag(p, 'left_unguided') then perform story_set_flag(p, 'left_unguided', null); end if;
 return v_made;
end $$;

create or replace function public.yungsta_mark_guided(p uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
 perform yungsta_neglect_check(p);
 update sim_profiles set last_guided_on = sim_today() where id = p and (last_guided_on is null or last_guided_on < sim_today());
end $$;

create or replace function public.yungsta_status(p uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare pr sim_profiles; v_first date; v_today date := sim_today();
begin
 select * into pr from sim_profiles where id = p;
 select (min(completed_at) at time zone 'Africa/Lusaka')::date into v_first from learner_lessons where profile_id = p;
 return jsonb_build_object(
 'active', (v_first is not null and v_today >= v_first + sim_cfg('neglect_free_days', 3)::int),
 'guided_today', (pr.last_guided_on = v_today),
 'paused', (pr.paused_until is not null and pr.paused_until >= v_today),
 'can_pause', (pr.last_pause_on is null or pr.last_pause_on <= v_today - sim_cfg('pause_cooldown_days', 14)::int),
 'pause_days', sim_cfg('pause_max_days', 3)::int,
 'loss_pct', sim_cfg('neglect_loss_pct', 0.10));
end $$;

create or replace function public.yungsta_blunders_new(p uuid)
returns jsonb language sql stable security definer set search_path = public as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'id', lb.id, 'title', story_fill(p, b.title), 'story', story_fill(p, b.story),
 'amount', lb.amount, 'missed_on', lb.missed_on,
 'question', story_fill(p, b.debrief_question),
 'options', (select jsonb_agg(jsonb_build_object('index', t.ord - 1, 'text', story_fill(p, b.debrief_options -> t.idx ->> 'text')) order by t.ord)
 from unnest(lb.option_order) with ordinality as t(idx, ord))
 ) order by lb.missed_on), '[]'::jsonb)
 from learner_blunders lb join yungsta_blunders b on b.id = lb.blunder_id
 where lb.profile_id = p and lb.status = 'new'
$$;

create or replace function public.yungsta_debrief(p_id bigint, p_choice int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); lb learner_blunders; b yungsta_blunders; v_orig int; v_ok boolean; v_rec numeric := 0;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into lb from learner_blunders where id = p_id and profile_id = uid and status = 'new' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 if p_choice is null or p_choice < 0 or p_choice >= array_length(lb.option_order, 1) then
 return jsonb_build_object('error', 'bad_choice');
 end if;
 select * into b from yungsta_blunders where id = lb.blunder_id;
 v_orig := lb.option_order[p_choice + 1];
 v_ok := (v_orig = b.correct_index);
 if v_ok then
 v_rec := round(lb.amount * sim_cfg('neglect_recover_pct', 0.5), 2);
 if v_rec > 0 then perform adjust_cash_balance(uid, v_rec, 'yungsta_recovery', 'learner_blunders', lb.id); end if;
 perform adjust_reputation_score(uid, 1, 'debriefed: ' || b.blunder_key);
 if not story_has_flag(uid, 'debriefed_after_mistakes') then perform story_set_flag(uid, 'debriefed_after_mistakes', null); end if;
 end if;
 update learner_blunders set status = 'debriefed', recovered = v_rec, debriefed_at = now() where id = lb.id;
 perform yungsta_mark_guided(uid);
 return jsonb_build_object('correct', v_ok, 'recovered', v_rec,
 'feedback', story_fill(uid, b.debrief_options -> v_orig ->> 'fb'),
 'right_text', story_fill(uid, b.debrief_options -> b.correct_index ->> 'text'),
 'explanation', story_fill(uid, b.debrief_options -> b.correct_index ->> 'fb'),
 'recovery_text', case when v_ok then story_fill(uid, b.recovery_text) else null end,
 'cash', (select cash_balance from sim_profiles where id = uid));
end $$;

create or replace function public.yungsta_blunders_skip()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 update learner_blunders set status = 'skipped' where profile_id = uid and status = 'new';
 return jsonb_build_object('ok', true);
end $$;

create or replace function public.yungsta_pause(p_days int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr sim_profiles; v_today date := sim_today(); v_max int := sim_cfg('pause_max_days', 3)::int; v_d int;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 v_d := least(coalesce(p_days, v_max), v_max);
 select * into pr from sim_profiles where id = uid;
 if pr.last_pause_on is not null and pr.last_pause_on > v_today - sim_cfg('pause_cooldown_days', 14)::int then
 return jsonb_build_object('error', 'cooldown', 'available_on', pr.last_pause_on + sim_cfg('pause_cooldown_days', 14)::int);
 end if;
 perform yungsta_neglect_check(uid);
 update sim_profiles set paused_until = v_today + v_d - 1, last_pause_on = v_today where id = uid;
 return jsonb_build_object('ok', true, 'days', v_d);
end $$;

create or replace function public.yungsta_schedule(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare q yungsta_questions; n int;
begin
 if exists (select 1 from learner_questions where profile_id = p and status = 'pending') then return; end if;
 if (select count(*) from learner_questions where profile_id = p and created_at::date = current_date) >= 2 then return; end if;
 if exists (select 1 from learner_questions where profile_id = p and created_at > now() - interval '3 hours') then return; end if;
 select yq.* into q from yungsta_questions yq
 where yq.is_active
 and exists (select 1 from learner_lessons ll where ll.profile_id = p and ll.lesson_id = yq.lesson_id)
 and not exists (select 1 from learner_questions lq where lq.profile_id = p and lq.question_id = yq.id
 and (lq.status = 'pending' or lq.created_at > now() - interval '20 hours'))
 order by (select max(lq.created_at) from learner_questions lq where lq.profile_id = p and lq.question_id = yq.id) asc nulls first,
 random()
 limit 1;
 if q.id is null then return; end if;
 n := jsonb_array_length(q.options);
 insert into learner_questions (profile_id, question_id, option_order)
 values (p, q.id, array(select i from generate_series(0, n - 1) i order by random()));
end $$;

create or replace function public.yungsta_current(p uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare lq learner_questions; q yungsta_questions; v_opts jsonb;
begin
 select * into lq from learner_questions
 where profile_id = p and status = 'pending' and available_at <= now()
 order by available_at limit 1;
 if lq.id is null then return null; end if;
 select * into q from yungsta_questions where id = lq.question_id;
 select jsonb_agg(jsonb_build_object('index', ord - 1, 'text', story_fill(p, q.options -> (idx) ->> 'text')) order by ord)
 into v_opts from unnest(lq.option_order) with ordinality as t(idx, ord);
 return jsonb_build_object('id', lq.id, 'topic', q.topic, 'question', story_fill(p, q.question),
 'options', v_opts, 'attempt', lq.attempt);
end $$;

create or replace function public.yungsta_answer(p_id bigint, p_choice int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); lq learner_questions; q yungsta_questions;
 v_orig int; v_ok boolean; v_n int;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into lq from learner_questions
 where id = p_id and profile_id = uid and status = 'pending' and available_at <= now() for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 v_n := array_length(lq.option_order, 1);
 if p_choice is null or p_choice < 0 or p_choice >= v_n then return jsonb_build_object('error', 'bad_choice'); end if;
 select * into q from yungsta_questions where id = lq.question_id;
 v_orig := lq.option_order[p_choice + 1];
 v_ok := (v_orig = q.correct_index);
 update learner_questions set status = 'answered', answered_at = now(), chosen_index = v_orig, correct = v_ok where id = lq.id;
 perform yungsta_mark_guided(uid);
 if v_ok and lq.attempt = 1 then perform adjust_reputation_score(uid, 0.5, 'taught correctly: ' || q.question_key); end if;
 if not v_ok and lq.attempt < 3 then
 insert into learner_questions (profile_id, question_id, attempt, option_order, available_at)
 values (uid, q.id, lq.attempt + 1,
 array(select i from generate_series(0, v_n - 1) i order by random()), now() + interval '2 days');
 end if;
 return jsonb_build_object(
 'correct', v_ok,
 'reaction', story_fill(uid, case when v_ok then '{name}: "Ohh, that makes sense! I will remember that."'
 else '{name}: "Hmm, okay. I will try it your way. Let''s check this one again soon."' end),
 'feedback', story_fill(uid, q.options -> v_orig ->> 'fb'),
 'right_text', story_fill(uid, q.options -> q.correct_index ->> 'text'),
 'explanation', story_fill(uid, q.options -> q.correct_index ->> 'fb'),
 'returns', (not v_ok and lq.attempt < 3));
end $$;

do $$
declare r record;
begin
 for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('yungsta_schedule','yungsta_current','yungsta_answer','yungsta_neglect_check','yungsta_mark_guided','yungsta_status','yungsta_blunders_new','yungsta_debrief','yungsta_blunders_skip','yungsta_pause','sim_cfg')
 loop
 execute format('revoke all on function %s from public, anon', r.sig);
 if r.proname in ('yungsta_answer','yungsta_debrief','yungsta_blunders_skip','yungsta_pause') then
 execute format('grant execute on function %s to authenticated', r.sig);
 end if;
 end loop;
end $$;
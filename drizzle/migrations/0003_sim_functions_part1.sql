create or replace function adjust_cash_balance(p_profile_id uuid, p_delta numeric(14,2), p_reason text, p_related_table text default null, p_related_id bigint default null)
returns numeric(14,2) language plpgsql security definer set search_path = public as $$
declare v_new_balance numeric(14,2);
begin
 if p_delta = 0 then
 select cash_balance into v_new_balance from sim_profiles where id = p_profile_id;
 return v_new_balance;
 end if;
 insert into cash_ledger (profile_id, amount, reason, related_table, related_id)
 values (p_profile_id, p_delta, p_reason, p_related_table, p_related_id);
 update sim_profiles set cash_balance = cash_balance + p_delta where id = p_profile_id returning cash_balance into v_new_balance;
 return v_new_balance;
end;
$$;
create or replace function adjust_reputation_score(p_profile_id uuid, p_delta numeric(6,2), p_reason text)
returns numeric(6,2) language plpgsql security definer set search_path = public as $$
declare v_new_score numeric(6,2);
begin
 if p_delta = 0 then
 select reputation_score into v_new_score from sim_profiles where id = p_profile_id;
 return v_new_score;
 end if;
 insert into reputation_events (profile_id, delta, reason) values (p_profile_id, p_delta, p_reason);
 update sim_profiles set reputation_score = greatest(0, least(100, reputation_score + p_delta)) where id = p_profile_id returning reputation_score into v_new_score;
 return v_new_score;
end;
$$;
revoke execute on function adjust_cash_balance from public, authenticated;
revoke execute on function adjust_reputation_score from public, authenticated;
grant execute on function adjust_cash_balance to service_role;
grant execute on function adjust_reputation_score to service_role;
create or replace function story_game_months_to_days(m numeric)
returns numeric language sql stable as $$
 select m / 12.0 * coalesce((select value::numeric from sim_config where key = 'real_days_per_game_year'), 14)
$$;
create or replace function story_has_flag(p uuid, f text)
returns boolean language sql stable security definer set search_path = public as $$
 select exists (select 1 from learner_flags where profile_id = p and flag_key = f)
$$;
create or replace function story_venture_insured(p uuid, ctx jsonb)
returns boolean language sql stable security definer set search_path = public as $$
 select coalesce((select insured_until > now() from ventures where id = (ctx->>'venture_id')::bigint and profile_id = p), false)
$$;
create or replace function story_fill(p uuid, t text, ctx jsonb default null)
returns text language sql stable security definer set search_path = public as $$
 select replace(replace(replace(replace(coalesce(t, ''),
 '{name}',     coalesce((select nullif(character_name, '') from sim_profiles where id = p), 'your yungsta')),
 '{mentor}',   coalesce((select nullif(display_name, '') from sim_profiles where id = p), 'you')),
 '{venture}',  coalesce(ctx->>'venture_name', 'the business')),
 '{retained}', coalesce(ctx->>'retained_text', 'some profit'))
$$;
create or replace function story_flag_any(p uuid, j jsonb)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
 if j is null or jsonb_typeof(j) = 'null' then return false; end if;
 if jsonb_typeof(j) = 'string' then return story_has_flag(p, j #>> '{}'); end if;
 return exists (select 1 from jsonb_array_elements_text(j) f where story_has_flag(p, f));
end $$;
create or replace function story_set_flag(p uuid, f text, ev bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
 if f is null or f = '' then return; end if;
 insert into learner_flags (profile_id, flag_key, set_by_event_id) values (p, f, ev);
end $$;
create or replace function story_feature_open(p uuid, f text)
returns boolean language sql stable security definer set search_path = public as $$
 select coalesce((select unlocked_at is not null from learner_feature_unlocks where profile_id = p and feature_key = f), false)
$$;
create or replace function story_days_since_signup(p uuid)
returns numeric language sql stable security definer set search_path = public as $$
 select coalesce(extract(epoch from (now() - created_at)) / 86400.0, 0) from sim_profiles where id = p
$$;
create or replace function story_eligible(p uuid, e story_events)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare c jsonb := e.eligibility_config;
begin
 if c ? 'requires_feature_unlocked' and not story_feature_open(p, c->>'requires_feature_unlocked') then return false; end if;
 if c ? 'requires_flag' and not story_flag_any(p, c->'requires_flag') then return false; end if;
 if c ? 'excludes_flag' and story_flag_any(p, c->'excludes_flag') then return false; end if;
 if c ? 'min_days_since_signup' and story_days_since_signup(p) < (c->>'min_days_since_signup')::numeric then return false; end if;
 if c ? 'requires_active_venture' and not exists (select 1 from ventures where profile_id = p and status = 'active') then return false; end if;
 return true;
end $$;
create or replace function story_trigger_met(p uuid, e story_events)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare c jsonb := e.trigger_config; v numeric;
begin
 if e.trigger_type = 'day_fallback' then
 return story_days_since_signup(p) >= (c->>'min_days_since_signup')::numeric;
 elsif e.trigger_type = 'threshold' then
 select case c->>'field' when 'cash_balance' then cash_balance when 'reputation_score' then reputation_score end into v from sim_profiles where id = p;
 if v is null then return false; end if;
 return case c->>'op'
 when '<'  then v <  (c->>'value')::numeric
 when '<=' then v <= (c->>'value')::numeric
 when '>'  then v >  (c->>'value')::numeric
 when '>=' then v >= (c->>'value')::numeric
 else false end;
 elsif e.trigger_type = 'action' then
 if c->>'action' = 'venture_first_activity' then
 return exists (select 1 from ventures where profile_id = p);
 end if;
 return false;
 elsif e.trigger_type = 'flag' then
 return story_flag_any(p, c->'flag');
 end if;
 return false;
end $$;
drop function if exists story_visible_choices(uuid, jsonb);
create or replace function story_visible_choices(p uuid, choices jsonb, ctx jsonb default null)
returns jsonb language sql stable security definer set search_path = public as $$
 select coalesce(jsonb_agg(jsonb_build_object('index', t.ord - 1, 'label', story_fill(p, t.c->>'label', ctx)) order by t.ord), '[]'::jsonb)
 from jsonb_array_elements(choices) with ordinality as t(c, ord)
 where ((t.c->'requires_flag') is null or story_flag_any(p, t.c->'requires_flag'))
 and ((t.c->'requires_insured') is null or story_venture_insured(p, ctx))
$$;
create or replace function story_run_unlocks(p uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare e story_events; got text[] := '{}';
begin
 for e in select * from story_events where category = 'unlock' and is_active and unlocks_feature is not null order by id loop
 if story_feature_open(p, e.unlocks_feature) then continue; end if;
 if story_eligible(p, e) and story_trigger_met(p, e) then
 update learner_feature_unlocks set unlocked_at = now(), unlocked_via_event_id = e.id
 where profile_id = p and feature_key = e.unlocks_feature and unlocked_at is null;
 if found then
 got := got || e.unlocks_feature;
 perform story_set_flag(p, 'unlocked_' || e.unlocks_feature, e.id);
 insert into learner_event_log (profile_id, event_id, note) values (p, e.id, 'unlocked ' || e.unlocks_feature);
 end if;
 end if;
 end loop;
 return got;
end $$;
drop function if exists story_schedule_followups(uuid, text[]);
create or replace function story_schedule_followups(p uuid, new_flags text[], ctx jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare e story_events; af jsonb; v_days numeric;
begin
 if new_flags is null or array_length(new_flags, 1) is null then return; end if;
 for e in select * from story_events where trigger_type = 'flag_delay' and is_active order by id loop
 af := e.trigger_config->'after_flag';
 if af is null then continue; end if;
 if jsonb_typeof(af) = 'string' then af := jsonb_build_array(af); end if;
 if not exists (select 1 from jsonb_array_elements_text(af) f where f = any (new_flags)) then continue; end if;
 if not e.repeatable and exists (select 1 from learner_pending_events where profile_id = p and event_id = e.id) then continue; end if;
 if not story_eligible(p, e) then continue; end if;
 v_days := coalesce((e.trigger_config->>'delay_real_days')::numeric, story_game_months_to_days((e.trigger_config->>'delay_game_months')::numeric), 0);
 insert into learner_pending_events (profile_id, event_id, node_key, available_at, context)
 values (p, e.id, e.entry_node, now() + (v_days * interval '1 day'), ctx);
 end loop;
end $$;
create or replace function story_daily_roll(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e story_events;
begin
 insert into learner_daily_check (profile_id, check_date, rolled) values (p, current_date, true) on conflict do nothing;
 if not found then return; end if;
 if exists (select 1 from learner_pending_events where profile_id = p and status = 'pending') then return; end if;
 select se.* into e from story_events se
 where se.category = 'ambient' and se.is_active and se.trigger_type = 'dice_roll'
 and (se.repeatable or not exists (select 1 from learner_pending_events lp where lp.profile_id = p and lp.event_id = se.id))
 and story_eligible(p, se)
 order by random() limit 1;
 if e.id is null then return; end if;
 if random() < coalesce((e.trigger_config->>'fire_probability')::numeric, 0.3) then
 insert into learner_pending_events (profile_id, event_id, node_key) values (p, e.id, e.entry_node);
 update learner_daily_check set fired_event_id = e.id where profile_id = p and check_date = current_date;
 end if;
end $$;
create or replace function story_feature_state()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 return jsonb_build_object('ventures', story_feature_open(uid, 'ventures'), 'trade', story_feature_open(uid, 'trade'), 'debts', story_feature_open(uid, 'debts'));
end $$;
create or replace function story_bootstrap()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return; end if;
 insert into sim_profiles (id, display_name) values (uid, 'Learner') on conflict (id) do nothing;
 insert into learner_feature_unlocks (profile_id, feature_key, unlocked_at) values
 (uid, 'ventures', now()), (uid, 'trade', null), (uid, 'debts', null)
 on conflict (profile_id, feature_key) do nothing;
end $$;
create or replace function story_fire_lesson(p_lesson text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m lesson_flag_map; e story_events; v_new int := 0; v_flags text[] := '{}';
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform story_bootstrap();
 insert into learner_lessons (profile_id, lesson_id) values (uid, p_lesson) on conflict do nothing;
 perform yungsta_mark_guided(uid);
 select * into m from lesson_flag_map where lesson_id = p_lesson;
 if found and not story_has_flag(uid, m.flag_key) then
 perform story_set_flag(uid, m.flag_key, null);
 perform adjust_reputation_score(uid, m.reputation_delta, 'lesson_completed:' || p_lesson);
 v_flags := array[m.flag_key];
 end if;
 for e in select * from story_events where category = 'lesson_bridge' and is_active and trigger_type = 'external_signal' and trigger_config->>'lesson_id' = p_lesson order by id loop
 if (e.repeatable or not exists (select 1 from learner_pending_events where profile_id = uid and event_id = e.id)) and story_eligible(uid, e) then
 insert into learner_pending_events (profile_id, event_id, node_key) values (uid, e.id, e.entry_node);
 v_new := v_new + 1;
 end if;
 end loop;
 perform story_schedule_followups(uid, v_flags);
 perform story_run_unlocks(uid);
 return jsonb_build_object('ok', true, 'scenarios', v_new);
end $$;
create or replace function story_pending()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_events jsonb; v_unlocked text[]; v_name text; v_q jsonb := null;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform story_bootstrap();
 select display_name into v_name from sim_profiles where id = uid;
 v_name := coalesce(v_name, 'Learner');
 perform yungsta_neglect_check(uid);
 v_unlocked := story_run_unlocks(uid);
 perform story_daily_roll(uid);
 v_unlocked := v_unlocked || story_run_unlocks(uid);
 select coalesce(jsonb_agg(s.item order by s.created_at), '[]'::jsonb) into v_events
 from (
 select pe.created_at,
 jsonb_build_object(
 'pending_id', pe.id, 'event_key', e.event_key,
 'title', story_fill(uid, e.title, pe.context),
 'character', e.character_key,
 'intro', case when pe.node_key = e.entry_node then story_fill(uid, e.intro, pe.context) else null end,
 'node_key', n.node_key,
 'body', story_fill(uid, n.body, pe.context),
 'choices', story_visible_choices(uid, n.choices, pe.context)) as item
 from learner_pending_events pe
 join story_events e on e.id = pe.event_id
 join story_nodes n on n.event_id = e.id and n.node_key = pe.node_key
 where pe.profile_id = uid and pe.status = 'pending' and pe.available_at <= now()
 ) s;
 if jsonb_array_length(v_events) = 0 then
 perform yungsta_schedule(uid);
 v_q := yungsta_current(uid);
 end if;
 return jsonb_build_object('features', story_feature_state(), 'unlocked', to_jsonb(v_unlocked), 'events', v_events,
 'question', v_q, 'avatar', (select avatar from sim_profiles where id = uid),
 'blunders', yungsta_blunders_new(uid), 'neglect', yungsta_status(uid),
 'yungsta', story_fill(uid, '{name}'), 'mentor', story_fill(uid, '{mentor}'));
end $$;
create or replace function story_choose(p_pending_id bigint, p_choice_index int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid();
 pe learner_pending_events; ev story_events; nd story_nodes; ch jsonb;
 v_cash numeric; v_amt numeric; v_debt debts; v_debt_id bigint;
 v_flags text[] := '{}'; v_cd numeric := 0; v_rd numeric := 0;
 v_unlocked text[] := '{}'; v_flag text; v_name text; v_capital numeric;
 v_biz numeric := 0; v_ret numeric := 0; v_cashpart numeric := 0; v_w numeric := 0; v_r numeric := 0;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into pe from learner_pending_events where id = p_pending_id and profile_id = uid and status = 'pending' and available_at <= now() for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 select * into ev from story_events where id = pe.event_id;
 select * into nd from story_nodes where event_id = ev.id and node_key = pe.node_key;
 ch := nd.choices -> p_choice_index;
 if ch is null then return jsonb_build_object('error', 'bad_choice'); end if;
 if ch ? 'requires_flag' and not story_flag_any(uid, ch->'requires_flag') then return jsonb_build_object('error', 'locked_choice'); end if;
 if ch ? 'requires_insured' and not story_venture_insured(uid, pe.context) then return jsonb_build_object('error', 'locked_choice'); end if;
 select cash_balance, display_name into v_cash, v_name from sim_profiles where id = uid;
 v_name := coalesce(v_name, 'Learner');
 v_amt := coalesce((ch->>'cash_delta')::numeric, 0);
 if ch ? 'cash_pct_capital' and pe.context ? 'capital' then
 v_capital := (pe.context->>'capital')::numeric;
 v_amt := round(v_capital * (ch->>'cash_pct_capital')::numeric, 2);
 end if;
 if pe.context ? 'venture_id' and v_amt <> 0 then
 select retained into v_ret from ventures where id = (pe.context->>'venture_id')::bigint and profile_id = uid for update;
 v_ret := coalesce(v_ret, 0);
 if v_amt > 0 then v_biz := v_amt; else v_biz := -least(-v_amt, v_ret); end if;
 end if;
 v_cashpart := v_amt - v_biz;
 if v_cashpart < 0 and ch ? 'forced' then v_cashpart := greatest(v_cashpart, -v_cash); end if;
 if v_cashpart < 0 and v_cash + v_cashpart < 0 then
 return jsonb_build_object('error', 'insufficient_cash', 'needed', -v_cashpart, 'cash', v_cash);
 end if;
 if ch ? 'repay_tag' then
 select * into v_debt from debts where profile_id = uid and story_tag = ch->>'repay_tag' and status = 'active' order by id desc limit 1;
 if v_debt.id is not null and v_cash < v_debt.outstanding_balance then
 return jsonb_build_object('error', 'insufficient_cash', 'needed', v_debt.outstanding_balance, 'cash', v_cash);
 end if;
 end if;
 if ch ? 'repay_tag' and v_debt.id is not null then
 perform adjust_cash_balance(uid, -v_debt.outstanding_balance, 'debt_repayment', 'debts', v_debt.id);
 v_cd := v_cd - v_debt.outstanding_balance;
 update debts set outstanding_balance = 0, status = 'repaid' where id = v_debt.id;
 end if;
 if ch ? 'fee_tag' then
 update debts set outstanding_balance = outstanding_balance + coalesce((ch->>'fee')::numeric, 0) where profile_id = uid and story_tag = ch->>'fee_tag' and status = 'active';
 end if;
 if ch ? 'loan' then
 insert into debts (profile_id, lender_kind, principal, outstanding_balance, annual_interest_rate, story_tag)
 values (uid, ch #>> '{loan,lender_kind}', (ch #>> '{loan,principal}')::numeric, (ch #>> '{loan,total}')::numeric, (ch #>> '{loan,rate}')::numeric, ch #>> '{loan,tag}')
 returning id into v_debt_id;
 perform adjust_cash_balance(uid, (ch #>> '{loan,principal}')::numeric, 'debt_drawdown', 'debts', v_debt_id);
 v_cd := v_cd + (ch #>> '{loan,principal}')::numeric;
 end if;
 if v_cashpart <> 0 then
 perform adjust_cash_balance(uid, v_cashpart, 'story_event', 'story_events', ev.id);
 v_cd := v_cd + v_cashpart;
 end if;
 if pe.context ? 'venture_id' then
 if v_amt <> 0 then
 insert into venture_events (venture_id, kind, amount, description)
 values ((pe.context->>'venture_id')::bigint, case when v_amt < 0 then 'shock' else 'revenue' end, v_amt, left(coalesce(ch->>'venture_note', ch->>'label'), 200));
 end if;
 if v_biz <> 0 then
 update ventures set retained = retained + v_biz where id = (pe.context->>'venture_id')::bigint and profile_id = uid;
 end if;
 if ch ? 'venture_mult' then
 update ventures set income_mult = (ch #>> '{venture_mult,mult}')::numeric,
 income_mult_until = now() + ((ch #>> '{venture_mult,days}')::numeric * interval '1 day')
 where id = (pe.context->>'venture_id')::bigint and profile_id = uid;
 end if;
 if ch ? 'venture_guard_days' then
 update ventures set shock_guard_until = now() + ((ch->>'venture_guard_days')::numeric * interval '1 day')
 where id = (pe.context->>'venture_id')::bigint and profile_id = uid;
 end if;
 if ch ? 'retained_withdraw_pct' or ch ? 'retained_reinvest_pct' then
 select retained into v_ret from ventures where id = (pe.context->>'venture_id')::bigint and profile_id = uid for update;
 v_w := round(coalesce(v_ret, 0) * coalesce((ch->>'retained_withdraw_pct')::numeric, 0), 2);
 v_r := round(coalesce(v_ret, 0) * coalesce((ch->>'retained_reinvest_pct')::numeric, 0), 2);
 update ventures set retained = retained - v_w - v_r, capital = coalesce(capital, starting_capital) + v_r
 where id = (pe.context->>'venture_id')::bigint and profile_id = uid;
 if v_w > 0 then
 perform adjust_cash_balance(uid, v_w, 'venture_withdrawal', 'ventures', (pe.context->>'venture_id')::bigint);
 v_cd := v_cd + v_w;
 insert into venture_events (venture_id, kind, amount, description) values ((pe.context->>'venture_id')::bigint, 'withdrawal', -v_w, 'Profit taken home');
 end if;
 if v_r > 0 then
 insert into venture_events (venture_id, kind, amount, description) values ((pe.context->>'venture_id')::bigint, 'reinvest', -v_r, 'Profit reinvested in the business');
 end if;
 end if;
 end if;
 v_rd := coalesce((ch->>'reputation_delta')::numeric, 0);
 if v_rd <> 0 then perform adjust_reputation_score(uid, v_rd, 'story: ' || ev.event_key); end if;
 v_flag := ch->>'sets_flag';
 if v_flag is not null and v_flag <> '' then
 perform story_set_flag(uid, v_flag, ev.id);
 v_flags := array[v_flag];
 end if;
 insert into learner_event_log (profile_id, event_id, node_key, choice_index, cash_delta, reputation_delta, flag_set)
 values (uid, ev.id, nd.node_key, p_choice_index, v_cd, v_rd, v_flag);
 select cash_balance into v_cash from sim_profiles where id = uid;
 if ch ? 'next_node' then
 update learner_pending_events set node_key = ch->>'next_node' where id = pe.id;
 select * into nd from story_nodes where event_id = ev.id and node_key = ch->>'next_node';
 return jsonb_build_object('done', false, 'narrative', story_fill(uid, ch->>'narrative', pe.context), 'cash', v_cash,
 'node', jsonb_build_object('node_key', nd.node_key, 'body', story_fill(uid, nd.body, pe.context), 'choices', story_visible_choices(uid, nd.choices, pe.context)));
 end if;
 update learner_pending_events set status = 'done', resolved_at = now() where id = pe.id;
 perform yungsta_mark_guided(uid);
 perform story_schedule_followups(uid, v_flags, pe.context);
 v_unlocked := story_run_unlocks(uid);
 return jsonb_build_object('done', true, 'narrative', story_fill(uid, ch->>'narrative', pe.context), 'cash', v_cash,
 'cash_delta', v_cd, 'business_delta', v_biz, 'reputation_delta', v_rd, 'unlocked', to_jsonb(v_unlocked));
end $$;
create or replace function story_lender_ceiling(p uuid, p_kind text)
returns numeric language sql stable security definer set search_path = public as $$
 select coalesce(max(r.ceiling), 0) from lender_limit_rules r
 where r.lender_kind = p_kind
 and (r.requires_flag is null or story_has_flag(p, r.requires_flag))
 and (r.excludes_flag is null or not story_has_flag(p, r.excludes_flag))
 and story_days_since_signup(p) >= r.min_days_since_signup
$$;
create or replace function story_borrow_limits()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); k text; v_out jsonb := '{}'::jsonb; used numeric;
begin
 foreach k in array array['bank', 'microfinance', 'informal'] loop
 select coalesce(sum(outstanding_balance), 0) into used from debts where profile_id = uid and lender_kind = k and status = 'active';
 v_out := v_out || jsonb_build_object(k, greatest(0, story_lender_ceiling(uid, k) - used));
 end loop;
 return v_out;
end $$;
create or replace function story_borrow(p_kind text, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_left numeric; v_rate numeric; v_id bigint; v_used numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
 v_rate := case p_kind when 'bank' then 28 when 'microfinance' then 180 when 'informal' then 0 else null end;
 if v_rate is null then return jsonb_build_object('error', 'bad_lender'); end if;
 if not story_feature_open(uid, 'debts') then return jsonb_build_object('error', 'locked'); end if;
 select coalesce(sum(outstanding_balance), 0) into v_used from debts where profile_id = uid and lender_kind = p_kind and status = 'active';
 v_left := greatest(0, story_lender_ceiling(uid, p_kind) - v_used);
 if p_amount > v_left then return jsonb_build_object('error', 'over_limit', 'limit', v_left); end if;
 insert into debts (profile_id, lender_kind, principal, outstanding_balance, annual_interest_rate) values (uid, p_kind, p_amount, p_amount, v_rate) returning id into v_id;
 perform adjust_cash_balance(uid, p_amount, 'debt_drawdown', 'debts', v_id);
 return jsonb_build_object('ok', true, 'debt_id', v_id);
end $$;
do $$
declare r record;
begin
 for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname like 'story\_%'
 loop
 execute format('revoke all on function %s from public, anon', r.sig);
 if r.proname in ('story_bootstrap', 'story_fire_lesson', 'story_pending', 'story_choose', 'story_borrow', 'story_borrow_limits', 'story_feature_state') then
 execute format('grant execute on function %s to authenticated', r.sig);
 end if;
 end loop;
end $$;
create or replace function sim_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
 insert into public.sim_profiles (id, display_name)
 values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Learner'))
 on conflict (id) do nothing;
 insert into public.learner_feature_unlocks (profile_id, feature_key, unlocked_at) values
 (new.id, 'ventures', now()), (new.id, 'trade', null), (new.id, 'debts', null)
 on conflict (profile_id, feature_key) do nothing;
 return new;
end $$;
revoke all on function sim_handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_sim on auth.users;
create trigger on_auth_user_created_sim after insert on auth.users for each row execute function sim_handle_new_user();
drop function if exists set_character(text, text, text);
create or replace function set_character(p_name text, p_avatar text, p_backstory text, p_relationship text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); v_name text := trim(coalesce(p_name, ''));
 avatars text[] := array['🧒🏾','👦🏾','👧🏾','🧑🏾','👩🏾','👨🏾','🧕🏾','👷🏾','👩🏾‍🌾','👨🏾‍🌾','🧑🏾‍💻','🧑🏾‍🔧'];
 stories text[] := array['student','trader','salaried','farmer'];
 rels text[] := array['younger_brother','younger_sister','son','daughter','apprentice'];
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform story_bootstrap();
 if char_length(v_name) < 2 or char_length(v_name) > 24 then return jsonb_build_object('error', 'bad_name'); end if;
 if not (p_avatar = any (avatars)) then return jsonb_build_object('error', 'bad_avatar'); end if;
 if not (p_backstory = any (stories)) then return jsonb_build_object('error', 'bad_backstory'); end if;
 if not (p_relationship = any (rels)) then return jsonb_build_object('error', 'bad_relationship'); end if;
 update sim_profiles set character_name = v_name, avatar = p_avatar, backstory = p_backstory, relationship = p_relationship where id = uid;
 delete from learner_flags where profile_id = uid and flag_key like 'bg\_%';
 perform story_set_flag(uid, 'bg_' || p_backstory, null);
 return jsonb_build_object('ok', true);
end $$;
create or replace function sim_trade(p_instrument_id bigint, p_side text, p_qty numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ins instruments; v_cash numeric; v_total numeric; h holdings; v_trade_id bigint; v_new_qty numeric; v_avg numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if not story_feature_open(uid, 'trade') then return jsonb_build_object('error', 'locked'); end if;
 if p_side not in ('buy', 'sell') then return jsonb_build_object('error', 'bad_side'); end if;
 if p_qty is null or p_qty <= 0 or p_qty > 1000000 then return jsonb_build_object('error', 'bad_quantity'); end if;
 select * into ins from instruments where id = p_instrument_id and is_active;
 if not found then return jsonb_build_object('error', 'bad_instrument'); end if;
 v_total := round(p_qty * ins.current_price, 2);
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 select * into h from holdings where profile_id = uid and instrument_id = ins.id;
 if p_side = 'buy' then
 if v_total > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash); end if;
 else
 if h.id is null or h.quantity < p_qty then return jsonb_build_object('error', 'insufficient_holding', 'held', coalesce(h.quantity, 0)); end if;
 end if;
 insert into trades (profile_id, instrument_id, side, quantity, price_at_trade, total_value)
 values (uid, ins.id, p_side, p_qty, ins.current_price, v_total) returning id into v_trade_id;
 perform adjust_cash_balance(uid, case when p_side = 'buy' then -v_total else v_total end, case when p_side = 'buy' then 'trade_buy' else 'trade_sell' end, 'trades', v_trade_id);
 if p_side = 'buy' then
 v_new_qty := coalesce(h.quantity, 0) + p_qty;
 v_avg := (coalesce(h.quantity, 0) * coalesce(h.avg_buy_price, 0) + p_qty * ins.current_price) / v_new_qty;
 else
 v_new_qty := h.quantity - p_qty;
 v_avg := h.avg_buy_price;
 end if;
 insert into holdings (profile_id, instrument_id, quantity, avg_buy_price) values (uid, ins.id, v_new_qty, v_avg)
 on conflict (profile_id, instrument_id) do update set quantity = excluded.quantity, avg_buy_price = excluded.avg_buy_price;
 return jsonb_build_object('ok', true, 'total', v_total, 'cash', (select cash_balance from sim_profiles where id = uid));
end $$;
create or replace function sim_create_venture(p_name text, p_category text, p_capital numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_cash numeric; v_id bigint; v_name text := trim(coalesce(p_name, ''));
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if char_length(v_name) < 1 or char_length(v_name) > 60 then return jsonb_build_object('error', 'bad_name'); end if;
 if p_category is null or char_length(p_category) > 30 then return jsonb_build_object('error', 'bad_category'); end if;
 if p_capital is null or p_capital <= 0 or p_capital > 1000000 then return jsonb_build_object('error', 'bad_amount'); end if;
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 if p_capital > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash); end if;
 insert into ventures (profile_id, name, category, starting_capital, capital) values (uid, v_name, p_category, round(p_capital, 2), round(p_capital, 2)) returning id into v_id;
 perform adjust_cash_balance(uid, -round(p_capital, 2), 'venture_cost', 'ventures', v_id);
 if not story_has_flag(uid, 'started_venture') then perform story_set_flag(uid, 'started_venture', null); end if;
 return jsonb_build_object('ok', true, 'venture_id', v_id);
end $$;
create or replace function sim_log_venture_event(p_venture_id bigint, p_kind text, p_amount numeric, p_desc text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v ventures; v_cash numeric; v_amt numeric := round(coalesce(p_amount, 0), 2);
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_kind <> 'expense' then return jsonb_build_object('error', 'revenue_is_automatic'); end if;
 if v_amt <= 0 or v_amt > 1000000 then return jsonb_build_object('error', 'bad_amount'); end if;
 select * into v from ventures where id = p_venture_id and profile_id = uid and status = 'active';
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 if v_amt > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash); end if;
 insert into venture_events (venture_id, kind, amount, description) values (v.id, 'expense', -v_amt, left(nullif(trim(p_desc), ''), 200));
 perform adjust_cash_balance(uid, -v_amt, 'venture_cost', 'ventures', v.id);
 return jsonb_build_object('ok', true);
end $$;
create or replace function sim_repay(p_debt_id bigint, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d debts; v_cash numeric; v_amt numeric; e story_events; v_rep numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into d from debts where id = p_debt_id and profile_id = uid and status = 'active' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 v_amt := least(round(coalesce(p_amount, 0), 2), d.outstanding_balance);
 if v_amt <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
 if v_amt > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash); end if;
 perform adjust_cash_balance(uid, -v_amt, 'debt_repayment', 'debts', d.id);
 update debts set outstanding_balance = outstanding_balance - v_amt, status = case when outstanding_balance - v_amt <= 0 then 'repaid' else 'active' end where id = d.id;
 if d.outstanding_balance - v_amt <= 0 and d.story_tag is not null then
 for e in select * from story_events where trigger_config->>'cancel_on_repay_tag' = d.story_tag loop
 update learner_pending_events set status = 'done', resolved_at = now() where profile_id = uid and event_id = e.id and status = 'pending';
 if (e.trigger_config->>'repay_flag') is not null then perform story_set_flag(uid, e.trigger_config->>'repay_flag', e.id); end if;
 v_rep := coalesce((e.trigger_config->>'repay_reputation')::numeric, 0);
 if v_rep <> 0 then perform adjust_reputation_score(uid, v_rep, 'repaid early: ' || d.story_tag); end if;
 end loop;
 end if;
 return jsonb_build_object('ok', true, 'paid', v_amt);
end $$;
do $$
declare r record;
begin
 for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('set_character', 'sim_trade', 'sim_create_venture', 'sim_log_venture_event', 'sim_repay')
 loop
 execute format('revoke all on function %s from public, anon', r.sig);
 execute format('grant execute on function %s to authenticated', r.sig);
 end loop;
end $$;
create or replace function sim_collect_income()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid();
 v ventures; r venture_category_rates; e story_events; v_pay bigint;
 v_dpm numeric; v_elapsed numeric; v_days int; i int; v_f numeric; v_start timestamptz;
 v_cap numeric; v_eff numeric; v_rev numeric; v_cost numeric; v_newret numeric; v_hit boolean;
 t_rev numeric := 0; t_cost numeric := 0; t_days int := 0; t_events int := 0;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 v_dpm := story_game_months_to_days(1);
 select id into v_pay from story_events where event_key = 'venture_profit_decision' and is_active;
 for v in select * from ventures where profile_id = uid and status = 'active' for update loop
 v_elapsed := extract(epoch from (now() - v.last_income_at)) / 86400.0;
 v_days := least(30, floor(v_elapsed)::int);
 if v_days < 1 then continue; end if;
 select * into r from venture_category_rates where category = v.category;
 if not found then select * into r from venture_category_rates where category = 'other'; end if;
 v_cap := coalesce(v.capital, v.starting_capital);
 v_eff := case when v_cap <= 2 * v.starting_capital then v_cap else 2 * v.starting_capital + 0.5 * (v_cap - 2 * v.starting_capital) end;
 v_rev := 0; v_hit := false;
 for i in 1..v_days loop
 v_start := v.last_income_at + ((i - 1) * interval '1 day');
 v_f := 1 + (random() * 2 - 1) * r.volatility;
 if v.income_mult_until is not null and v_start < v.income_mult_until then v_f := v_f * v.income_mult; end if;
 v_rev := v_rev + v_eff * r.monthly_revenue_rate / v_dpm * v_f;
 if random() < 0.06 * (case when v.shock_guard_until is not null and v_start < v.shock_guard_until then 0.3 else 1 end) then v_hit := true; end if;
 end loop;
 v_rev := round(v_rev, 2);
 v_cost := round(v_rev * r.cost_ratio, 2);
 v_newret := v.retained + v_rev - v_cost;
 if v_rev > 0 then
 insert into venture_events (venture_id, kind, amount, description) values (v.id, 'revenue', v_rev, 'Sales over ' || v_days || (case when v_days = 1 then ' day' else ' days' end));
 end if;
 if v_cost > 0 then
 insert into venture_events (venture_id, kind, amount, description) values (v.id, 'expense', -v_cost, 'Running costs (stock, transport, wages)');
 end if;
 if v_hit and not exists (
 select 1 from learner_pending_events pe join story_events se on se.id = pe.event_id
 where pe.profile_id = uid and pe.status = 'pending' and se.category = 'venture_event' and (pe.context->>'venture_id')::bigint = v.id) then
 select se.* into e from story_events se
 where se.category = 'venture_event' and se.is_active
 and (se.eligibility_config->'venture_categories' is null or se.eligibility_config->'venture_categories' ? v.category)
 order by random() limit 1;
 if e.id is not null then
 insert into learner_pending_events (profile_id, event_id, node_key, context)
 values (uid, e.id, e.entry_node, jsonb_build_object('venture_id', v.id, 'venture_name', v.name, 'capital', v_cap));
 t_events := t_events + 1;
 end if;
 end if;
 if v_pay is not null and v_newret >= v_cap * 0.15 and not exists (
 select 1 from learner_pending_events pe
 where pe.profile_id = uid and pe.event_id = v_pay and (pe.context->>'venture_id')::bigint = v.id
 and (pe.status = 'pending' or pe.resolved_at > now() - interval '2 days')) then
 insert into learner_pending_events (profile_id, event_id, node_key, context)
 select uid, se.id, se.entry_node, jsonb_build_object('venture_id', v.id, 'venture_name', v.name, 'capital', v_cap, 'retained_text', 'K' || to_char(round(v_newret), 'FM999,999,990'))
 from story_events se where se.id = v_pay;
 t_events := t_events + 1;
 end if;
 update ventures set retained = v_newret,
 last_income_at = case when v_elapsed > 30 then now() else last_income_at + (v_days * interval '1 day') end
 where id = v.id;
 t_rev := t_rev + v_rev; t_cost := t_cost + v_cost; t_days := greatest(t_days, v_days);
 end loop;
 return jsonb_build_object('revenue', t_rev, 'costs', t_cost, 'shocks', 0, 'net', t_rev - t_cost, 'days', t_days, 'events', t_events);
end $$;
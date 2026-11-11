alter table ventures add column if not exists last_income_at timestamptz not null default now();
create table if not exists venture_category_rates (
 category text primary key,
 monthly_revenue_rate numeric(6,4) not null,  
 cost_ratio numeric(6,4) not null,            
 volatility numeric(4,2) not null             
);
revoke insert, update, delete, truncate on venture_category_rates from anon, authenticated;
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
 v_dpm := story_game_months_to_days(1);          -- real days in one game month
 select id into v_pay from story_events where event_key = 'venture_profit_decision' and is_active;
 for v in select * from ventures where profile_id = uid and status = 'active' for update loop
 v_elapsed := extract(epoch from (now() - v.last_income_at)) / 86400.0;
 v_days := least(30, floor(v_elapsed)::int);
 if v_days < 1 then continue; end if;
 select * into r from venture_category_rates where category = v.category;
 if not found then select * into r from venture_category_rates where category = 'other'; end if;
 -- More capital earns more, but with diminishing returns beyond double the original
 -- (a business also needs people, customers and time, not just money).
 v_cap := coalesce(v.capital, v.starting_capital);
 v_eff := case when v_cap <= 2 * v.starting_capital then v_cap
 else 2 * v.starting_capital + 0.5 * (v_cap - 2 * v.starting_capital) end;
 v_rev := 0; v_hit := false;
 for i in 1..v_days loop
 v_start := v.last_income_at + ((i - 1) * interval '1 day');
 v_f := 1 + (random() * 2 - 1) * r.volatility;
 if v.income_mult_until is not null and v_start < v.income_mult_until then v_f := v_f * v.income_mult; end if;
 v_rev := v_rev + v_eff * r.monthly_revenue_rate / v_dpm * v_f;
 -- 6% chance a day brings a problem or an opportunity; a guard (lock, cooling) cuts it by 70%
 if random() < 0.06 * (case when v.shock_guard_until is not null and v_start < v.shock_guard_until then 0.3 else 1 end) then
 v_hit := true;
 end if;
 end loop;
 v_rev := round(v_rev, 2);
 v_cost := round(v_rev * r.cost_ratio, 2);
 v_newret := v.retained + v_rev - v_cost;
 -- Profit stays INSIDE the business until the learner decides what to do with it.
 if v_rev > 0 then
 insert into venture_events (venture_id, kind, amount, description)
 values (v.id, 'revenue', v_rev, 'Sales over ' || v_days || (case when v_days = 1 then ' day' else ' days' end));
 end if;
 if v_cost > 0 then
 insert into venture_events (venture_id, kind, amount, description)
 values (v.id, 'expense', -v_cost, 'Running costs (stock, transport, wages)');
 end if;
 -- A problem or opportunity becomes a decision (not an automatic loss)
 if v_hit and not exists (
 select 1 from learner_pending_events pe join story_events se on se.id = pe.event_id
 where pe.profile_id = uid and pe.status = 'pending' and se.category = 'venture_event'
 and (pe.context->>'venture_id')::bigint = v.id) then
 select se.* into e from story_events se
 where se.category = 'venture_event' and se.is_active
 and (se.eligibility_config->'venture_categories' is null
 or se.eligibility_config->'venture_categories' ? v.category)
 order by random() limit 1;
 if e.id is not null then
 insert into learner_pending_events (profile_id, event_id, node_key, context)
 values (uid, e.id, e.entry_node,
 jsonb_build_object('venture_id', v.id, 'venture_name', v.name, 'capital', v_cap));
 t_events := t_events + 1;
 end if;
 end if;
 -- When enough profit has piled up, ask what to do with it
 if v_pay is not null and v_newret >= v_cap * 0.15 and not exists (
 select 1 from learner_pending_events pe
 where pe.profile_id = uid and pe.event_id = v_pay and (pe.context->>'venture_id')::bigint = v.id
 and (pe.status = 'pending' or pe.resolved_at > now() - interval '2 days')) then
 insert into learner_pending_events (profile_id, event_id, node_key, context)
 select uid, se.id, se.entry_node,
 jsonb_build_object('venture_id', v.id, 'venture_name', v.name, 'capital', v_cap,
 'retained_text', 'K' || to_char(round(v_newret), 'FM999,999,990'))
 from story_events se where se.id = v_pay;
 t_events := t_events + 1;
 end if;
 update ventures
 set retained = v_newret,
 last_income_at = case when v_elapsed > 30 then now() else last_income_at + (v_days * interval '1 day') end
 where id = v.id;
 t_rev := t_rev + v_rev; t_cost := t_cost + v_cost; t_days := greatest(t_days, v_days);
 end loop;
 return jsonb_build_object('revenue', t_rev, 'costs', t_cost, 'shocks', 0,
 'net', t_rev - t_cost, 'days', t_days, 'events', t_events);
end $$;
create or replace function sim_venture_payout(p_venture_id bigint, p_withdraw numeric, p_reinvest numeric, p_topup numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); v ventures; v_cash numeric;
 w numeric := round(coalesce(p_withdraw, 0), 2); r numeric := round(coalesce(p_reinvest, 0), 2); t numeric := round(coalesce(p_topup, 0), 2);
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if w < 0 or r < 0 or t < 0 or w + r + t = 0 then return jsonb_build_object('error', 'bad_amount'); end if;
 select * into v from ventures where id = p_venture_id and profile_id = uid and status = 'active' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 if w + r > v.retained then return jsonb_build_object('error', 'not_enough_profit', 'retained', v.retained); end if;
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 if t > v_cash + w then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash + w); end if;
 if w > 0 then perform adjust_cash_balance(uid, w, 'venture_withdrawal', 'ventures', v.id); end if;
 if t > 0 then perform adjust_cash_balance(uid, -t, 'venture_topup', 'ventures', v.id); end if;
 update ventures set retained = retained - w - r, capital = coalesce(capital, starting_capital) + r + t where id = v.id;
 if w > 0 then insert into venture_events (venture_id, kind, amount, description) values (v.id, 'withdrawal', -w, 'Profit taken home'); end if;
 if r > 0 then insert into venture_events (venture_id, kind, amount, description) values (v.id, 'reinvest', -r, 'Profit reinvested in the business'); end if;
 if t > 0 then insert into venture_events (venture_id, kind, amount, description) values (v.id, 'topup', t, 'Extra cash invested'); end if;
 if r > 0 and w = 0 and not story_has_flag(uid, 'reinvested_profits') then perform story_set_flag(uid, 'reinvested_profits', null); end if;
 if w > 0 and r = 0 and not story_has_flag(uid, 'withdrew_profits') then perform story_set_flag(uid, 'withdrew_profits', null); end if;
 if w > 0 and r > 0 and not story_has_flag(uid, 'split_profits') then perform story_set_flag(uid, 'split_profits', null); end if;
 if t > 0 and not story_has_flag(uid, 'invested_own_cash') then perform story_set_flag(uid, 'invested_own_cash', null); end if;
 return jsonb_build_object('ok', true);
end $$;
create or replace function sim_buy_cover(p_venture_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v ventures; v_prem numeric; v_cash numeric; v_days numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into v from ventures where id = p_venture_id and profile_id = uid and status = 'active' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 if v.insured_until is not null and v.insured_until > now() then
 return jsonb_build_object('error', 'already_covered', 'until', v.insured_until);
 end if;
 -- people who know how insurance works shop around: 3% instead of 4% of capital
 v_prem := round(v.starting_capital * (case when story_has_flag(uid, 'learned_insurance_basics') then 0.03 else 0.04 end), 2);
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 if v_prem > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash, 'premium', v_prem); end if;
 v_days := story_game_months_to_days(12);          -- one game year in real days
 insert into venture_events (venture_id, kind, amount, description)
 values (v.id, 'expense', -v_prem, 'Insurance premium (theft and spoilage cover)');
 perform adjust_cash_balance(uid, -v_prem, 'venture_cost', 'ventures', v.id);
 update ventures set insured_until = now() + (v_days * interval '1 day') where id = v.id;
 return jsonb_build_object('ok', true, 'premium', v_prem);
end $$;
revoke all on function sim_collect_income() from public, anon;
grant execute on function sim_collect_income() to authenticated;
revoke all on function sim_venture_payout(bigint, numeric, numeric, numeric) from public, anon;
grant execute on function sim_venture_payout(bigint, numeric, numeric, numeric) to authenticated;
revoke all on function sim_buy_cover(bigint) from public, anon;
grant execute on function sim_buy_cover(bigint) to authenticated;
create table if not exists character_trait_rules (
 flag_key text not null,
 trait text not null check (trait in ('prudence', 'discipline', 'generosity', 'boldness')),
 points int not null,
 note text not null,
 primary key (flag_key, trait)
);
revoke insert, update, delete, truncate on character_trait_rules from anon, authenticated;
create or replace function sim_teachback(p_pending_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_ev bigint; v_log bigint;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select event_id into v_ev from learner_pending_events where id = p_pending_id and profile_id = uid;
 if v_ev is null then return jsonb_build_object('error', 'not_found'); end if;
 select id into v_log from learner_event_log
 where profile_id = uid and event_id = v_ev and choice_index is not null
 order by id desc limit 1;
 if v_log is not null then update learner_event_log set note = 'teachback' where id = v_log and note is null; end if;
 return jsonb_build_object('ok', true);
end $$;
revoke all on function sim_teachback(bigint) from public, anon;
grant execute on function sim_teachback(bigint) to authenticated;
create or replace function sim_character_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
 uid uuid := auth.uid();
 p sim_profiles; v_pru int; v_dis int; v_gen int; v_bol int;
 v_know int; v_total_lessons int; v_decisions int; v_taught int; v_top text; v_low text; v_qa int; v_qc int;
 v_title text; v_blurb text; v_tip text; v_high jsonb; v_moments jsonb;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into p from sim_profiles where id = uid;
 with f as (select distinct flag_key from learner_flags where profile_id = uid),
 t as (select r.trait, sum(r.points) as pts from character_trait_rules r join f on f.flag_key = r.flag_key group by r.trait)
 select
 least(100, greatest(0, 50 + coalesce((select pts from t where trait = 'prudence'), 0)))::int,
 least(100, greatest(0, 50 + coalesce((select pts from t where trait = 'discipline'), 0)))::int,
 least(100, greatest(0, 50 + coalesce((select pts from t where trait = 'generosity'), 0)))::int,
 least(100, greatest(0, 50 + coalesce((select pts from t where trait = 'boldness'), 0)))::int
 into v_pru, v_dis, v_gen, v_bol;
 select count(distinct m.flag_key) into v_know from lesson_flag_map m
 join learner_flags lf on lf.flag_key = m.flag_key and lf.profile_id = uid;
 select count(*) into v_total_lessons from (select distinct flag_key from lesson_flag_map) x;
 select count(*) into v_decisions from learner_event_log where profile_id = uid and choice_index is not null;
 select count(*) into v_taught from learner_event_log where profile_id = uid and note = 'teachback';
 select count(*) filter (where status = 'answered'), count(*) filter (where correct) into v_qa, v_qc
 from learner_questions where profile_id = uid;
 select k into v_top from (values ('prudence', v_pru), ('discipline', v_dis), ('generosity', v_gen), ('boldness', v_bol)) a(k, s)
 order by s desc, k limit 1;
 select k into v_low from (values ('prudence', v_pru), ('discipline', v_dis), ('generosity', v_gen), ('boldness', v_bol)) a(k, s)
 order by s asc, k limit 1;
 if v_decisions < 3 then
 v_title := 'Just getting started';
 v_blurb := '{name}''s story has only just begun. Every piece of advice you give shapes who they become.';
 else
 select title, blurb into v_title, v_blurb from (values
 ('prudence',   'The Careful Planner',  'With your guidance, {name} looks before leaping. Pressure, hype and "limited time" offers do not rush them.'),
 ('discipline', 'The Steady Builder',   '{name} pays what they owe, keeps a buffer and builds step by step, because you taught them to.'),
 ('generosity', 'The Community Pillar', 'People can count on {name}. The challenge now is helping in ways that do not hurt them.'),
 ('boldness',   'The Bold Builder',     '{name} backs themselves and takes chances. Your job is to help turn that courage into sound decisions.')
 ) c(k, title, blurb) where k = v_top;
 end if;
 select tip into v_tip from (values
 ('prudence',   'Coach {name} to slow down before a deal: what does it really cost, and who is asking? Waiting a day is free.'),
 ('discipline', 'Coach {name} to pay debts on time and leave some profit inside the business as a buffer for the next surprise.'),
 ('generosity', 'Helping others builds goodwill. Show {name} how to do it with clear terms so it stays kind to everyone.'),
 ('boldness',   'Growth needs some risk. Encourage {name} to test small first, then scale up what works.')
 ) t(k, tip) where k = v_low;
 select coalesce(jsonb_agg(jsonb_build_object('trait', x.trait, 'points', x.points, 'note', x.note)), '[]'::jsonb) into v_high
 from (select r.trait, r.points, r.note from character_trait_rules r
 join (select distinct flag_key from learner_flags where profile_id = uid) f on f.flag_key = r.flag_key
 order by abs(r.points) desc, r.note limit 6) x;
 select coalesce(jsonb_agg(m.item order by m.created_at desc), '[]'::jsonb) into v_moments
 from (select l.created_at, jsonb_build_object(
 'event', story_fill(uid, coalesce(e.title, e.event_key)),
 'choice', story_fill(uid, n.choices -> l.choice_index ->> 'label'),
 'cash', l.cash_delta, 'reputation', l.reputation_delta, 'taught', (l.note = 'teachback')) as item
 from learner_event_log l
 join story_events e on e.id = l.event_id
 left join story_nodes n on n.event_id = l.event_id and n.node_key = l.node_key
 where l.profile_id = uid and l.choice_index is not null
 order by l.created_at desc limit 8) m;
 return jsonb_build_object(
 'name', coalesce(p.character_name, 'Your yungsta'), 'mentor', p.display_name, 'relationship', p.relationship,
 'avatar', p.avatar, 'backstory', p.backstory, 'reputation', p.reputation_score,
 'archetype', jsonb_build_object('title', v_title, 'blurb', story_fill(uid, v_blurb)),
 'traits', jsonb_build_object('prudence', v_pru, 'discipline', v_dis, 'generosity', v_gen, 'boldness', v_bol),
 'knowledge', jsonb_build_object('done', v_know, 'total', v_total_lessons),
 'decisions', v_decisions, 'taught', v_taught,
 'questions', jsonb_build_object('answered', coalesce(v_qa, 0), 'correct', coalesce(v_qc, 0)), 'growth_trait', v_low, 'growth_tip', story_fill(uid, v_tip),
 'highlights', v_high, 'moments', v_moments);
end $$;
revoke all on function sim_character_summary() from public, anon;
grant execute on function sim_character_summary() to authenticated;
alter table sim_profiles add column if not exists stress numeric(5,2);
alter table sim_profiles add column if not exists stress_updated_at timestamptz;
alter table sim_profiles add column if not exists goal_started_at timestamptz;
alter table sim_profiles add column if not exists goal_baseline numeric(14,2);
alter table sim_profiles add column if not exists goal_cycle int not null default 0;
alter table sim_profiles add column if not exists bankrupt_count int not null default 0;
alter table sim_profiles add column if not exists comeback_at timestamptz;
alter table debts add column if not exists product text;
alter table debts add column if not exists structure text not null default 'flexible';
alter table debts add column if not exists term_months int;
alter table debts add column if not exists installment numeric(14,2);
alter table debts add column if not exists billed_cycles int not null default 0;
alter table debts add column if not exists due_amount numeric(14,2) not null default 0;
alter table debts add column if not exists due_since timestamptz;
alter table debts add column if not exists last_accrual_at timestamptz not null default now();
alter table debts add column if not exists missed_count int not null default 0;
alter table debts add column if not exists rollovers int not null default 0;
create table if not exists stress_flag_effects (
 id bigint generated always as identity primary key,
 flag_key text not null,
 delta numeric(5,2) not null,
 delay_months numeric(5,2) not null default 0,
 fade_months numeric(5,2) not null default 3,
 why text not null,
 pattern_key text
);
alter table stress_flag_effects add column if not exists cancelled_by text[];
create index if not exists stress_flag_effects_flag on stress_flag_effects (flag_key);
create table if not exists sim_goals (
 backstory text primary key,
 title text not null,
 emoji text not null default '🎯',
 amount numeric(14,2) not null,
 game_months numeric(5,2) not null default 6
);
create table if not exists bankruptcies (
 id bigint generated always as identity primary key,
 profile_id uuid not null references sim_profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 turning_points jsonb not null default '[]',
 note text,
 resolved_at timestamptz
);
create index if not exists bankruptcies_lookup on bankruptcies (profile_id, resolved_at);
create table if not exists stress_history (
 profile_id uuid not null references sim_profiles(id) on delete cascade,
 day date not null,
 stress numeric(5,2) not null,          
 stress_sum numeric(10,2) not null,     
 samples int not null default 1,
 primary key (profile_id, day)
);
revoke all on stress_flag_effects from anon, authenticated;
revoke all on sim_goals from anon, authenticated;
revoke insert, update, delete, truncate on bankruptcies from anon, authenticated;
revoke insert, update, delete, truncate on stress_history from anon, authenticated;
create or replace function stress_band(s numeric) returns text
language sql immutable as $$
 select case when round(s) >= 100 then 'bankrupt' when round(s) >= 80 then 'crisis'
 when round(s) >= 60 then 'overloaded' when round(s) >= 40 then 'strained'
 when round(s) >= 20 then 'manageable' else 'calm' end
$$;
create or replace function stress_other_assets(p uuid) returns numeric
language sql stable security definer set search_path = public as $$
 select coalesce((select sum(h.quantity * i.current_price) from holdings h join instruments i on i.id = h.instrument_id
 where h.profile_id = p), 0)
 + coalesce((select sum(coalesce(v.capital, v.starting_capital) + coalesce(v.retained, 0)) from ventures v
 where v.profile_id = p and v.status = 'active'), 0)
 - coalesce((select sum(d.outstanding_balance) from debts d where d.profile_id = p and d.status = 'active'), 0)
$$;
create or replace function stress_compute(p uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
 pr sim_profiles; g sim_goals;
 v_gm numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1);   -- real days per game month
 v_ess numeric; v_cash numeric; v_runway numeric; v_creep int;
 v_months_alive numeric; v_income numeric; v_base numeric;
 v_debt_out numeric; v_burden numeric; v_informal boolean; v_overdue boolean; v_def int; v_dsr numeric;
 v_vent int; v_vent_ins int; v_pend int; v_items int;
 c_cash numeric; c_debt numeric; c_shock numeric; c_load numeric; c_goal numeric := 0;
 w_cash numeric := sim_cfg('stress_w_cash', 0.30); w_debt numeric := sim_cfg('stress_w_debt', 0.25);
 w_shock numeric := sim_cfg('stress_w_shock', 0.20); w_load numeric := sim_cfg('stress_w_load', 0.10);
 w_goal numeric := 0; w_sum numeric;
 v_scar numeric := 0; v_blunders int := 0; v_eff numeric := 0; v_target numeric; v_collapse boolean;
 v_items_json jsonb; v_drivers jsonb; v_changes jsonb := '[]'::jsonb; v_goal jsonb := null;
 v_age numeric; v_fade numeric; v_mult numeric; v_val numeric; v_n int; v_effect_rows jsonb := '[]'::jsonb;
 v_elapsed numeric; v_nw numeric; v_prog numeric; v_exp numeric; v_infl numeric := sim_cfg('stress_infl_per_year', 0.12);
 fe record; d record;
begin
 select * into pr from sim_profiles where id = p;
 if not found then return null; end if;
 select count(*) into v_creep from learner_flags where profile_id = p and flag_key = 'creep_upgrade';
 v_creep := least(3, v_creep);
 v_ess := sim_cfg('stress_ess_' || coalesce(pr.backstory, 'default'), sim_cfg('stress_ess_default', 2000))
 + v_creep * sim_cfg('stress_creep_per_flag', 600);
 v_cash := greatest(coalesce(pr.cash_balance, 0), 0);
 v_runway := v_cash / v_ess;
 c_cash := least(1, greatest(0, (6 - v_runway) / 5.75));                  -- 1 at <=0.25 months, 0 at >=6 months
 -- Income: average of salary and venture income over up to the last 6 game months (never below essentials)
 v_months_alive := greatest(1, least(6, extract(epoch from (now() - pr.created_at)) / 86400.0 / v_gm));
 select coalesce(sum(amount), 0) / v_months_alive into v_income
 from cash_ledger
 where profile_id = p and amount > 0 and reason in ('salary', 'venture_income', 'venture_payout')
 and created_at > now() - make_interval(secs => v_gm * 6 * 86400);
 v_base := greatest(coalesce(v_income, 0), v_ess);
 -- Debt: monthly repayments are approximated as 1/12 of the balance plus a month of interest
 -- Monthly repayments: the scheduled instalment where there is one; a one-payment loan is spread over the
 -- months it has left; story loans and flexible loans use balance/12 plus a month of interest.
 -- "Expensive" means 35% a year or more (payday level in Module 1.2).
 select coalesce(sum(outstanding_balance), 0),
 coalesce(sum(case structure
 when 'installment' then least(coalesce(installment, outstanding_balance), outstanding_balance)
 when 'bullet' then outstanding_balance / greatest(1, coalesce(term_months, 1) * (rollovers + 1) - billed_cycles)
 else outstanding_balance / 12.0 + outstanding_balance * annual_interest_rate / 1200.0 end), 0),
 coalesce(bool_or(annual_interest_rate >= 35), false),
 coalesce(bool_or(due_amount > 0 and due_since is not null and due_since < now() - make_interval(secs => v_gm * sim_cfg('debt_grace_months', 1) * 86400)), false)
 into v_debt_out, v_burden, v_informal, v_overdue
 from debts where profile_id = p and status = 'active';
 select count(*) into v_def from debts where profile_id = p and status = 'defaulted';
 v_dsr := v_burden / v_base;
 c_debt := least(1, greatest(0, (v_dsr - 0.10) / 0.50));
 if v_informal then c_debt := least(1, c_debt * 1.3); end if;
 if v_def > 0 or v_overdue then c_debt := least(1, c_debt + 0.3); end if;
 -- Shock cushion: 3 months of essentials in cash = fully cushioned. Covered businesses soften it.
 c_shock := 1 - least(1, v_runway / 3);
 select count(*), count(*) filter (where insured_until is not null and insured_until > now())
 into v_vent, v_vent_ins from ventures where profile_id = p and status = 'active';
 if v_vent > 0 then c_shock := c_shock * (1 - 0.3 * (v_vent_ins::numeric / v_vent)); end if;
 -- Load: businesses + loans + decisions waiting, beyond about 3 things
 select count(*) into v_pend from learner_pending_events
 where profile_id = p and status = 'pending' and available_at <= now();
 v_items := v_vent + (select count(*) from debts where profile_id = p and status = 'active') + v_pend;
 c_load := least(1, greatest(0, (v_items - 3) / 5.0));
 -- Goal drift: how far behind the learner is on growing what they own (idle cash loses real value)
 select * into g from sim_goals where backstory = coalesce(pr.backstory, '');
 if g.backstory is not null and pr.goal_started_at is not null then
 v_elapsed := extract(epoch from (now() - pr.goal_started_at)) / 86400.0 / v_gm;           -- game months
 v_nw := coalesce(pr.cash_balance, 0) / power(1 + v_infl, v_elapsed / 12.0) + stress_other_assets(p);
 v_prog := (v_nw - pr.goal_baseline) / g.amount;
 v_exp := least(1, v_elapsed / g.game_months);
 c_goal := least(1, greatest(0, v_exp - v_prog));
 w_goal := sim_cfg('stress_w_goal', 0.15);
 v_goal := jsonb_build_object('title', g.title, 'emoji', g.emoji, 'amount', g.amount,
 'progress', round(least(1, greatest(0, v_prog)), 3), 'expected', round(v_exp, 3),
 'months_left', round(greatest(0, g.game_months - v_elapsed), 1), 'cycle', pr.goal_cycle);
 end if;
 -- Scars: costly mistakes while unguided fade over 3 game months; each defaulted loan counts
 for d in select created_at from learner_blunders where profile_id = p
 and created_at > now() - make_interval(secs => v_gm * 3 * 86400) loop
 v_blunders := v_blunders + 1;
 v_scar := v_scar + sim_cfg('stress_scar_blunder', 6) *
 (1 - least(1, extract(epoch from (now() - d.created_at)) / 86400.0 / (v_gm * 3)));
 end loop;
 v_scar := least(30, v_scar + least(2, v_def) * sim_cfg('stress_scar_default', 8));
 -- Effects of decisions: each flag the learner set that has an entry in stress_flag_effects
 for fe in select f.created_at, m.delta, m.delay_months, m.fade_months, m.why, m.pattern_key, m.cancelled_by
 from learner_flags f join stress_flag_effects m on m.flag_key = f.flag_key
 where f.profile_id = p loop
 continue when fe.cancelled_by is not null and exists (
 select 1 from learner_flags f3 where f3.profile_id = p and f3.flag_key = any (fe.cancelled_by) and f3.created_at >= fe.created_at);
 v_age := extract(epoch from (now() - fe.created_at)) / 86400.0 / v_gm;
 continue when v_age < fe.delay_months;
 v_fade := case when fe.fade_months <= 0 then 1 else greatest(0, 1 - (v_age - fe.delay_months) / fe.fade_months) end;
 continue when v_fade <= 0;
 v_mult := 1;
 if fe.pattern_key is not null and fe.delta > 0 then
 select count(*) into v_n from learner_flags f2 join stress_flag_effects m2 on m2.flag_key = f2.flag_key
 where f2.profile_id = p and m2.pattern_key = fe.pattern_key and m2.delta > 0
 and f2.created_at > now() - make_interval(secs => v_gm * 6 * 86400);
 if v_n >= 3 then v_mult := sim_cfg('stress_pattern_mult', 1.5); end if;
 end if;
 v_val := fe.delta * v_fade * v_mult;
 v_eff := v_eff + v_val;
 if abs(v_val) >= 1 then
 v_effect_rows := v_effect_rows || jsonb_build_array(jsonb_build_object('key', 'effect', 'points', round(v_val, 1), 'text', fe.why));
 end if;
 -- "just happened": the effect started within the last 5 minutes
 if (v_age - fe.delay_months) * v_gm * 1440 <= 5 then
 v_changes := v_changes || jsonb_build_array(jsonb_build_object('delta', round(v_val, 1), 'why', fe.why));
 end if;
 end loop;
 v_eff := least(40, greatest(-15, v_eff));
 w_sum := w_cash + w_debt + w_shock + w_load + w_goal;
 v_target := 100 * (w_cash * c_cash + w_debt * c_debt + w_shock * c_shock + w_load * c_load + w_goal * c_goal) / w_sum
 + v_scar + v_eff;
 v_target := least(99, greatest(0, v_target));
 v_collapse := (v_cash < 0.1 * v_ess) and (v_debt_out > 6 * v_base);
 if v_collapse then v_target := 100; end if;
 v_items_json := jsonb_build_array(
 jsonb_build_object('key', 'cash', 'points', round(100 * w_cash * c_cash / w_sum, 1),
 'text', case when v_cash <= 0 then 'No cash left'
 when v_runway < 1 then 'Cash covers about ' || greatest(1, round(v_runway * 4.33)) ||
 case when greatest(1, round(v_runway * 4.33)) = 1 then ' week' else ' weeks' end || ' of costs'
 else 'Cash covers about ' || round(v_runway, 1) || ' months of costs' end),
 jsonb_build_object('key', 'debt', 'points', round(100 * w_debt * c_debt / w_sum, 1),
 'text', case when v_def > 0 then 'A loan was defaulted'
 when v_overdue then 'A loan payment is overdue'
 when v_informal then 'Repayments take about ' || round(v_dsr * 100) || '% of income, mostly from a payday-style lender'
 else 'Repayments take about ' || round(v_dsr * 100) || '% of income' end),
 jsonb_build_object('key', 'shock', 'points', round(100 * w_shock * c_shock / w_sum, 1),
 'text', case when v_runway < 0.5 then 'No cushion for a surprise'
 when v_vent > 0 and v_vent_ins < v_vent then 'A business has no cover against theft or loss'
 else 'Cushion covers ' || round(least(3, v_runway), 1) || ' of 3 months' end),
 jsonb_build_object('key', 'goal', 'points', round(100 * w_goal * c_goal / w_sum, 1),
 'text', case when g.title is null then 'No goal set' else 'The goal "' || g.title || '" is falling behind' end),
 jsonb_build_object('key', 'load', 'points', round(100 * w_load * c_load / w_sum, 1),
 'text', v_items || ' things to keep track of'),
 jsonb_build_object('key', 'scars', 'points', round(v_scar, 1),
 'text', case when v_blunders > 0 then 'Left alone, they made ' || v_blunders || ' costly ' ||
 case when v_blunders = 1 then 'mistake' else 'mistakes' end
 else 'Lingering worry from a past mistake' end),
 jsonb_build_object('key', 'creep', 'points', round(least(10, v_creep * 3.0), 1),
 'text', 'Upgrades have raised the monthly cost of living by about K' || (v_creep * sim_cfg('stress_creep_per_flag', 600))::int));
 v_items_json := v_items_json || v_effect_rows;
 select coalesce(jsonb_agg(x.item), '[]'::jsonb) into v_drivers
 from (select item from jsonb_array_elements(v_items_json) item
 where (item->>'points')::numeric >= 2 order by (item->>'points')::numeric desc limit 3) x;
 return jsonb_build_object(
 'target', round(v_target, 2), 'collapse', v_collapse, 'drivers', v_drivers, 'changes', v_changes, 'goal', v_goal,
 'components', jsonb_build_object('cash', round(c_cash * 100), 'debt', round(c_debt * 100), 'shock', round(c_shock * 100),
 'goal', round(c_goal * 100), 'load', round(c_load * 100), 'scars', round(v_scar), 'effects', round(v_eff)),
 'goal_active', v_goal is not null);
end $$;
create or replace function stress_tick(p uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 pr sim_profiles; g sim_goals; v_c jsonb; v_target numeric; v_old numeric; v_new numeric; v_m numeric;
 v_gm numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1);
 v_elapsed numeric; v_nw numeric; v_open bankruptcies; v_tp jsonb; v_bk jsonb := null; v_comeback boolean;
begin
 select * into pr from sim_profiles where id = p for update;
 if not found then return jsonb_build_object('error', 'no_profile'); end if;
 -- Goal cycle: start the first one, or close a finished one (met or missed) and start the next
 select * into g from sim_goals where backstory = coalesce(pr.backstory, '');
 if g.backstory is not null then
 if pr.goal_started_at is null then
 update sim_profiles set goal_started_at = now(), goal_cycle = 1,
 goal_baseline = coalesce(pr.cash_balance, 0) + stress_other_assets(p) where id = p;
 else
 v_elapsed := extract(epoch from (now() - pr.goal_started_at)) / 86400.0 / v_gm;
 if v_elapsed >= g.game_months then
 v_nw := coalesce(pr.cash_balance, 0) / power(1 + sim_cfg('stress_infl_per_year', 0.12), v_elapsed / 12.0) + stress_other_assets(p);
 perform story_set_flag(p, case when (v_nw - pr.goal_baseline) >= g.amount then 'goal_met' else 'goal_missed' end, null);
 update sim_profiles set goal_started_at = now(), goal_cycle = goal_cycle + 1,
 goal_baseline = coalesce(pr.cash_balance, 0) + stress_other_assets(p) where id = p;
 end if;
 end if;
 select * into pr from sim_profiles where id = p;
 end if;
 if to_regprocedure('debt_tick(uuid)') is not null then perform debt_tick(p); end if;   -- bills and interest first (15-debt-schedules.sql)
 v_c := stress_compute(p);
 v_target := (v_c->>'target')::numeric;
 v_old := pr.stress;
 -- Bankruptcy: open one on collapse, and stay at 100 until the learner restarts
 select * into v_open from bankruptcies where profile_id = p and resolved_at is null order by id desc limit 1;
 if v_open.id is null and (v_c->>'collapse')::boolean then
 select coalesce(jsonb_agg(t.why), '[]'::jsonb) into v_tp from (
 select m.why from learner_flags f join stress_flag_effects m on m.flag_key = f.flag_key
 where f.profile_id = p and m.delta > 0 order by f.created_at desc limit 3) t;
 v_tp := coalesce((select jsonb_agg(x->>'text') from jsonb_array_elements(v_c->'drivers') x), '[]'::jsonb) || v_tp;
 insert into bankruptcies (profile_id, turning_points) values (p, v_tp) returning * into v_open;
 end if;
 if v_open.id is not null then
 v_new := 100;
 v_bk := jsonb_build_object('id', v_open.id, 'turning_points', v_open.turning_points);
 elsif v_old is null then
 v_new := v_target;                                              -- first reading: no easing
 else
 v_m := least(6, greatest(0, extract(epoch from (now() - coalesce(pr.stress_updated_at, now()))) / 86400.0 / v_gm));
 v_new := v_old + least(sim_cfg('stress_up_per_month', 10) * v_m,
 greatest(-sim_cfg('stress_down_per_month', 6) * v_m, v_target - v_old));
 v_new := least(99, greatest(0, v_new));
 end if;
 -- Comeback: calm again at least a game month after a restart
 if pr.bankrupt_count > 0 and pr.comeback_at is null and v_open.id is null and v_new < 40
 and exists (select 1 from bankruptcies where profile_id = p and resolved_at < now() - make_interval(secs => v_gm * 86400)) then
 update sim_profiles set comeback_at = now() where id = p;
 pr.comeback_at := now();
 end if;
 v_comeback := pr.comeback_at is not null;
 update sim_profiles set stress = v_new, stress_updated_at = now() where id = p;
 insert into stress_history (profile_id, day, stress, stress_sum, samples)
 values (p, sim_today(), v_new, v_new, 1)
 on conflict (profile_id, day) do update
 set stress = excluded.stress, stress_sum = stress_history.stress_sum + excluded.stress,
 samples = stress_history.samples + 1;
 return jsonb_build_object(
 'stress', round(v_new), 'band', stress_band(v_new), 'target', round(v_target),
 'drivers', v_c->'drivers', 'changes', v_c->'changes', 'components', v_c->'components', 'goal', v_c->'goal',
 'collapse', (v_c->>'collapse')::boolean, 'bankrupt', v_open.id is not null, 'bankruptcy', v_bk,
 'comeback', v_comeback, 'bankrupt_count', pr.bankrupt_count,
 'name', coalesce(pr.character_name, 'Your yungsta'), 'avatar', pr.avatar);
end $$;
create or replace function stress_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 return stress_tick(uid);
end $$;
revoke all on function stress_compute(uuid) from public, anon, authenticated;
revoke all on function stress_tick(uuid) from public, anon, authenticated;
revoke all on function stress_other_assets(uuid) from public, anon, authenticated;
revoke all on function stress_status() from public, anon;
grant execute on function stress_status() to authenticated;
create or replace function stress_calm_enough(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
 select coalesce((select stress from sim_profiles where id = p), 0) < sim_cfg('stress_overload_at', 60)
$$;
create or replace function story_visible_choices(p uuid, choices jsonb, ctx jsonb default null)
returns jsonb language sql stable security definer set search_path = public as $$
 select coalesce(jsonb_agg(jsonb_build_object('index', t.ord - 1, 'label', story_fill(p, t.c->>'label', ctx)) order by t.ord), '[]'::jsonb)
 from jsonb_array_elements(choices) with ordinality as t(c, ord)
 where ((t.c->'requires_flag') is null or story_flag_any(p, t.c->'requires_flag'))
 and ((t.c->'requires_insured') is null or story_venture_insured(p, ctx))
 and ((t.c->'needs_calm') is null or stress_calm_enough(p))
$$;
create or replace function story_daily_roll(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare e story_events; v_over boolean := not stress_calm_enough(p); v_prob numeric;
begin
 insert into learner_daily_check (profile_id, check_date, rolled)
 values (p, current_date, true) on conflict do nothing;
 if not found then return; end if;
 if exists (select 1 from learner_pending_events where profile_id = p and status = 'pending') then return; end if;
 select se.* into e from story_events se
 where se.category = 'ambient' and se.is_active and se.trigger_type = 'dice_roll'
 and (se.repeatable or not exists (select 1 from learner_pending_events lp where lp.profile_id = p and lp.event_id = se.id))
 and story_eligible(p, se)
 order by (case when v_over and coalesce((se.trigger_config->>'predatory')::boolean, false) then 0 else 1 end), random() limit 1;
 if e.id is null then return; end if;
 v_prob := coalesce((e.trigger_config->>'fire_probability')::numeric, 0.3);
 if v_over and coalesce((e.trigger_config->>'predatory')::boolean, false) then
 v_prob := least(0.9, v_prob * sim_cfg('stress_predatory_boost', 1.8));
 end if;
 if random() < v_prob then
 insert into learner_pending_events (profile_id, event_id, node_key) values (p, e.id, e.entry_node);
 update learner_daily_check set fired_event_id = e.id where profile_id = p and check_date = current_date;
 end if;
end $$;
do $$ begin
 if position('story_choose_core' in pg_get_functiondef('story_choose(bigint,int)'::regprocedure)) = 0 then
 drop function if exists story_choose_core(bigint, int);
 alter function story_choose(bigint, int) rename to story_choose_core;
 end if;
end $$;
create or replace function story_choose(p_pending_id bigint, p_choice_index int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_ch jsonb;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select n.choices -> p_choice_index into v_ch
 from learner_pending_events pe join story_nodes n on n.event_id = pe.event_id and n.node_key = pe.node_key
 where pe.id = p_pending_id and pe.profile_id = uid and pe.status = 'pending';
 if v_ch is not null and (v_ch ? 'needs_calm') and not stress_calm_enough(uid) then
 return jsonb_build_object('error', 'overloaded');
 end if;
 return story_choose_core(p_pending_id, p_choice_index);
end $$;
revoke all on function story_choose_core(bigint, int) from public, anon, authenticated;
revoke all on function story_choose(bigint, int) from public, anon;
grant execute on function story_choose(bigint, int) to authenticated;
create table if not exists lesson_titles (lesson_id text primary key, title text not null);
create table if not exists story_event_lessons (
 event_key text not null, ord int not null default 1, lesson_id text not null references lesson_titles(lesson_id), point text not null,
 primary key (event_key, ord)
);
revoke insert, update, delete, truncate on lesson_titles, story_event_lessons from anon, authenticated;
create or replace function story_lessons_for(k text) returns jsonb language sql stable security definer set search_path = public as $$
 select coalesce(jsonb_agg(jsonb_build_object('lesson_id', l.lesson_id, 'title', t.title, 'point', l.point) order by l.ord), '[]'::jsonb)
 from story_event_lessons l join lesson_titles t on t.lesson_id = l.lesson_id where l.event_key = k
$$;
revoke all on function story_lessons_for(text) from public, anon, authenticated;
create or replace function story_choose(p_pending_id bigint, p_choice_index int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_ch jsonb; v_key text; r jsonb;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select n.choices -> p_choice_index, e.event_key into v_ch, v_key
 from learner_pending_events pe join story_events e on e.id = pe.event_id
 join story_nodes n on n.event_id = pe.event_id and n.node_key = pe.node_key
 where pe.id = p_pending_id and pe.profile_id = uid and pe.status = 'pending';
 if v_ch is not null and (v_ch ? 'needs_calm') and not stress_calm_enough(uid) then
 return jsonb_build_object('error', 'overloaded');
 end if;
 r := story_choose_core(p_pending_id, p_choice_index);
 if v_key is not null and coalesce((r->>'done')::boolean, false) then
 r := r || jsonb_build_object('lessons', story_lessons_for(v_key));
 end if;
 return r;
end $$;
revoke all on function story_choose(bigint, int) from public, anon;
grant execute on function story_choose(bigint, int) to authenticated;
create or replace function yungsta_warning()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); pr sim_profiles; v_first date; v_start date; v_from date; v_today date := sim_today();
 v_hour int := extract(hour from (now() at time zone 'Africa/Lusaka'))::int; v_stage text := 'none';
 v_pct numeric := sim_cfg('neglect_loss_pct', 0.10); v_hours_left numeric;
begin
 if uid is null then return jsonb_build_object('stage', 'none'); end if;
 select * into pr from sim_profiles where id = uid;
 select (min(completed_at) at time zone 'Africa/Lusaka')::date into v_first from learner_lessons where profile_id = uid;
 if v_first is null then return jsonb_build_object('stage', 'none'); end if;      -- hasn't started learning: nothing to miss
 v_start := v_first + sim_cfg('neglect_free_days', 3)::int;
 v_from := greatest(v_start, coalesce(pr.last_guided_on + 1, v_start),
 coalesce(pr.neglect_through + 1, v_start), coalesce(pr.paused_until + 1, v_start));
 if (pr.paused_until is not null and pr.paused_until >= v_today) or pr.last_guided_on = v_today then
 v_stage := 'none';
 elsif v_today >= v_from then
 v_stage := case when v_hour >= sim_cfg('warn_firm_after_hour', 16) then 'firm' else 'soft' end;
 elsif v_from - v_today = 1 then v_stage := 'last_free';
 elsif v_from - v_today = 2 then v_stage := 'soft';
 end if;
 v_hours_left := 24 - extract(hour from (now() at time zone 'Africa/Lusaka')) - extract(minute from (now() at time zone 'Africa/Lusaka')) / 60.0;
 return jsonb_build_object('stage', v_stage, 'loss_pct', v_pct, 'est_loss', round(coalesce(pr.cash_balance, 0) * v_pct),
 'hours_left', round(v_hours_left, 1), 'name', coalesce(pr.character_name, 'Your yungsta'),
 'can_pause', (pr.last_pause_on is null or pr.last_pause_on <= v_today - sim_cfg('pause_cooldown_days', 14)::int),
 'pause_days', sim_cfg('pause_max_days', 3)::int);
end $$;
create or replace function stress_restart(p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_open bankruptcies; v_cash numeric; v_restart numeric := sim_cfg('stress_restart_cash', 3000);
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into v_open from bankruptcies where profile_id = uid and resolved_at is null order by id desc limit 1 for update;
 if v_open.id is null then return jsonb_build_object('error', 'not_bankrupt'); end if;
 select cash_balance into v_cash from sim_profiles where id = uid for update;
 perform adjust_cash_balance(uid, v_restart - coalesce(v_cash, 0), 'bankruptcy_restart', 'bankruptcies', v_open.id);
 update debts set status = 'written_off', outstanding_balance = 0 where profile_id = uid and status in ('active', 'defaulted');
 update ventures set status = 'failed', closed_at = now() where profile_id = uid and status = 'active';
 delete from holdings where profile_id = uid;
 perform adjust_reputation_score(uid, -10, 'bankruptcy');
 update bankruptcies set resolved_at = now(), note = left(coalesce(p_note, ''), 300) where id = v_open.id;
 update sim_profiles set bankrupt_count = bankrupt_count + 1, stress = null, stress_updated_at = null,
 goal_started_at = null, comeback_at = null where id = uid;
 perform story_set_flag(uid, 'bankruptcy_restart', null);
 return jsonb_build_object('ok', true, 'cash', v_restart);
end $$;
create or replace function stress_board()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); v_days int := sim_cfg('stress_board_days', 14)::int;
 v_min_days int := sim_cfg('stress_board_min_days', 3)::int; v_min_ch int := sim_cfg('stress_board_min_choices', 3)::int;
 v_story text; v_chapter int; v_top jsonb; v_me jsonb; v_total int; v_my record; v_days_n int; v_ch_n int;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select backstory into v_story from sim_profiles where id = uid;
 select coalesce(max(substring(lesson_id from '^([0-4])')::int), 0) into v_chapter from learner_lessons where profile_id = uid;
 create temp table if not exists _sb (profile_id uuid, name text, avatar text, avg numeric, comeback boolean, bankrupt boolean) on commit drop;
 truncate _sb;
 insert into _sb
 select p.id, p.character_name, p.avatar, h.avg, p.comeback_at is not null,
 exists (select 1 from bankruptcies b where b.profile_id = p.id and b.resolved_at is null)
 from sim_profiles p
 join (select profile_id, sum(stress_sum) / nullif(sum(samples), 0) as avg, count(*) as n
 from stress_history where day >= sim_today() - v_days group by profile_id) h on h.profile_id = p.id
 where p.backstory is not distinct from v_story
 and coalesce((select max(substring(lesson_id from '^([0-4])')::int) from learner_lessons l where l.profile_id = p.id), 0) = v_chapter
 and h.n >= v_min_days
 and (select count(*) from learner_event_log e where e.profile_id = p.id and e.choice_index is not null
 and e.created_at > now() - make_interval(days => v_days)) >= v_min_ch;
 select count(*) into v_total from _sb;
 select coalesce(jsonb_agg(jsonb_build_object('rank', t.rk, 'name', case when t.bankrupt then null else t.name end,
 'avatar', case when t.bankrupt then null else t.avatar end, 'avg', round(t.avg), 'comeback', t.comeback,
 'bankrupt', t.bankrupt, 'me', t.profile_id = uid) order by t.rk), '[]'::jsonb) into v_top
 from (select s.*, rank() over (order by s.avg, s.profile_id) as rk from _sb s order by s.avg, s.profile_id
 limit sim_cfg('stress_board_top', 10)::int) t;
 select * into v_my from (select s.*, rank() over (order by s.avg, s.profile_id) as rk from _sb s) r where r.profile_id = uid;
 if v_my.profile_id is not null then
 v_me := jsonb_build_object('ranked', true, 'rank', v_my.rk, 'of', v_total, 'avg', round(v_my.avg),
 'calmer_than', case when v_total > 1 then round(100.0 * (select count(*) from _sb where avg > v_my.avg) / (v_total - 1)) else null end);
 else
 select count(*) into v_days_n from stress_history where profile_id = uid and day >= sim_today() - v_days;
 select count(*) into v_ch_n from learner_event_log where profile_id = uid and choice_index is not null
 and created_at > now() - make_interval(days => v_days);
 v_me := jsonb_build_object('ranked', false, 'days', v_days_n, 'need_days', v_min_days, 'choices', v_ch_n, 'need_choices', v_min_ch);
 end if;
 return jsonb_build_object('group', jsonb_build_object('backstory', v_story, 'chapter', v_chapter), 'total', v_total,
 'window_days', v_days, 'top', v_top, 'me', v_me);
end $$;
revoke all on function yungsta_warning() from public, anon;
revoke all on function stress_restart(text) from public, anon;
revoke all on function stress_board() from public, anon;
grant execute on function yungsta_warning() to authenticated;
grant execute on function stress_restart(text) to authenticated;
grant execute on function stress_board() to authenticated;
alter table sim_profiles add column if not exists debt_strategy text not null default 'avalanche';
alter table sim_profiles add column if not exists debt_autopay boolean not null default false;
alter table sim_profiles add column if not exists debt_plan_at timestamptz;
create table if not exists lender_products (
 product text primary key,                       
 label text not null,
 annual_rate numeric(6,2) not null,
 structure text not null,                        
 term_default int,
 term_options int[],
 late_fee_pct numeric(5,2) not null default 5,
 rollover_fee_pct numeric(5,2),
 lesson_id text not null default '1-2',
 note text
);
revoke insert, update, delete, truncate on lender_products from anon, authenticated;
create table if not exists story_loan_products (
 story_tag text primary key,
 product text not null,                          
 term_months int
);
revoke all on story_loan_products from anon, authenticated;
create or replace function debt_installment(p numeric, rate numeric, n int) returns numeric
language sql immutable as $$ select round((p + p * rate / 100.0 * n / 12.0) / n, 2) $$;
create or replace function debts_set_schedule() returns trigger
language plpgsql as $$
declare sl story_loan_products; lp lender_products;
begin
 if new.story_tag is null then return new; end if;
 select * into sl from story_loan_products where story_tag = new.story_tag;
 if not found then return new; end if;
 if sl.product = 'story' then
 new.structure := 'story';
 new.product := case when new.lender_kind = 'microfinance' then 'microfinance' else 'payday' end;
 else
 select * into lp from lender_products where product = sl.product;
 new.product := lp.product; new.structure := lp.structure; new.annual_interest_rate := lp.annual_rate;
 new.term_months := sl.term_months; new.last_accrual_at := now();
 if lp.structure = 'installment' then new.installment := debt_installment(new.principal, lp.annual_rate, sl.term_months); end if;
 end if;
 return new;
end $$;
drop trigger if exists debts_set_schedule_t on debts;
create trigger debts_set_schedule_t before insert on debts for each row execute function debts_set_schedule();
create or replace function debt_quote(p_product text, p_amount numeric, p_term_months int default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare lp lender_products; n int; v_int numeric; v_total numeric;
begin
 select * into lp from lender_products where product = p_product;
 if not found then return jsonb_build_object('error', 'bad_product'); end if;
 if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
 n := coalesce(p_term_months, lp.term_default, 1);
 if lp.term_options is not null and not (n = any (lp.term_options)) then return jsonb_build_object('error', 'bad_term'); end if;
 v_int := round(p_amount * lp.annual_rate / 100.0 * n / 12.0, 2);
 v_total := p_amount + v_int;
 return jsonb_build_object('product', lp.product, 'label', lp.label, 'rate', lp.annual_rate, 'term_months', n, 'structure', lp.structure,
 'total_interest', v_int, 'total_repay', v_total,
 'monthly_payment', case when lp.structure = 'installment' then round(v_total / n, 2) when lp.structure = 'bullet' then v_total else 0 end,
 'rollover_fee_pct', lp.rollover_fee_pct, 'lesson', lp.lesson_id, 'terms', lp.term_options);
end $$;
create or replace function debt_borrow(p_product text, p_amount numeric, p_term_months int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid(); lp lender_products; q jsonb; v_kind text; v_ceiling numeric; v_used numeric; v_left numeric; v_id bigint; n int;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if not story_feature_open(uid, 'debts') then return jsonb_build_object('error', 'locked'); end if;
 q := debt_quote(p_product, p_amount, p_term_months);
 if q ? 'error' then return q; end if;
 select * into lp from lender_products where product = p_product;
 n := (q->>'term_months')::int;
 v_kind := case p_product when 'bank' then 'bank' when 'microfinance' then 'microfinance' else 'informal' end;
 if p_product = 'payday' then
 v_ceiling := sim_cfg('debt_payday_limit', 2000);
 select coalesce(sum(outstanding_balance), 0) into v_used from debts where profile_id = uid and product = 'payday' and status = 'active';
 elsif p_product = 'family' then
 v_ceiling := story_lender_ceiling(uid, 'informal');
 select coalesce(sum(outstanding_balance), 0) into v_used from debts where profile_id = uid and lender_kind = 'informal' and annual_interest_rate = 0 and status = 'active';
 else
 v_ceiling := story_lender_ceiling(uid, v_kind);
 select coalesce(sum(outstanding_balance), 0) into v_used from debts where profile_id = uid and lender_kind = v_kind and status = 'active';
 end if;
 v_left := greatest(0, v_ceiling - v_used);
 if p_amount > v_left then return jsonb_build_object('error', 'over_limit', 'limit', v_left); end if;
 insert into debts (profile_id, lender_kind, principal, outstanding_balance, annual_interest_rate, product, structure, term_months, installment, last_accrual_at)
 values (uid, v_kind, p_amount, p_amount, lp.annual_rate, lp.product, lp.structure, case when lp.structure = 'flexible' then null else n end,
 case when lp.structure = 'installment' then debt_installment(p_amount, lp.annual_rate, n) end, now())
 returning id into v_id;
 perform adjust_cash_balance(uid, p_amount, 'debt_drawdown', 'debts', v_id);
 return jsonb_build_object('ok', true, 'debt_id', v_id, 'quote', q);
end $$;
create or replace function story_borrow(p_kind text, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
 return debt_borrow(case p_kind when 'bank' then 'bank' when 'microfinance' then 'microfinance' when 'informal' then 'family' else p_kind end, p_amount, null);
end $$;
create or replace function debt_apply_payment(p uuid, p_debt_id bigint, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d debts; v_cash numeric; v_amt numeric; v_due_cleared numeric; v_new_due numeric; v_on_time boolean; v_new_bal numeric;
 v_grace numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1) * sim_cfg('debt_grace_months', 1);
begin
 select * into d from debts where id = p_debt_id and profile_id = p and status = 'active' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 v_amt := least(round(coalesce(p_amount, 0), 2), d.outstanding_balance);
 if v_amt <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
 select cash_balance into v_cash from sim_profiles where id = p for update;
 if v_amt > v_cash then return jsonb_build_object('error', 'insufficient_cash', 'cash', v_cash); end if;
 perform adjust_cash_balance(p, -v_amt, 'debt_repayment', 'debts', d.id);
 v_due_cleared := least(v_amt, d.due_amount);
 v_new_due := d.due_amount - v_due_cleared;
 v_on_time := d.due_amount > 0 and v_due_cleared >= d.due_amount - 0.005
 and (d.due_since is null or now() <= d.due_since + make_interval(secs => v_grace * 86400));
 v_new_bal := greatest(0, d.outstanding_balance - v_amt);
 update debts set outstanding_balance = v_new_bal, due_amount = v_new_due,
 due_since = case when v_new_due <= 0.005 then null else due_since end,
 status = case when v_new_bal <= 0.005 then 'repaid' else 'active' end
 where id = d.id;
 if v_on_time then perform story_set_flag(p, 'debt_paid_on_time', null); end if;
 if v_new_bal <= 0.005 then
 perform story_set_flag(p, 'debt_cleared', null);
 -- Module 1.2: consistently paying on time is the strongest signal of reliability. Clean repayment raises the ceiling.
 if d.product = 'microfinance' and d.missed_count = 0 then perform story_set_flag(p, 'repaid_microfinance_on_time', null); end if;
 end if;
 return jsonb_build_object('ok', true, 'paid', v_amt, 'repaid', v_new_bal <= 0.005, 'balance', v_new_bal);
end $$;
do $$ begin
 if position('sim_repay_core' in pg_get_functiondef('sim_repay(bigint,numeric)'::regprocedure)) = 0 then
 drop function if exists sim_repay_core(bigint, numeric);
 alter function sim_repay(bigint, numeric) rename to sim_repay_core;
 end if;
end $$;
create or replace function sim_repay(p_debt_id bigint, p_amount numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_s text;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select structure into v_s from debts where id = p_debt_id and profile_id = uid and status = 'active';
 if v_s in ('installment', 'bullet') then return debt_apply_payment(uid, p_debt_id, p_amount); end if;
 return sim_repay_core(p_debt_id, p_amount);
end $$;
create or replace function debt_tick(p uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
 d record; lp lender_products; v_gm numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1);
 v_grace_s numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1) * sim_cfg('debt_grace_months', 1) * 86400;
 v_n int; v_bal numeric; v_due numeric; v_since timestamptz; v_cycles int; v_acc timestamptz; v_missed int; v_status text;
 v_autopay boolean; v_cash numeric; v_fee numeric;
begin
 select debt_autopay into v_autopay from sim_profiles where id = p;
 -- pass 1: add interest and raise bills
 for d in select * from debts where profile_id = p and status = 'active' and structure in ('installment', 'bullet') order by id loop
 v_bal := d.outstanding_balance; v_due := d.due_amount; v_since := d.due_since; v_cycles := d.billed_cycles; v_acc := d.last_accrual_at; v_n := 0;
 while v_acc + make_interval(secs => v_gm * 86400) <= now() and v_n < 48 loop
 v_n := v_n + 1;
 v_bal := v_bal + round(v_bal * d.annual_interest_rate / 1200.0, 2);
 v_acc := v_acc + make_interval(secs => v_gm * 86400);
 v_cycles := v_cycles + 1;
 if d.structure = 'installment' then
 if v_cycles >= d.term_months then v_due := v_bal; else v_due := least(v_bal, v_due + d.installment); end if;
 elsif v_cycles >= d.term_months * (d.rollovers + 1) then
 v_due := v_bal;
 end if;
 if v_due > 0 and v_since is null then v_since := v_acc; end if;
 end loop;
 update debts set outstanding_balance = v_bal, due_amount = v_due, due_since = v_since, billed_cycles = v_cycles, last_accrual_at = v_acc where id = d.id;
 end loop;
 -- standing order: pay what is due, oldest first, while cash lasts
 if v_autopay then
 for d in select * from debts where profile_id = p and status = 'active' and due_amount > 0 order by due_since, id loop
 select cash_balance into v_cash from sim_profiles where id = p;
 exit when v_cash <= 0;
 perform debt_apply_payment(p, d.id, least(d.due_amount, v_cash));
 end loop;
 end if;
 -- pass 2: missed payments (at most one per debt per visit, so a learner who returns gets a fresh grace period)
 for d in select * from debts where profile_id = p and status = 'active' and due_amount > 0 and due_since is not null
 and now() > due_since + make_interval(secs => v_grace_s) loop
 select * into lp from lender_products where product = d.product;
 v_fee := round(d.due_amount * coalesce(lp.late_fee_pct, 5) / 100.0, 2);
 v_missed := d.missed_count + 1;
 v_status := case when v_missed >= sim_cfg('debt_default_after_missed', 3)::int then 'defaulted' else 'active' end;
 update debts set outstanding_balance = outstanding_balance + v_fee, due_amount = due_amount + v_fee, due_since = now(),
 missed_count = v_missed, status = v_status where id = d.id;
 perform story_set_flag(p, 'debt_missed_payment', null);
 if v_status = 'defaulted' then
 perform story_set_flag(p, 'debt_defaulted_schedule', null);
 if d.product = 'microfinance' then perform story_set_flag(p, 'defaulted_microfinance', null); end if;   -- lowers the microfinance ceiling (lender_limit_rules)
 end if;
 end loop;
end $$;
create or replace function debt_run_strategy(p_debts jsonb, p_budget numeric, p_strategy text)
returns jsonb language plpgsql immutable as $$
declare
 n int := jsonb_array_length(p_debts); ids bigint[]; bal numeric[]; rt numeric[]; mn numeric[]; pay1 numeric[];
 i int; j int; k int; months int := 0; total_int numeric := 0; first_cleared int := null; remaining numeric; v_pay numeric; ord int[]; tmp int;
 alive boolean; v_first_order jsonb := '[]'::jsonb; v_fm jsonb := '[]'::jsonb; target int; extra numeric;
begin
 if n = 0 then return jsonb_build_object('months', 0, 'total_interest', 0, 'first_cleared_month', null, 'first_month', '[]'::jsonb, 'order', '[]'::jsonb); end if;
 for i in 0 .. n - 1 loop
 ids[i + 1] := (p_debts->i->>'id')::bigint; bal[i + 1] := (p_debts->i->>'balance')::numeric;
 rt[i + 1] := (p_debts->i->>'rate')::numeric; mn[i + 1] := (p_debts->i->>'min')::numeric; pay1[i + 1] := 0;
 end loop;
 loop
 alive := false; for i in 1 .. n loop if bal[i] > 0.01 then alive := true; end if; end loop;
 exit when not alive or months >= 600;
 months := months + 1;
 for i in 1 .. n loop
 if bal[i] > 0 then total_int := total_int + bal[i] * rt[i] / 1200.0; bal[i] := bal[i] + bal[i] * rt[i] / 1200.0; end if;
 end loop;
 remaining := case when p_strategy = 'minimum' then 0 else p_budget end;
 for i in 1 .. n loop
 if bal[i] > 0 then
 v_pay := least(mn[i], bal[i]); bal[i] := bal[i] - v_pay; remaining := remaining - v_pay;
 if months = 1 then pay1[i] := pay1[i] + v_pay; end if;
 end if;
 end loop;
 if p_strategy <> 'minimum' then
 loop
 exit when remaining <= 0.01;
 target := null;
 for i in 1 .. n loop
 if bal[i] > 0.01 then
 if target is null then target := i;
 elsif p_strategy = 'avalanche' and (rt[i] > rt[target] or (rt[i] = rt[target] and bal[i] < bal[target])) then target := i;
 elsif p_strategy = 'snowball' and (bal[i] < bal[target] or (bal[i] = bal[target] and rt[i] > rt[target])) then target := i;
 end if;
 end if;
 end loop;
 exit when target is null;
 extra := least(remaining, bal[target]); bal[target] := bal[target] - extra; remaining := remaining - extra;
 if months = 1 then pay1[target] := pay1[target] + extra; end if;
 end loop;
 end if;
 if first_cleared is null then
 for i in 1 .. n loop if bal[i] <= 0.01 then first_cleared := months; end if; end loop;
 end if;
 end loop;
 alive := false; for i in 1 .. n loop if bal[i] > 0.01 then alive := true; end if; end loop;
 -- priority order at the start (for display)
 for i in 1 .. n loop ord[i] := i; end loop;
 for i in 1 .. n - 1 loop for j in i + 1 .. n loop
 if (p_strategy = 'avalanche' and (rt[ord[j]] > rt[ord[i]] or (rt[ord[j]] = rt[ord[i]] and (p_debts->(ord[j]-1)->>'balance')::numeric < (p_debts->(ord[i]-1)->>'balance')::numeric)))
 or (p_strategy = 'snowball' and ((p_debts->(ord[j]-1)->>'balance')::numeric < (p_debts->(ord[i]-1)->>'balance')::numeric
 or ((p_debts->(ord[j]-1)->>'balance')::numeric = (p_debts->(ord[i]-1)->>'balance')::numeric and rt[ord[j]] > rt[ord[i]]))) then
 tmp := ord[i]; ord[i] := ord[j]; ord[j] := tmp;
 end if;
 end loop; end loop;
 for i in 1 .. n loop v_first_order := v_first_order || to_jsonb(ids[ord[i]]); end loop;
 for i in 1 .. n loop v_fm := v_fm || jsonb_build_array(jsonb_build_object('id', ids[i], 'pay', round(pay1[i], 2))); end loop;
 return jsonb_build_object('months', case when alive then null else months end, 'total_interest', round(total_int, 2),
 'first_cleared_month', first_cleared,
 'first_month', v_fm, 'order', v_first_order);
end $$;
create or replace function debt_plan_inputs(p uuid)
returns jsonb language sql stable security definer set search_path = public as $$
 select coalesce(jsonb_agg(jsonb_build_object(
 'id', d.id, 'label', coalesce(lp.label, initcap(d.lender_kind)), 'product', d.product, 'balance', d.outstanding_balance, 'rate', d.annual_interest_rate,
 'min', least(d.outstanding_balance, greatest(
 case d.structure when 'installment' then d.installment
 when 'bullet' then d.outstanding_balance / greatest(1, coalesce(d.term_months, 1) * (d.rollovers + 1) - d.billed_cycles)
 else 0 end, d.due_amount))) order by d.id), '[]'::jsonb)
 from debts d left join lender_products lp on lp.product = d.product
 where d.profile_id = p and d.status = 'active' and d.structure <> 'story' and d.outstanding_balance > 0.01
$$;
create or replace function debt_plan(p_budget numeric)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_in jsonb; v_min numeric; v_m jsonb; v_a jsonb; v_s jsonb; v_cash numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform debt_tick(uid);
 v_in := debt_plan_inputs(uid);
 if jsonb_array_length(v_in) = 0 then return jsonb_build_object('error', 'no_debts'); end if;
 select coalesce(sum((x->>'min')::numeric), 0) into v_min from jsonb_array_elements(v_in) x;
 select cash_balance into v_cash from sim_profiles where id = uid;
 if p_budget is null or p_budget < v_min then
 return jsonb_build_object('error', 'below_minimums', 'min_total', round(v_min, 2), 'debts', v_in);
 end if;
 v_m := debt_run_strategy(v_in, v_min, 'minimum');
 v_a := debt_run_strategy(v_in, p_budget, 'avalanche');
 v_s := debt_run_strategy(v_in, p_budget, 'snowball');
 return jsonb_build_object('debts', v_in, 'budget', p_budget, 'min_total', round(v_min, 2), 'cash', v_cash,
 'minimum', v_m, 'avalanche', v_a, 'snowball', v_s,
 'avalanche_saves', greatest(0, round((v_s->>'total_interest')::numeric - (v_a->>'total_interest')::numeric, 2)),
 'extra_saves_vs_minimum', greatest(0, round((v_m->>'total_interest')::numeric - (v_a->>'total_interest')::numeric, 2)));
end $$;
create or replace function debt_execute_plan(p_budget numeric, p_strategy text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr sim_profiles; v_in jsonb; v_min numeric; v_run jsonb; a jsonb; v_total numeric := 0; r jsonb;
 v_gm numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1); v_next timestamptz;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_strategy not in ('minimum', 'avalanche', 'snowball') then return jsonb_build_object('error', 'bad_strategy'); end if;
 select * into pr from sim_profiles where id = uid for update;
 v_next := pr.debt_plan_at + make_interval(secs => v_gm * 86400 * sim_cfg('debt_plan_cooldown_months', 1));
 if pr.debt_plan_at is not null and now() < v_next then return jsonb_build_object('error', 'already_done', 'next_at', v_next); end if;
 perform debt_tick(uid);
 v_in := debt_plan_inputs(uid);
 if jsonb_array_length(v_in) = 0 then return jsonb_build_object('error', 'no_debts'); end if;
 select coalesce(sum((x->>'min')::numeric), 0) into v_min from jsonb_array_elements(v_in) x;
 if p_budget is null or p_budget < v_min then return jsonb_build_object('error', 'below_minimums', 'min_total', round(v_min, 2)); end if;
 v_run := debt_run_strategy(v_in, p_budget, p_strategy);
 select coalesce(sum((x->>'pay')::numeric), 0) into v_total from jsonb_array_elements(v_run->'first_month') x;
 if v_total > pr.cash_balance then return jsonb_build_object('error', 'insufficient_cash', 'needed', v_total, 'cash', pr.cash_balance); end if;
 for a in select * from jsonb_array_elements(v_run->'first_month') loop
 if (a->>'pay')::numeric > 0 then r := debt_apply_payment(uid, (a->>'id')::bigint, (a->>'pay')::numeric); end if;
 end loop;
 update sim_profiles set debt_plan_at = now(), debt_strategy = p_strategy where id = uid;
 if p_strategy = 'avalanche' then perform story_set_flag(uid, 'used_avalanche', null);
 elsif p_strategy = 'snowball' then perform story_set_flag(uid, 'used_snowball', null); end if;
 return jsonb_build_object('ok', true, 'paid', round(v_total, 2), 'strategy', p_strategy, 'allocations', v_run->'first_month');
end $$;
create or replace function debt_pay_due()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d record; v_cash numeric; v_paid numeric := 0; v_left numeric := 0; r jsonb;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform debt_tick(uid);
 for d in select * from debts where profile_id = uid and status = 'active' and due_amount > 0 order by due_since, id loop
 select cash_balance into v_cash from sim_profiles where id = uid;
 if v_cash >= d.due_amount then r := debt_apply_payment(uid, d.id, d.due_amount); v_paid := v_paid + d.due_amount;
 else v_left := v_left + d.due_amount; end if;
 end loop;
 return jsonb_build_object('ok', true, 'paid', round(v_paid, 2), 'still_due', round(v_left, 2));
end $$;
create or replace function debt_set_prefs(p_strategy text, p_autopay boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_strategy not in ('minimum', 'avalanche', 'snowball') then return jsonb_build_object('error', 'bad_strategy'); end if;
 update sim_profiles set debt_strategy = p_strategy, debt_autopay = coalesce(p_autopay, false) where id = uid;
 return jsonb_build_object('ok', true);
end $$;
create or replace function debt_rollover(p_debt_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d debts; lp lender_products; v_fee numeric;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform debt_tick(uid);
 select * into d from debts where id = p_debt_id and profile_id = uid and status = 'active' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 select * into lp from lender_products where product = d.product;
 if d.structure <> 'bullet' or lp.rollover_fee_pct is null then return jsonb_build_object('error', 'not_renewable'); end if;
 if d.due_amount <= 0 then return jsonb_build_object('error', 'not_due_yet'); end if;
 v_fee := round(d.outstanding_balance * lp.rollover_fee_pct / 100.0, 2);
 update debts set outstanding_balance = outstanding_balance + v_fee, due_amount = 0, due_since = null, rollovers = rollovers + 1 where id = d.id;
 perform story_set_flag(uid, 'debt_rolled_over', null);
 return jsonb_build_object('ok', true, 'fee', v_fee, 'new_balance', d.outstanding_balance + v_fee, 'rollovers', d.rollovers + 1);
end $$;
create or replace function debt_schedule(p_debt_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d debts; bal numeric; i int := 0; v_int numeric; v_pay numeric; v_tot_int numeric := 0; rows jsonb := '[]'::jsonb;
 v_mins numeric; v_left_months int;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform debt_tick(uid);
 select * into d from debts where id = p_debt_id and profile_id = uid;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 bal := d.outstanding_balance;
 if d.structure not in ('installment', 'bullet') then return jsonb_build_object('rows', '[]'::jsonb, 'note', 'flexible'); end if;
 v_left_months := case d.structure when 'installment' then greatest(1, d.term_months - d.billed_cycles) else greatest(1, d.term_months * (d.rollovers + 1) - d.billed_cycles) end;
 while bal > 0.01 and i < 60 loop
 i := i + 1;
 v_int := round(bal * d.annual_interest_rate / 1200.0, 2); bal := bal + v_int; v_tot_int := v_tot_int + v_int;
 v_pay := case when d.structure = 'installment' and i < v_left_months then least(bal, d.installment) else case when i >= v_left_months then bal else 0 end end;
 bal := bal - v_pay;
 rows := rows || jsonb_build_array(jsonb_build_object('month', i, 'interest', v_int, 'payment', round(v_pay, 2), 'balance', round(bal, 2)));
 end loop;
 return jsonb_build_object('rows', rows, 'total_interest', round(v_tot_int, 2), 'months', i);
end $$;
create or replace function debt_overview()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr sim_profiles; v_gm numeric := greatest(sim_cfg('real_days_per_game_year', 14) / 12.0, 0.1);
 v_grace numeric := sim_cfg('debt_grace_months', 1); v_debts jsonb; v_next timestamptz;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 perform debt_tick(uid);
 select * into pr from sim_profiles where id = uid;
 select coalesce(jsonb_agg(jsonb_build_object(
 'id', d.id, 'product', d.product, 'label', coalesce(lp.label, initcap(d.lender_kind)), 'structure', d.structure, 'status', d.status,
 'principal', d.principal, 'balance', d.outstanding_balance, 'rate', d.annual_interest_rate, 'term_months', d.term_months,
 'installment', d.installment, 'due_amount', d.due_amount, 'due_since', d.due_since,
 'overdue', d.due_amount > 0 and d.due_since is not null and now() > d.due_since + make_interval(secs => v_gm * v_grace * 86400),
 'next_due_at', case d.structure
 when 'installment' then d.created_at + make_interval(secs => v_gm * 86400 * least(d.billed_cycles + 1, d.term_months))
 when 'bullet' then d.created_at + make_interval(secs => v_gm * 86400 * d.term_months * (d.rollovers + 1)) end,
 'months_left', case d.structure when 'installment' then greatest(0, d.term_months - d.billed_cycles)
 when 'bullet' then greatest(0, d.term_months * (d.rollovers + 1) - d.billed_cycles) end,
 'missed_count', d.missed_count, 'rollovers', d.rollovers, 'story_managed', d.structure = 'story',
 'can_rollover', d.structure = 'bullet' and lp.rollover_fee_pct is not null and d.due_amount > 0,
 'rollover_fee', case when lp.rollover_fee_pct is not null then round(d.outstanding_balance * lp.rollover_fee_pct / 100.0, 2) end,
 'created_at', d.created_at) order by (d.status = 'active') desc, d.id desc), '[]'::jsonb)
 into v_debts
 from debts d left join lender_products lp on lp.product = d.product
 where d.profile_id = uid and d.status in ('active', 'defaulted');
 v_next := pr.debt_plan_at + make_interval(secs => v_gm * 86400 * sim_cfg('debt_plan_cooldown_months', 1));
 return jsonb_build_object('cash', pr.cash_balance, 'strategy', pr.debt_strategy, 'autopay', pr.debt_autopay, 'debts', v_debts,
 'plan_next_at', case when pr.debt_plan_at is not null and now() < v_next then v_next end,
 'due_total', (select coalesce(sum(due_amount), 0) from debts where profile_id = uid and status = 'active'),
 'monthly_min', (select coalesce(sum((x->>'min')::numeric), 0) from jsonb_array_elements(debt_plan_inputs(uid)) x),
 'products', (select jsonb_agg(jsonb_build_object('product', product, 'label', label, 'rate', annual_rate, 'structure', structure,
 'term_default', term_default, 'terms', term_options, 'rollover_fee_pct', rollover_fee_pct, 'note', note) order by annual_rate) from lender_products),
 'limits', story_borrow_limits(), 'payday_left', greatest(0, sim_cfg('debt_payday_limit', 2000) - (select coalesce(sum(outstanding_balance), 0) from debts where profile_id = uid and product = 'payday' and status = 'active')));
end $$;
revoke all on function debt_installment(numeric, numeric, int) from public, anon, authenticated;
revoke all on function debt_tick(uuid) from public, anon, authenticated;
revoke all on function debt_apply_payment(uuid, bigint, numeric) from public, anon, authenticated;
revoke all on function debt_run_strategy(jsonb, numeric, text) from public, anon, authenticated;
revoke all on function debt_plan_inputs(uuid) from public, anon, authenticated;
revoke all on function sim_repay_core(bigint, numeric) from public, anon, authenticated;
revoke all on function debts_set_schedule() from public, anon, authenticated;
do $$ declare f text; begin
 foreach f in array array['debt_quote(text,numeric,int)', 'debt_borrow(text,numeric,int)', 'debt_overview()', 'debt_plan(numeric)',
 'debt_execute_plan(numeric,text)', 'debt_pay_due()', 'debt_set_prefs(text,boolean)', 'debt_rollover(bigint)', 'debt_schedule(bigint)',
 'story_borrow(text,numeric)', 'sim_repay(bigint,numeric)'] loop
 execute format('revoke all on function %s from public, anon', f);
 execute format('grant execute on function %s to authenticated', f);
 end loop;
end $$;
create table if not exists learner_practice (
 id bigint generated always as identity primary key,
 profile_id uuid not null references sim_profiles(id) on delete cascade,
 lesson_id text not null,
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 correct_count int
);
create index if not exists learner_practice_lookup on learner_practice (profile_id, lesson_id, started_at desc);
alter table learner_questions add column if not exists practice_id bigint references learner_practice(id) on delete set null;
revoke insert, update, delete, truncate on learner_practice from anon, authenticated;
create or replace function practice_title(p_lesson text)
returns text language sql stable set search_path = public as $$
 select m.t from (values
 ('0a', 'Foundations & Introduction to Mobile Money'),
 ('0b', 'Mobile Money in Practice'),
 ('0c', 'Staying Safe & Consumer Protection'),
 ('0d', 'Money Mindset & Inclusion'),
 ('1-0', 'Income, Budgeting & Goal Setting'),
 ('1-1', 'Saving and Banking'),
 ('1-2', 'Credit and Debt Management'),
 ('1-3', 'Emergency Funds & Resilience'),
 ('1-4', 'Digital Village Banking'),
 ('2-0', 'Risk Management and Insurance'),
 ('2-1', 'Basics of Investing'),
 ('2-2', 'Housing and Major Purchases'),
 ('2-3', 'Agricultural & Rural Finance'),
 ('2-4', 'Entrepreneurship & Small Business Finance'),
 ('3-0', 'Taxation and Financial Planning'),
 ('3-1', 'Behavioral Economics'),
 ('3-2', 'Digital Finance & Cybersecurity'),
 ('3-3', 'Consumer Protection'),
 ('3-4', 'Remittances & Diaspora Finance'),
 ('3-5', 'Warranties and Consumer Rights'),
 ('4-0', 'Retirement and Estate Planning'),
 ('4-1', 'Comprehensive Review'),
 ('4-2', 'Health & Long-Term Care Planning'),
 ('4-3', 'Succession Law and Wills'),
 ('u1', 'Real Estate in Zambia'),
 ('u2', 'Investment Analysis Fundamentals'),
 ('u3', 'The LuSE — Complete Guide'),
 ('u4', 'Cryptocurrency Fundamentals'),
 ('b1', 'Starting & Running a Business'),
 ('b2', 'VAT — Input, Output & Compliance'),
 ('p1', 'Financial Concepts Explained')
 ) as m(k, t) where m.k = p_lesson
$$;
create or replace function practice_progress(p uuid, p_lesson text, p_session bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 v_total int := 0; v_ans int := 0; v_ok int := 0;
 v_has boolean := false; v_sdone boolean := true; v_done boolean;
begin
 select count(*), count(*) filter (where lq.status = 'answered'), count(*) filter (where lq.correct is true)
 into v_total, v_ans, v_ok
 from learner_questions lq
 where lq.profile_id = p and lq.practice_id = p_session;
 -- the lesson's real-life scenario, if it has one
 select count(*) > 0, coalesce(bool_and(pe.status = 'done'), true)
 into v_has, v_sdone
 from learner_pending_events pe
 join story_events e on e.id = pe.event_id
 where pe.profile_id = p and e.category = 'lesson_bridge' and e.trigger_config ->> 'lesson_id' = p_lesson;
 v_done := (v_total = 0 and not v_has) or (v_ans >= v_total and v_sdone);
 if v_done and p_session is not null then
 update learner_practice
 set completed_at = coalesce(completed_at, now()), correct_count = v_ok
 where id = p_session and profile_id = p;
 end if;
 return jsonb_build_object(
 'available', not (v_total = 0 and not v_has),
 'done', v_done,
 'title', practice_title(p_lesson),
 'answered', v_ans,
 'total', v_total,
 'questions', jsonb_build_object('total', v_total, 'answered', v_ans, 'correct', v_ok),
 'scenario', jsonb_build_object('has', v_has, 'done', (v_has and v_sdone)));
end $$;
create or replace function practice_start(p_lesson text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid();
 s learner_practice;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_lesson is null or p_lesson !~ '^[a-z0-9-]{1,8}$' then return jsonb_build_object('error', 'bad_lesson'); end if;
 if not exists (select 1 from sim_profiles where id = uid) then return jsonb_build_object('error', 'no_profile'); end if;
 -- record the lesson as finished and queue its real-life scenario (does nothing the second time)
 perform story_fire_lesson(p_lesson);
 select * into s from learner_practice
 where profile_id = uid and lesson_id = p_lesson
 order by started_at desc, id desc limit 1;
 -- a new round: none yet, or the last one was finished more than 15 minutes ago ("Practice again")
 if s.id is null or (s.completed_at is not null and s.completed_at < now() - interval '15 minutes') then
 insert into learner_practice (profile_id, lesson_id) values (uid, p_lesson) returning * into s;
 -- up to 3 of this lesson's questions, the ones asked least recently first.
 -- They are given an early "available_at" so they come up before any other waiting question.
 insert into learner_questions (profile_id, question_id, option_order, available_at, practice_id)
 select uid, q.id,
 array(select i from generate_series(0, jsonb_array_length(q.options) - 1) i order by random()),
 timestamptz 'epoch' + (q.rn * interval '1 second'),
 s.id
 from (
 select yq.id, yq.options,
 row_number() over (
 order by (select max(lq.created_at) from learner_questions lq
 where lq.profile_id = uid and lq.question_id = yq.id) asc nulls first,
 random()) as rn
 from yungsta_questions yq
 where yq.is_active and yq.lesson_id = p_lesson
 ) q
 where q.rn <= 3;
 end if;
 return practice_progress(uid, p_lesson, s.id);
end $$;
create or replace function practice_status(p_lesson text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
 uid uuid := auth.uid();
 s learner_practice;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into s from learner_practice
 where profile_id = uid and lesson_id = p_lesson
 order by started_at desc, id desc limit 1;
 if s.id is null then return practice_start(p_lesson); end if;
 return practice_progress(uid, p_lesson, s.id);
end $$;
do $$
declare r record;
begin
 for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('practice_title', 'practice_progress', 'practice_start', 'practice_status')
 loop
 execute format('revoke all on function %s from public, anon', r.sig);
 if r.proname in ('practice_start', 'practice_status') then
 execute format('grant execute on function %s to authenticated', r.sig);
 end if;
 end loop;
end $$;
create table if not exists learner_mirror (
 id bigint generated always as identity primary key,
 profile_id uuid not null references sim_profiles(id) on delete cascade,
 lesson_id text not null,
 practice_id bigint not null references learner_practice(id) on delete cascade,
 advice text not null,                    
 stance text not null,                    
 barrier text,                            
 commit_when text,                        
 status text not null default 'noted',    
 due_at timestamptz,
 nudges int not null default 0,
 created_at timestamptz not null default now(),
 checked_at timestamptz,
 unique (practice_id)
);
create index if not exists learner_mirror_due on learner_mirror (profile_id, status, due_at);
revoke insert, update, delete, truncate on learner_mirror from anon, authenticated;
create or replace function mirror_advice(p uuid, p_lesson text)
returns text language plpgsql stable security definer set search_path = public as $$
declare ev story_events; lg learner_event_log; nd story_nodes;
begin
 select * into ev from story_events where category = 'lesson_bridge' and trigger_config ->> 'lesson_id' = p_lesson and is_active order by id limit 1;
 if ev.id is null then return null; end if;
 select * into lg from learner_event_log where profile_id = p and event_id = ev.id and node_key = 'start' order by created_at desc, id desc limit 1;
 if lg.id is null or lg.choice_index is null then return null; end if;
 select * into nd from story_nodes where event_id = ev.id and node_key = 'start';
 return nullif(story_fill(p, nd.choices -> lg.choice_index ->> 'label'), '');
end $$;
create or replace function practice_mirror_get(p_lesson text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); s learner_practice; m learner_mirror; v_adv text;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_lesson is null or p_lesson !~ '^[a-z0-9-]{1,8}$' then return jsonb_build_object('error', 'bad_lesson'); end if;
 select * into s from learner_practice where profile_id = uid and lesson_id = p_lesson order by started_at desc, id desc limit 1;
 if s.id is null then return jsonb_build_object('available', false); end if;
 v_adv := mirror_advice(uid, p_lesson);
 if v_adv is null then return jsonb_build_object('available', false); end if;
 select * into m from learner_mirror where practice_id = s.id and profile_id = uid;
 return jsonb_build_object('available', true, 'advice', v_adv,
 'name', coalesce((select nullif(character_name, '') from sim_profiles where id = uid), 'Your yungsta'),
 'saved', m.id is not null, 'stance', m.stance, 'when', m.commit_when);
end $$;
create or replace function practice_mirror_save(p_lesson text, p_stance text, p_barrier text default null, p_when text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); s learner_practice; v_adv text; v_due timestamptz; v_status text; v_react text; v_when text;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 if p_lesson is null or p_lesson !~ '^[a-z0-9-]{1,8}$' then return jsonb_build_object('error', 'bad_lesson'); end if;
 if p_stance is null or p_stance <> all (array['same', 'different', 'unsure', 'na']) then return jsonb_build_object('error', 'bad_stance'); end if;
 if p_barrier is not null and p_barrier <> all (array['cost', 'people', 'habit', 'trust']) then return jsonb_build_object('error', 'bad_barrier'); end if;
 if p_when is not null and p_when <> all (array['today', 'week', 'month']) then return jsonb_build_object('error', 'bad_when'); end if;
 select * into s from learner_practice where profile_id = uid and lesson_id = p_lesson order by started_at desc, id desc limit 1;
 if s.id is null then return jsonb_build_object('error', 'no_practice'); end if;
 v_adv := mirror_advice(uid, p_lesson);
 if v_adv is null then return jsonb_build_object('error', 'no_advice'); end if;
 if exists (select 1 from learner_mirror where practice_id = s.id) then return jsonb_build_object('error', 'already_saved'); end if;
 if p_stance in ('different', 'unsure') then
 v_when := coalesce(p_when, 'week');
 v_status := 'open';
 v_due := now() + case v_when when 'today' then interval '1 day' when 'week' then interval '7 days' else interval '30 days' end;
 v_react := '{name}: "Deal. We both try it ' || case v_when when 'today' then 'today' when 'week' then 'this week' else 'this month' end || '. I will ask you how it went."';
 elsif p_stance = 'same' then
 v_status := 'noted'; p_barrier := null; v_when := null;
 v_react := '{name}: "Then we are on the same page. I will be watching you do it too."';
 else
 v_status := 'noted'; p_barrier := null; v_when := null;
 v_react := '{name}: "Fair enough. Maybe it will matter for you one day. I will remember it."';
 end if;
 if p_stance not in ('different', 'unsure') then p_barrier := null; end if;
 insert into learner_mirror (profile_id, lesson_id, practice_id, advice, stance, barrier, commit_when, status, due_at)
 values (uid, p_lesson, s.id, v_adv, p_stance, p_barrier, v_when, v_status, v_due);
 return jsonb_build_object('ok', true, 'promise', v_status = 'open', 'reaction', story_fill(uid, v_react));
end $$;
create or replace function mirror_due()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); m learner_mirror;
begin
 if uid is null then return null; end if;
 select * into m from learner_mirror where profile_id = uid and status = 'open' and due_at <= now() order by due_at limit 1;
 if m.id is null then return null; end if;
 return jsonb_build_object('id', m.id, 'advice', m.advice, 'lesson', m.lesson_id,
 'name', coalesce((select nullif(character_name, '') from sim_profiles where id = uid), 'Your yungsta'));
end $$;
create or replace function mirror_check(p_id bigint, p_done boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m learner_mirror;
begin
 if uid is null then return jsonb_build_object('error', 'not_signed_in'); end if;
 select * into m from learner_mirror where id = p_id and profile_id = uid and status = 'open' for update;
 if not found then return jsonb_build_object('error', 'not_found'); end if;
 if p_done then
 update learner_mirror set status = 'done', checked_at = now() where id = m.id;
 perform adjust_reputation_score(uid, 1.0, 'took own advice: lesson ' || m.lesson_id);
 return jsonb_build_object('ok', true, 'status', 'done', 'reaction', story_fill(uid, '{name}: "You did it yourself. That is the hard part. I am proud of you."'));
 end if;
 if m.nudges >= 1 then
 update learner_mirror set status = 'dropped', nudges = m.nudges + 1, checked_at = now() where id = m.id;
 return jsonb_build_object('ok', true, 'status', 'dropped', 'reaction', story_fill(uid, '{name}: "No stress. Maybe try it after your next lesson. I am not going anywhere."'));
 end if;
 update learner_mirror set nudges = m.nudges + 1, due_at = now() + interval '3 days', checked_at = now() where id = m.id;
 return jsonb_build_object('ok', true, 'status', 'open', 'reaction', story_fill(uid, '{name}: "No stress. I will ask again in a few days."'));
end $$;
do $$
declare r record;
begin
 for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname in ('mirror_advice', 'practice_mirror_get', 'practice_mirror_save', 'mirror_due', 'mirror_check')
 loop
 execute format('revoke all on function %s from public, anon', r.sig);
 if r.proname <> 'mirror_advice' then
 execute format('grant execute on function %s to authenticated', r.sig);
 end if;
 end loop;
end $$;

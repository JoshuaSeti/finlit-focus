do $$
begin
 if not exists (select 1 from pg_constraint where conname = 'story_nodes_event_node_key') then
 alter table public.story_nodes add constraint story_nodes_event_node_key unique (event_id, node_key);
 end if;
end $$;
do $$
declare b text;
begin
 select value into b from public.sim_config where key = '__seed_body';
 if b is not null then
 delete from public.sim_config where key = '__seed_body';
 execute b;
 end if;
end $$;
do $$
declare b text;
begin
 select value into b from public.sim_config where key = '__seed_body';
 if b is not null then
 delete from public.sim_config where key = '__seed_body';
 execute b;
 end if;
end $$;
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toMember, type Member } from "./team";

export const teamQuery = () =>
  queryOptions({
    queryKey: ["team"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(toMember);
    },
  });

export const memberQuery = (slug: string) =>
  queryOptions({
    queryKey: ["team", slug],
    queryFn: async (): Promise<Member | null> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("slug", slug.slice(0, 120))
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data ? toMember(data) : null;
    },
  });

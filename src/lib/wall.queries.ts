import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// `wall_notes` isn't in the generated Supabase types until they're regenerated,
// so use an untyped handle here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

export type WallNote = { id: string; author: string; message: string; createdAt: string };

export const wallQuery = (memberId: string) =>
  queryOptions({
    queryKey: ["wall", memberId],
    queryFn: async (): Promise<WallNote[]> => {
      const { data, error } = await db
        .from("wall_notes")
        .select("id, author, message, created_at")
        .eq("member_id", memberId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []).map((r: { id: string; author: string; message: string; created_at: string }) => ({
        id: r.id,
        author: r.author,
        message: r.message,
        createdAt: r.created_at,
      }));
    },
  });

export async function postNote(memberId: string, author: string, message: string) {
  const { error } = await db.from("wall_notes").insert({
    member_id: memberId,
    author: author.trim().slice(0, 40) || "A supporter",
    message: message.trim().slice(0, 280),
  });
  if (error) throw error;
}

import { supabase } from '@/integrations/supabase/client';
import { loadLocal, type Scores } from '@/lib/placement';

/** Latest placement scores (account first, then this device) and whether K20 access is paid. */
export async function getAccess(userId: string | null): Promise<{ paid: boolean; scores: Scores | null }> {
  if (!userId) return { paid: false, scores: loadLocal()?.scores ?? null };
  const [{ data: a }, { data: pr }] = await Promise.all([
    supabase.from('lesson_access').select('user_id').eq('user_id', userId).maybeSingle(),
    supabase.from('placement_results').select('scores').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);
  return { paid: !!a, scores: (pr?.[0]?.scores as unknown as Scores) ?? loadLocal()?.scores ?? null };
}

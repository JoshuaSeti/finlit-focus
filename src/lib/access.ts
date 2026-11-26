import { supabase } from '@/integrations/supabase/client';
import { type Scores } from '@/lib/placement';

export type AccessInfo = {
  paid: boolean;
  expiresAt: string | null;
  daysRemaining: number;
  scores: Scores | null;
};

/** Latest placement scores and whether K20 monthly access is currently active. */
export async function getAccess(userId: string | null): Promise<AccessInfo> {
  if (!userId) return { paid: false, expiresAt: null, daysRemaining: 0, scores: null };
  const [{ data: a }, { data: pr }] = await Promise.all([
    supabase.from('lesson_access').select('user_id, expires_at').eq('user_id', userId).maybeSingle(),
    supabase.from('placement_results').select('scores').eq('user_id', userId).eq('server_scored', true).order('created_at', { ascending: false }).limit(1),
  ]);

  const rawExpiry = (a as any)?.expires_at as string | undefined;
  const isExpired = !rawExpiry || new Date(rawExpiry).getTime() <= Date.now();
  const msRemaining = rawExpiry ? Math.max(0, new Date(rawExpiry).getTime() - Date.now()) : 0;
  const daysRemaining = Math.ceil(msRemaining / (24 * 3600 * 1000));
  const paid = !!a && !isExpired;

  return {
    paid,
    expiresAt: rawExpiry ?? null,
    daysRemaining,
    scores: (pr?.[0]?.scores as unknown as Scores) ?? null,
  };
}

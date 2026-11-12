import { supabase } from '@/integrations/supabase/client';

export type Streak = { current: number; longest: number };
const listeners = new Set<(s: Streak) => void>();
export const onStreak = (f: (s: Streak) => void) => { listeners.add(f); return () => { listeners.delete(f); }; };

/** Marks today (Lusaka time) as active and remembers the learner's usual study hour. */
export async function touchStreak(): Promise<Streak | null> {
  const { data: u } = await supabase.auth.getSession();
  if (!u.session) return null;
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Lusaka' }).format(new Date()));
  const rpc = supabase.rpc as unknown as (fn: string, a?: object) => Promise<{ data: unknown; error: unknown }>;
  const { data, error } = await rpc('streak_touch', { p_hour: hour });
  if (error || !data) return null;
  const s = data as Streak;
  localStorage.setItem('finlit-study-hour', String(hour));
  listeners.forEach((f) => f(s));
  return s;
}

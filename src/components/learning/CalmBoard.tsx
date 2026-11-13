import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Same bands as the simulator's stress meter (public/sim/js/stress.js).
export function bandLabel(v: number, bankrupt?: boolean) {
  if (bankrupt || v >= 100) return 'Finished 😭🤚🏾';
  if (v >= 80) return 'Performing!';
  if (v >= 60) return 'Trippin';
  if (v >= 40) return 'Not that bad';
  if (v >= 20) return 'Steady chilling';
  return 'Vibes on vibes';
}

type Row = { rank: number; name: string | null; avatar: string | null; avg: number; me: boolean; bankrupt: boolean };
type Board = { top: Row[]; total: number; me: any; error?: string };

export function CalmBoard({ signedIn }: { signedIn: boolean }) {
  const [b, setB] = useState<Board | null>(null);
  useEffect(() => { if (signedIn) supabase.rpc('stress_board').then(({ data }) => setB(data as unknown as Board)); }, [signedIn]);
  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft mt-4">
      <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Calmest players</h3></div>
      <p className="text-xs text-muted-foreground mt-1">Who keeps Yungsta calmest over 14 days, never who is richest. You are ranked with players on the same story and chapter.</p>
      {!signedIn ? <p className="text-sm text-muted-foreground mt-3">Sign in and practise to join the ranking.</p>
        : !b || b.error ? <p className="text-sm text-muted-foreground mt-3">Loading…</p> : (
        <>
          {b.me?.ranked ? (
            <p className="text-sm mt-3 rounded-xl bg-accent p-3 text-foreground">You are #{b.me.rank} of {b.me.of} · {bandLabel(b.me.avg)}{b.me.calmer_than != null ? ` · calmer than ${b.me.calmer_than}%` : ''}</p>
          ) : b.me && (
            <p className="text-sm mt-3 rounded-xl bg-muted p-3 text-muted-foreground">To be ranked: play {b.me.need_days} days ({b.me.days} so far) and make {b.me.need_choices} choices ({b.me.choices} so far).</p>
          )}
          <ol className="mt-3 space-y-1.5">
            {b.top.length === 0 && <li className="text-sm text-muted-foreground">No one is ranked yet. Be the first!</li>}
            {b.top.map((r) => (
              <li key={r.rank + (r.name || '')} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 ${r.me ? 'bg-accent' : ''}`}>
                <span className="w-6 text-muted-foreground font-mono">{r.rank}</span>
                <span className="text-lg">{r.avatar || '🙂'}</span>
                <span className="flex-1 truncate text-foreground">{r.bankrupt ? 'Finished' : r.name || 'Player'}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{bandLabel(r.avg, r.bankrupt)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

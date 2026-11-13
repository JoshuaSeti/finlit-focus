import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, MessageCircleQuestion, Sparkles, AlertTriangle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { shareSessionWithSimulator } from '@/lib/modules';

type Pending = { events?: unknown[]; question?: unknown; blunders?: unknown[]; avatar?: string; yungsta?: string; neglect?: { active?: boolean; guided_today?: boolean } };
type Stress = { band?: string; stress?: number; name?: string };

const bandLabel: Record<string, string> = { calm: 'Calm', steady: 'Steady', tense: 'Tense', strained: 'Strained', overloaded: 'Overloaded', crisis: 'In crisis' };

export function YungstaCompanion({ signedIn }: { signedIn: boolean }) {
  const [p, setP] = useState<Pending | null>(null);
  const [s, setS] = useState<Stress | null>(null);
  const [cash, setCash] = useState<number | null>(null);
  const [named, setNamed] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          const { data: prof } = await supabase.from('sim_profiles').select('cash_balance,character_name').eq('id', u.user.id).maybeSingle();
          if (prof) { setCash(Number(prof.cash_balance)); setNamed(!!prof.character_name); }
        }
        const call = (fn: string) => (supabase.rpc as any).call(supabase, fn) as Promise<{ data: unknown }>;
        const [a, b] = await Promise.all([call('story_pending'), call('stress_status')]);
        setP((a.data as Pending) || null);
        setS((b.data as Stress) || null);
      } catch (e) {
        console.error('Yungsta load failed', e);
      }
    })();
  }, [signedIn]);

  const open = () => shareSessionWithSimulator();
  const tasks = (p?.events?.length || 0) + (p?.question ? 1 : 0) + (p?.blunders?.length || 0);
  const stress = Math.max(0, Math.min(100, Number(s?.stress ?? 0)));

  return (
    <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
      <div className="gradient-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-card/90 grid place-items-center text-3xl shadow-sm">{p?.avatar || '🧑🏾'}</div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider opacity-80">Your yungsta</div>
            <div className="text-lg font-bold truncate">{named ? (s?.name || p?.yungsta) : 'Not created yet'}</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">Sign in to raise a yungsta. Every lesson you finish becomes advice they act on.</p>
        ) : !named ? (
          <p className="text-sm text-muted-foreground">Create your yungsta, then guide their money decisions with what you learn here.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />Cash</div>
                <div className="font-bold text-foreground mt-1">K{(cash ?? 0).toLocaleString('en-ZM', { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <div className="text-xs text-muted-foreground">Mood</div>
                <div className="font-bold text-foreground mt-1">{bandLabel[s?.band || ''] || 'Calm'}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Money stress</span><span>{Math.round(stress)}/100</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${stress > 60 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${Math.max(4, stress)}%` }} />
              </div>
            </div>
            {tasks > 0 ? (
              <div className="rounded-xl border border-primary/40 bg-accent p-3 text-sm text-accent-foreground flex gap-2">
                {p?.blunders?.length ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> : p?.question ? <MessageCircleQuestion className="w-4 h-4 mt-0.5 shrink-0" /> : <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{p?.blunders?.length ? 'Your yungsta made mistakes while you were away. Help them learn from it.' : `${tasks} thing${tasks > 1 ? 's' : ''} waiting for your advice.`}</span>
              </div>
            ) : p?.neglect?.active && !p?.neglect?.guided_today ? (
              <p className="text-sm text-muted-foreground">Check in today so your yungsta doesn't make costly mistakes alone.</p>
            ) : (
              <p className="text-sm text-muted-foreground">All caught up. Finish a lesson to unlock new situations.</p>
            )}
          </>
        )}
        <a href={signedIn ? '/sim/index.html' : '/login'} onClick={signedIn ? open : undefined} className="block">
          <Button className="w-full"><Gamepad2 className="w-4 h-4 mr-2" />{!signedIn ? 'Sign in' : !named ? 'Create my yungsta' : tasks ? 'Give advice' : 'Visit my yungsta'}</Button>
        </a>
      </div>
    </motion.aside>
  );
}

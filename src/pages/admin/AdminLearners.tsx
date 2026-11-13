import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Coins, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Learner = {
  user_id: string; name: string; email: string; avatar: string | null; town: string | null; age: number | null; created_at: string;
  placement: { correct: number; total: number; start_group: string; at: string } | null;
  paid_at: string | null; started: number; completed: number; certs: number;
  streak: number | null; last_active: string | null;
};
type Detail = {
  modules: { slug: string; title: string | null; done: number; total: number; completed_at: string | null; quiz_correct: number | null; quiz_total: number | null; updated_at: string }[];
  sim: { character: string | null; cash: number; stress: number | null; band: string | null } | null;
  payments: { amount: number; phone: string; status: string; ref: string; at: string }[];
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'placed', label: 'Placement done' },
  { key: 'active', label: 'Active this week' },
];
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const isEmoji = (a?: string | null) => !!a && !a.startsWith('http') && a.length <= 8;

export default function AdminLearners() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') || 'all';
  const [rows, setRows] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Learner | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    supabase.rpc('admin_learners' as any).then(({ data }) => { setRows((data as Learner[]) || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!open) return;
    setDetail(null);
    supabase.rpc('admin_learner_detail' as any, { p_user: open.user_id }).then(({ data }) => setDetail(data as Detail));
  }, [open]);

  const list = useMemo(() => {
    const weekAgo = Date.now() - 7 * 864e5;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === 'paid' && !r.paid_at) return false;
      if (filter === 'placed' && !r.placement) return false;
      if (filter === 'active' && !(r.last_active && new Date(r.last_active).getTime() >= weekAgo)) return false;
      return !s || r.name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s);
    });
  }, [rows, q, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learners</h1>
        <p className="text-muted-foreground">Every learner account, their placement, payment and lesson progress.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setParams(f.key === 'all' ? {} : { filter: f.key })}
              className={cn('px-3 py-1.5 rounded-full text-sm border transition-colors',
                filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{loading ? 'Loading…' : `${list.length} of ${rows.length} learners`}</p>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left">
            <tr>
              <th className="p-3">Learner</th><th className="p-3">Age</th><th className="p-3">Joined</th><th className="p-3">Placement</th>
              <th className="p-3">Access</th><th className="p-3">Lessons</th><th className="p-3">Streak</th><th className="p-3">Last active</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.user_id} onClick={() => setOpen(r)} className="border-t border-border hover:bg-muted/40 cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {r.avatar?.startsWith('http') ? <img src={r.avatar} alt="" className="w-full h-full object-cover" /> : isEmoji(r.avatar) ? r.avatar : (r.name || '?')[0]}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{r.name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email}{r.town ? ` · ${r.town}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">{fmt(r.created_at)}</td>
                <td className="p-3">{r.age ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="p-3 whitespace-nowrap">{r.placement ? `${r.placement.correct}/${r.placement.total} · ${r.placement.start_group}` : <span className="text-muted-foreground">Not taken</span>}</td>
                <td className="p-3">{r.paid_at ? <Badge>Paid K20</Badge> : <Badge variant="secondary">Free starter</Badge>}</td>
                <td className="p-3 whitespace-nowrap">{r.completed}/{r.started} done{r.certs ? ` · ${r.certs} cert` : ''}</td>
                <td className="p-3 whitespace-nowrap"><span className="inline-flex items-center gap-1"><Coins size={14} className="text-primary" />{r.streak ?? 0}</span></td>
                <td className="p-3 whitespace-nowrap">{fmt(r.last_active)}</td>
              </tr>
            ))}
            {!loading && list.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No learners match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.name || 'Unnamed'}</SheetTitle>
                <p className="text-sm text-muted-foreground">{open.email} · joined {fmt(open.created_at)}</p>
              </SheetHeader>
              {!detail ? <p className="mt-6 text-muted-foreground">Loading…</p> : (
                <div className="mt-6 space-y-6 text-sm">
                  <section>
                    <h3 className="font-semibold text-foreground mb-2">Lessons</h3>
                    {detail.modules.length === 0 ? <p className="text-muted-foreground">No lessons started yet.</p> : (
                      <ul className="space-y-2">
                        {detail.modules.map((m) => {
                          const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
                          return (
                            <li key={m.slug} className="border border-border rounded-lg p-3">
                              <div className="flex justify-between gap-2">
                                <span className="font-medium text-foreground">{m.title || m.slug}</span>
                                <span className="text-muted-foreground">{m.completed_at ? `Done ${fmt(m.completed_at)}` : `${pct}%`}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full mt-2"><div className="h-full bg-primary rounded-full" style={{ width: `${m.completed_at ? 100 : pct}%` }} /></div>
                              {m.quiz_total ? <p className="text-xs text-muted-foreground mt-1">Quiz {m.quiz_correct}/{m.quiz_total}</p> : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                  <section>
                    <h3 className="font-semibold text-foreground mb-2">Yungsta simulator</h3>
                    {detail.sim ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="border border-border rounded-lg p-3"><div className="text-xs text-muted-foreground">Character</div>{detail.sim.character || '—'}</div>
                        <div className="border border-border rounded-lg p-3"><div className="text-xs text-muted-foreground">Cash</div>K{Number(detail.sim.cash).toLocaleString()}</div>
                        <div className="border border-border rounded-lg p-3"><div className="text-xs text-muted-foreground">Stress</div>{detail.sim.band || '—'}</div>
                      </div>
                    ) : <p className="text-muted-foreground">Hasn't played yet.</p>}
                  </section>
                  <section>
                    <h3 className="font-semibold text-foreground mb-2">Payments</h3>
                    {detail.payments.length === 0 ? <p className="text-muted-foreground">No payment attempts.</p> : (
                      <ul className="space-y-2">
                        {detail.payments.map((p) => (
                          <li key={p.ref} className="border border-border rounded-lg p-3 flex justify-between gap-2">
                            <div><div className="text-foreground">K{p.amount} · {p.phone}</div><div className="text-xs text-muted-foreground">{p.ref} · {fmt(p.at)}</div></div>
                            <Badge variant={p.status === 'successful' || p.status === 'success' ? 'default' : 'secondary'}>{p.status}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

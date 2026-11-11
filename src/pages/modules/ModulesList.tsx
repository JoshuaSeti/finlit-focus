import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { GROUPS, roadmap, loadLocal, saveLocal, type Scores, type GroupId } from '@/lib/placement';
import { CheckCircle2, BookOpen, Gamepad2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LearningModule, shareSessionWithSimulator } from '@/lib/modules';

type Prog = { module_slug: string; sections_done: number; sections_total: number; completed_at: string | null };

const ModulesList = () => {
  const { user } = useAuth();
  const [mods, setMods] = useState<LearningModule[]>([]);
  const [prog, setProg] = useState<Record<string, Prog>>({});
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Scores | null>(() => loadLocal()?.scores ?? null);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('learning_modules').select('*').eq('is_published', true).order('sort_order');
      setMods((data as LearningModule[]) || []);
      if (user) {
        const { data: p } = await supabase.from('module_progress').select('module_slug,sections_done,sections_total,completed_at').eq('user_id', user.id);
        const map: Record<string, Prog> = {};
        (p || []).forEach((r: any) => (map[r.module_slug] = r));
        setProg(map);
        const { data: pr } = await supabase.from('placement_results').select('scores,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (pr && pr[0]) { const sc = pr[0].scores as unknown as Scores; setScores(sc); saveLocal({ scores: sc, ts: Date.parse(pr[0].created_at) }); }
        else if (!loadLocal() && !params.get('skip')) { navigate('/diagnostic', { replace: true }); return; }
      } else if (!loadLocal() && !params.get('skip')) {
        navigate('/diagnostic', { replace: true }); return;
      }
      setLoading(false);
    })();
  }, [user]);

  const groups = useMemo(() => {
    const g: Record<string, LearningModule[]> = {};
    mods.forEach((m) => (g[m.category] = g[m.category] || []).push(m));
    const entries = Object.entries(g);
    if (!scores) return entries.map(([c, l]) => [c, l, null] as const);
    const r = roadmap(scores);
    const catOf = (gid: GroupId) => GROUPS[gid].category;
    const rank = (c: string) => { const i = r.order.findIndex((gid) => catOf(gid) === c); return i < 0 ? 100 : i; };
    return entries
      .sort((a, b) => rank(a[0]) - rank(b[0]))
      .map(([c, l]) => {
        const gid = r.order.find((x) => catOf(x) === c);
        const tag = !gid ? null : gid === r.start ? 'Start here' : r.strong.includes(gid) ? 'Review' : 'Learn next';
        return [c, l, tag] as const;
      });
  }, [mods, scores]);

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Lessons</h1>
            <p className="text-muted-foreground mt-2">Work through each module, earn your certificates and practise with your yungsta.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/diagnostic"><Button variant="outline"><Compass className="w-4 h-4 mr-2" />{scores ? 'Retake placement' : 'Placement test'}</Button></Link>
            {!user && <Link to="/login"><Button variant="outline">Sign in to save progress</Button></Link>}
            <a href="/sim/index.html" onClick={() => shareSessionWithSimulator()}>
              <Button><Gamepad2 className="w-4 h-4 mr-2" />My yungsta</Button>
            </a>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          groups.map(([cat, list, tag]) => (
            <div key={cat} className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">{cat}{tag && <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${tag === 'Start here' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{tag}</span>}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {list.map((m) => {
                  const p = prog[m.slug];
                  const pct = p && p.sections_total ? Math.round((p.sections_done / p.sections_total) * 100) : 0;
                  return (
                    <Link key={m.id} to={`/modules/${m.slug}`} className="block rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors">
                      <div className="flex items-start gap-3">
                        {p?.completed_at ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> : <BookOpen className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{m.title}</div>
                          {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                          {user && <Progress value={pct} className="h-1.5 mt-3" />}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </Layout>
  );
};

export default ModulesList;

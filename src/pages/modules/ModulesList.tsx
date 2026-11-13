import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Check, Play, Flag, Trophy, BookOpen, Lock } from 'lucide-react';
import { GROUPS, roadmap, freeSlug, loadLocal, saveLocal, type Scores, type GroupId } from '@/lib/placement';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LearningModule } from '@/lib/modules';
import { YungstaCompanion } from '@/components/learning/YungstaCompanion';
import { CoinStreak } from '@/components/learning/CoinStreak';
import { InstallPrompt } from '@/components/learning/InstallPrompt';
import { HowItWorks } from '@/components/learning/HowItWorks';
import { CalmBoard } from '@/components/learning/CalmBoard';
import { FriendsCircle } from '@/components/community/FriendsCircle';

type Prog = { module_slug: string; sections_done: number; sections_total: number; completed_at: string | null };
type Tag = 'Start here' | 'Learn next' | 'Review' | null;
type NodeState = 'done' | 'next' | 'progress' | 'upcoming';

const ModulesList = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [mods, setMods] = useState<LearningModule[]>([]);
  const [prog, setProg] = useState<Record<string, Prog>>({});
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [scores, setScores] = useState<Scores | null>(null);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const { data } = await supabase.from('learning_modules').select('*').eq('is_published', true).order('sort_order');
      setMods((data as LearningModule[]) || []);
      if (user) {
        const { data: p } = await supabase.from('module_progress').select('module_slug,sections_done,sections_total,completed_at').eq('user_id', user.id);
        const map: Record<string, Prog> = {};
        (p || []).forEach((r: any) => (map[r.module_slug] = r));
        setProg(map);
        const { data: acc } = await supabase.from('lesson_access').select('user_id').eq('user_id', user.id).maybeSingle();
        setPaid(!!acc);
        const { data: pr } = await supabase.from('placement_results').select('scores,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (pr && pr[0]) { const sc = pr[0].scores as unknown as Scores; setScores(sc); saveLocal({ scores: sc, ts: Date.parse(pr[0].created_at) }); }
        else if (!params.get('skip')) { navigate('/diagnostic', { replace: true }); return; }
      } else if (!params.get('skip')) {
        navigate('/diagnostic', { replace: true }); return;
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const groups = useMemo(() => {
    const g: Record<string, LearningModule[]> = {};
    mods.forEach((m) => (g[m.category] = g[m.category] || []).push(m));
    const entries = Object.entries(g);
    if (!scores) return entries.map(([c, l]) => ({ cat: c, list: l, tag: null as Tag }));
    const r = roadmap(scores);
    const catOf = (gid: GroupId) => GROUPS[gid].category;
    const rank = (c: string) => { const i = r.order.findIndex((gid) => catOf(gid) === c); return i < 0 ? 100 : i; };
    return entries
      .sort((a, b) => rank(a[0]) - rank(b[0]))
      .map(([c, l]) => {
        const gid = r.order.find((x) => catOf(x) === c);
        const tag: Tag = !gid ? null : gid === r.start ? 'Start here' : r.strong.includes(gid) ? 'Review' : 'Learn next';
        return { cat: c, list: l, tag };
      });
  }, [mods, scores]);

  // The first unfinished lesson along the personal path is "next".
  const nextSlug = useMemo(() => {
    for (const g of groups) { if (g.tag === 'Review') continue; for (const m of g.list) if (!prog[m.slug]?.completed_at) return m.slug; }
    for (const g of groups) for (const m of g.list) if (!prog[m.slug]?.completed_at) return m.slug;
    return null;
  }, [groups, prog]);

  const free = scores ? freeSlug(scores) : '';
  const isLocked = (slug: string) => !paid && slug !== free;
  const total = mods.length;
  const done = mods.filter((m) => prog[m.slug]?.completed_at).length;
  const pctAll = total ? Math.round((done / total) * 100) : 0;
  const nextMod = mods.find((m) => m.slug === nextSlug);

  const stateOf = (m: LearningModule): NodeState => {
    const p = prog[m.slug];
    if (p?.completed_at) return 'done';
    if (m.slug === nextSlug) return 'next';
    if (p && p.sections_done > 0) return 'progress';
    return 'upcoming';
  };

  let idx = 0;
  return (
    <Layout>
      {/* Header */}
      <section className="gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-10 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3" />
                <motion.circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="100 100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - pctAll }} transition={{ duration: 1 }} />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div><div className="text-2xl font-bold text-foreground">{pctAll}%</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">done</div></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-foreground/70 uppercase tracking-wider">Your learning path</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-1">{done === 0 ? 'Let’s get you started' : done === total ? 'Path complete!' : 'Keep the momentum going'}</h1>
              <p className="text-muted-foreground mt-2">{done} of {total} lessons finished{scores ? ' · ordered from your placement test' : ''}</p>
              <div className="flex flex-wrap gap-2 mt-5">
                {nextMod && (
                  <Link to={`/modules/${nextMod.slug}`} className="w-full sm:w-auto max-w-full"><Button size="lg" className="w-full sm:w-auto max-w-full h-auto min-h-11 py-3 whitespace-normal text-left justify-start"><Play className="w-4 h-4 mr-2 shrink-0" /><span className="min-w-0 break-words">Continue: {nextMod.title}</span></Button></Link>
                )}
                <Link to="/diagnostic" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="w-full sm:w-auto">{scores && !paid ? <Lock className="w-4 h-4 mr-2" /> : <Compass className="w-4 h-4 mr-2" />}{scores ? 'Retake placement' : 'Placement test'}</Button></Link>
                <HowItWorks defaultOpen />
                {user && <Link to="/account" className="w-full sm:w-auto"><Button size="lg" variant="ghost" className="w-full sm:w-auto">My account</Button></Link>}
                {!user && <Link to="/login" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="w-full sm:w-auto">Sign in to save progress</Button></Link>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-6xl grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          {loading ? (
            <p className="text-muted-foreground">Loading your path…</p>
          ) : (
            groups.map((g, gi) => {
              const gDone = g.list.filter((m) => prog[m.slug]?.completed_at).length;
              return (
                <motion.div key={g.cat} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.4 }} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground grid place-items-center font-bold">{gi + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground flex flex-wrap items-center gap-2">{g.cat}
                        {g.tag && <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${g.tag === 'Start here' ? 'bg-primary text-primary-foreground' : g.tag === 'Review' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'}`}>{g.tag}</span>}
                      </h2>
                      <p className="text-xs text-muted-foreground">{gDone}/{g.list.length} lessons</p>
                    </div>
                    {gDone === g.list.length && g.list.length > 0 && <Trophy className="w-5 h-5 text-primary" />}
                  </div>

                  <ol className="relative ml-5 border-l-2 border-dashed border-border space-y-4">
                    {g.list.map((m) => {
                      const st = stateOf(m);
                      const p = prog[m.slug];
                      const pct = p && p.sections_total ? Math.round((p.sections_done / p.sections_total) * 100) : 0;
                      const side = idx++ % 2 === 0;
                      return (
                        <li key={m.id} className="relative pl-8">
                          <span className={`absolute -left-[17px] top-4 w-8 h-8 rounded-full grid place-items-center border-4 border-background shadow-sm
                            ${st === 'done' ? 'bg-primary text-primary-foreground' : st === 'next' ? 'bg-primary text-primary-foreground ring-4 ring-primary/25 animate-pulse' : st === 'progress' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {st === 'done' ? <Check className="w-4 h-4" /> : st === 'next' ? <Play className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                          </span>
                          <Link to={`/modules/${m.slug}`}
                            className={`block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${side ? '' : 'md:ml-8'}
                              ${st === 'next' ? 'border-primary bg-card shadow-glow' : st === 'done' ? 'border-border bg-secondary/40' : 'border-border bg-card'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                {st === 'next' && <div className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground/70 mb-1 flex items-center gap-1"><Flag className="w-3 h-3" />Up next</div>}
                                <div className={`font-semibold ${st === 'done' ? 'text-muted-foreground' : 'text-foreground'}`}>{m.title}</div>
                                {m.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.description}</p>}
                              </div>
                              {st === 'done' ? <span className="text-xs font-medium text-secondary-foreground bg-secondary rounded-full px-2 py-0.5 shrink-0">Done</span>
                                : !paid && m.slug === free ? <span className="text-xs font-semibold text-primary-foreground bg-primary rounded-full px-2 py-0.5 shrink-0">Free lesson</span>
                                : isLocked(m.slug) ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" aria-label="Locked" /> : null}
                            </div>
                            {user && st !== 'done' && pct > 0 && (
                              <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </motion.div>
              );
            })
          )}
        </div>
        <div className="lg:sticky lg:top-24 h-fit order-first lg:order-none">
          <CoinStreak signedIn={!!user} />
          <InstallPrompt />
          <YungstaCompanion signedIn={!!user} />
          <CalmBoard signedIn={!!user} />
          {user && <FriendsCircle userId={user.id} />}
        </div>
      </section>
    </Layout>
  );
};

export default ModulesList;

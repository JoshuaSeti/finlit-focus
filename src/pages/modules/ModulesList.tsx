import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLearnerGreeting, Gender, GreetingTone } from '@/lib/greetings';
import { 
  Compass, 
  Check, 
  Play, 
  Trophy, 
  Lock, 
  Clock, 
  ArrowRight, 
  User, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { GROUPS, roadmap, freeSlug, saveLocal, type Scores, type GroupId } from '@/lib/placement';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LearningModule } from '@/lib/modules';
import { getAccess } from '@/lib/access';
import { YungstaCompanion } from '@/components/learning/YungstaCompanion';
import { CoinStreak } from '@/components/learning/CoinStreak';
import { InstallPrompt } from '@/components/learning/InstallPrompt';
import { HowItWorks } from '@/components/learning/HowItWorks';
import { CalmBoard } from '@/components/learning/CalmBoard';
import { FriendsCircle } from '@/components/community/FriendsCircle';

type ModuleWithCover = LearningModule & { cover_image_url?: string | null };
type Prog = { module_slug: string; sections_done: number; sections_total: number; completed_at: string | null };
type Tag = 'Start here' | 'Learn next' | 'Review' | null;
type NodeState = 'done' | 'next' | 'progress' | 'upcoming';

// Thematic Apple Music-inspired playlist gradient palettes by level
const THEME_GRADIENTS: Record<string, { bg: string; accent: string; code: string }> = {
  'Foundations': {
    bg: 'from-emerald-900 via-teal-950 to-slate-950',
    accent: 'text-emerald-400',
    code: '00',
  },
  'Level 1': {
    bg: 'from-amber-900 via-stone-900 to-zinc-950',
    accent: 'text-amber-400',
    code: '01',
  },
  'Level 2': {
    bg: 'from-blue-950 via-slate-900 to-neutral-950',
    accent: 'text-blue-400',
    code: '02',
  },
  'Level 3': {
    bg: 'from-teal-950 via-cyan-950 to-slate-950',
    accent: 'text-teal-300',
    code: '03',
  },
  'Level 4': {
    bg: 'from-purple-950 via-neutral-950 to-stone-950',
    accent: 'text-purple-300',
    code: '04',
  },
};

export default function ModulesList() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [mods, setMods] = useState<ModuleWithCover[]>([]);
  const [prog, setProg] = useState<Record<string, Prog>>({});
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [gender, setGender] = useState<Gender>(null);
  const [greetingTone, setGreetingTone] = useState<GreetingTone>('friendly');

  const greetingData = useMemo(() => {
    return getLearnerGreeting(userName, gender, greetingTone);
  }, [userName, gender, greetingTone]);
  const [params] = useSearchParams();

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      const { data } = await supabase
        .from('learning_modules')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      setMods((data as ModuleWithCover[]) || []);

      if (user) {
        const initialName = (user.user_metadata?.full_name || user.user_metadata?.name || '').trim();
        if (initialName) setUserName(initialName.split(' ')[0]);

        supabase
          .from('profiles')
          .select('display_name, full_name, gender, greeting_tone')
          .eq('user_id', user.id)
          .maybeSingle()
          .then(({ data }: any) => {
            const raw = data?.display_name || data?.full_name || initialName;
            if (raw) setUserName(raw.trim().split(' ')[0]);
            if (data?.gender) setGender(data.gender);
            if (data?.greeting_tone) setGreetingTone(data.greeting_tone);
          });

        const { data: p } = await supabase
          .from('module_progress')
          .select('module_slug,sections_done,sections_total,completed_at')
          .eq('user_id', user.id);
        const map: Record<string, Prog> = {};
        (p || []).forEach((r: any) => (map[r.module_slug] = r));
        setProg(map);

        const acc = await getAccess(user.id);
        setPaid(acc.paid);
        setDaysRemaining(acc.paid ? acc.daysRemaining : 0);

        const { data: pr } = await supabase
          .from('placement_results')
          .select('scores,created_at')
          .eq('user_id', user.id)
          .eq('server_scored', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (pr && pr[0]) {
          const sc = pr[0].scores as unknown as Scores;
          setScores(sc);
          saveLocal({ scores: sc, ts: Date.parse(pr[0].created_at) });
        } else if (!params.get('skip')) {
          navigate('/diagnostic', { replace: true });
          return;
        }
      } else if (!params.get('skip')) {
        navigate('/diagnostic', { replace: true });
        return;
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const groups = useMemo(() => {
    const g: Record<string, ModuleWithCover[]> = {};
    mods.forEach((m) => (g[m.category] = g[m.category] || []).push(m));
    const entries = Object.entries(g);
    if (!scores) return entries.map(([c, l]) => ({ cat: c, list: l, tag: null as Tag }));
    const r = roadmap(scores);
    const catOf = (gid: GroupId) => GROUPS[gid].category;
    const rank = (c: string) => {
      const i = r.order.findIndex((gid) => catOf(gid) === c);
      return i < 0 ? 100 : i;
    };
    return entries
      .sort((a, b) => rank(a[0]) - rank(b[0]))
      .map(([c, l]) => {
        const gid = r.order.find((x) => catOf(x) === c);
        const tag: Tag = !gid ? null : gid === r.start ? 'Start here' : r.strong.includes(gid) ? 'Review' : 'Learn next';
        return { cat: c, list: l, tag };
      });
  }, [mods, scores]);

  // First unfinished lesson along personal path
  const nextSlug = useMemo(() => {
    for (const g of groups) {
      if (g.tag === 'Review') continue;
      for (const m of g.list) if (!prog[m.slug]?.completed_at) return m.slug;
    }
    for (const g of groups) {
      for (const m of g.list) if (!prog[m.slug]?.completed_at) return m.slug;
    }
    return null;
  }, [groups, prog]);

  const free = scores ? freeSlug(scores) : '';
  const isLocked = (slug: string) => !isAdmin && !paid && slug !== free;
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

  // Helper to extract a display lesson code like "0a", "1.2", or fallback to index
  const getLessonTag = (slug: string, idx: number) => {
    const match = slug.match(/module-(.*)/);
    return match ? match[1].toUpperCase() : String(idx + 1).padStart(2, '0');
  };

  return (
    <Layout>
      {/* Editorial Header */}
      <section className="border-b border-border bg-gradient-to-b from-card via-background to-background">
        <div className="container mx-auto px-4 pt-10 pb-8 max-w-6xl">
          {/* Top Status & Utility Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
                <Compass className="w-3.5 h-3.5 text-primary" />
                {scores ? 'Diagnostic sequence' : 'Core syllabus'}
              </span>
              <span className="text-xs text-muted-foreground">
                {done} of {total} completed ({pctAll}%)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <HowItWorks />
              <Link to="/diagnostic">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                  {scores && !paid ? <Lock className="w-3.5 h-3.5 mr-1.5" /> : <Compass className="w-3.5 h-3.5 mr-1.5" />}
                  {scores ? 'Retake Placement' : 'Placement Test'}
                </Button>
              </Link>
              {user ? (
                <Link to="/account">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    Account
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    Sign in to save
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Hero Content: Personalized Greeting & Spotlight */}
          <div className="pt-8 grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                FinLit Path
              </p>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                {user && userName ? (
                  <>
                    {greetingData.headlinePrefix}, <span className="text-primary">{greetingData.learnerName}</span>{greetingData.punctuation}
                    <span className="block text-2xl md:text-3xl font-semibold text-muted-foreground mt-1">
                      {done === 0 
                        ? 'Welcome to your path.' 
                        : done === total 
                        ? 'You have finished every lesson!' 
                        : greetingData.subtitle}
                    </span>
                  </>
                ) : (
                  <>
                    {done === 0 ? 'Start your journey.' : done === total ? 'Path complete!' : 'Keep your momentum.'}
                  </>
                )}
              </h1>

              <p className="text-muted-foreground text-sm md:text-base max-w-lg leading-relaxed">
                {done === 0
                  ? 'Practical financial literacy built for you. Learn real money principles, then guide Yungsta with what you discover.'
                  : `You’ve completed ${done} of ${total} lessons. Pick up right here to keep your streak and sharpen your money decisions.`}
              </p>

              {/* Overall Progress Meter */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs text-muted-foreground font-medium mb-1.5">
                  <span>Journey Progress</span>
                  <span>{pctAll}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pctAll}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Spotlight Card: Immediate Next Action */}
            <div className="lg:col-span-6">
              {nextMod ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative group rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8 shadow-xl shadow-primary/5 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                      <Play className="w-3 h-3 fill-current" /> Up Next
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> ~ 10 min
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {nextMod.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {nextMod.description || 'Master this module to unlock practical insights and guide Yungsta in the simulator.'}
                  </p>

                  <div className="mt-6 flex items-center justify-end pt-4 border-t border-border/60">
                    <Link to={`/modules/${nextMod.slug}`}>
                      <Button size="lg" className="rounded-full font-semibold px-6 shadow-md hover:shadow-lg gap-2">
                        Resume Lesson <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="rounded-3xl border border-border bg-card p-6 md:p-8 text-center space-y-3">
                  <Trophy className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-lg font-bold text-foreground">You finished all available lessons!</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Review completed modules or jump into the simulator to test your financial instincts with Yungsta.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Path & Sidebar */}
      <section className="container mx-auto px-4 py-12 max-w-6xl grid lg:grid-cols-[1fr_340px] gap-12">
        {/* Course Modules List (Always first on mobile) */}
        <div className="space-y-12">
          {/* Renewal Reminder Card when within 7 days of expiry */}
          {user && paid && daysRemaining !== null && daysRemaining <= 7 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <span>⏳</span>
                  <span>{daysRemaining === 0 ? 'Subscription expires today' : `${daysRemaining} days remaining`}</span>
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Renew early to keep your full access. <strong>30 days will be added on top of whatever days you have left!</strong>
                </p>
              </div>
              <Link to="/diagnostic">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 rounded-full px-5 shadow-sm">
                  Renew K20 (+30 Days)
                </Button>
              </Link>
            </motion.div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="h-64 bg-muted/60 animate-pulse rounded-3xl" />
              <div className="h-64 bg-muted/60 animate-pulse rounded-3xl" />
              <div className="h-64 bg-muted/60 animate-pulse rounded-3xl" />
              <div className="h-64 bg-muted/60 animate-pulse rounded-3xl" />
            </div>
          ) : (
            groups.map((g, gi) => {
              const gDone = g.list.filter((m) => prog[m.slug]?.completed_at).length;
              const isChapterComplete = gDone === g.list.length && g.list.length > 0;
              const theme = THEME_GRADIENTS[g.cat] || THEME_GRADIENTS['Foundations'];

              return (
                <div key={g.cat} className="space-y-5">
                  {/* Thematic Chapter / Series Header */}
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold text-xs grid place-items-center">
                        0{gi + 1}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          {g.cat}
                          {g.tag && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5 ${
                              g.tag === 'Start here' ? 'bg-primary text-primary-foreground' : 
                              g.tag === 'Review' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'
                            }`}>
                              {g.tag}
                            </span>
                          )}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      {isChapterComplete ? (
                        <span className="flex items-center gap-1 text-primary font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Series Done
                        </span>
                      ) : (
                        <span>{gDone} / {g.list.length} completed</span>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Apple-Designed Editorial Cards Grid */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    {g.list.map((m, mIdx) => {
                      const st = stateOf(m);
                      const p = prog[m.slug];
                      const pct = p && p.sections_total ? Math.round((p.sections_done / p.sections_total) * 100) : 0;
                      const locked = isLocked(m.slug);
                      const lessonCode = getLessonTag(m.slug, mIdx);

                      return (
                        <Link
                          key={m.id}
                          to={`/modules/${m.slug}`}
                          className={`group flex flex-col justify-between rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                            st === 'next'
                              ? 'border-primary/50 bg-card shadow-md ring-1 ring-primary/20'
                              : st === 'done'
                              ? 'border-border/80 bg-card/60 hover:bg-card'
                              : 'border-border bg-card hover:border-border/80'
                          }`}
                        >
                        {/* 2-Column Apple-Designed Editorial Cards Grid */}
<div className="grid sm:grid-cols-2 gap-6">
  {g.list.map((m, mIdx) => {
    const st = stateOf(m);
    const p = prog[m.slug];
    const pct = p && p.sections_total ? Math.round((p.sections_done / p.sections_total) * 100) : 0;
    const locked = isLocked(m.slug);
    const lessonCode = getLessonTag(m.slug, mIdx);

    return (
      <Link
        key={m.id}
        to={`/modules/${m.slug}`}
        className={`group flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card ${
          st === 'next'
            ? 'border-primary/50 shadow-md ring-1 ring-primary/25'
            : st === 'done'
            ? 'border-border/80 bg-card/60 hover:bg-card'
            : 'border-border hover:border-border/90'
        }`}
      >
        {/* Apple Music Editorial Cover Artwork */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-950 select-none">
          {/* Background: Cover Image OR Curated Thematic Gradient */}
          {m.cover_image_url ? (
            <img 
              src={m.cover_image_url} 
              alt={m.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${theme.bg}`} />
          )}

          {/* Editorial Scrim Overlay for high legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

          {/* Background Ghost Lesson Numeral */}
          <span className="absolute right-3.5 bottom-1 text-7xl sm:text-8xl font-black text-white/[0.08] tracking-tighter pointer-events-none select-none font-mono">
            {lessonCode}
          </span>

          {/* Content Layer directly on the cover artwork */}
          <div className="relative z-10 p-5 h-full flex flex-col justify-between">
            {/* Top Bar: Category Pill & Status Tag */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-md bg-black/40 px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                {g.cat}
              </span>

              <div>
                {st === 'done' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white backdrop-blur-md bg-emerald-600/90 border border-emerald-400/30 px-2.5 py-0.5 rounded-full shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" /> Done
                  </span>
                ) : !paid && m.slug === free ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white backdrop-blur-md bg-primary/90 border border-primary/30 px-2.5 py-0.5 rounded-full shadow-sm">
                    <Sparkles className="w-3 h-3" /> Free Starter
                  </span>
                ) : locked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/90 backdrop-blur-md bg-black/60 border border-white/15 px-2.5 py-0.5 rounded-full shadow-sm">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                ) : st === 'next' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-foreground backdrop-blur-md bg-primary px-2.5 py-0.5 rounded-full shadow-sm">
                    Resume
                  </span>
                ) : st === 'progress' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white backdrop-blur-md bg-white/20 border border-white/15 px-2.5 py-0.5 rounded-full shadow-sm">
                    {pct}%
                  </span>
                ) : null}
              </div>
            </div>

            {/* Bottom: Lesson Code and Module Name displayed directly on the cover */}
            <div className="space-y-1">
              <span className={`text-[11px] font-mono font-semibold ${theme.accent} tracking-wider uppercase block drop-shadow-sm`}>
                Lesson {lessonCode}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight line-clamp-2 drop-shadow-sm group-hover:text-primary-foreground/90 transition-colors">
                {m.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Bottom Card Footer: Clean Metadata & Actions */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {m.description || 'Master practical concepts and put decisions into practice.'}
          </p>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> ~ 10 min
            </span>

            <span className="inline-flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
              {st === 'done' ? 'Review lesson' : st === 'next' ? 'Continue' : locked ? 'Unlock' : 'Start'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    );
  })}
</div>


                            {/* Card Footer Row */}
                            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-3.5 h-3.5" /> ~ 10 min
                              </span>

                              <div className="flex items-center gap-1.5 font-medium group-hover:text-foreground transition-colors">
                                {st === 'done' ? (
                                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                                    Review <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold flex items-center gap-1">
                                    Start <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress bar for partially completed lessons */}
                          {user && st !== 'done' && pct > 0 && (
                            <div className="h-1 bg-muted w-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Sticky Rail / Mobile Companion */}
        <aside className="space-y-6 lg:sticky lg:top-24 h-fit">
          <CoinStreak signedIn={!!user} />
          <InstallPrompt />
          <YungstaCompanion signedIn={!!user} />
          <CalmBoard signedIn={!!user} />
          {user && <FriendsCircle userId={user.id} />}
        </aside>
      </section>
    </Layout>
  );
}

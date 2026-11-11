import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Clock, HelpCircle, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GROUPS, ORDER, QUESTIONS, roadmap, saveLocal, loadLocal, type Scores } from '@/lib/placement';

const shuffle = <T,>(a: T[]) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const empty = (): Scores => Object.fromEntries(ORDER.map((g) => [g, { c: 0, t: 0 }])) as Scores;

const Diagnostic = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<'intro' | 'quiz' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Scores>(empty);
  const [picked, setPicked] = useState<number | null>(null);
  const hadPrev = useMemo(() => !!loadLocal(), []);

  const q = QUESTIONS[idx];
  const opts = useMemo(() => q ? shuffle(q.o.map((t, i) => ({ t, ok: i === 0 }))) : [], [idx]); // eslint-disable-line

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const next = { ...scores, [q.g]: { c: scores[q.g].c + (i >= 0 && opts[i].ok ? 1 : 0), t: scores[q.g].t + 1 } };
    setScores(next);
    setTimeout(async () => {
      setPicked(null);
      if (idx + 1 < QUESTIONS.length) return setIdx(idx + 1);
      saveLocal({ scores: next, ts: Date.now() });
      if (user) {
        const r = roadmap(next);
        const correct = ORDER.reduce((a, g) => a + next[g].c, 0);
        await supabase.from('placement_results').insert({ user_id: user.id, scores: next as any, start_group: r.start, correct, total: QUESTIONS.length });
      }
      setStage('done');
    }, 220);
  };

  const r = roadmap(scores);
  const correct = ORDER.reduce((a, g) => a + scores[g].c, 0);
  const start = GROUPS[r.start];

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 max-w-xl">
        {stage === 'intro' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><Compass className="w-8 h-8 text-primary" /></div>
            <h1 className="text-3xl font-bold text-foreground">Find your starting point</h1>
            <p className="text-muted-foreground mt-3">15 questions on money in Zambia. Your answers decide where your path begins.</p>
            <ul className="text-left rounded-xl border border-border bg-card p-5 mt-8 space-y-3 text-sm">
              <li className="flex gap-3"><Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />About 3 minutes. No marks, no pressure.</li>
              <li className="flex gap-3"><HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />Not sure? Tap "I don't know". That tells us where to start you.</li>
              <li className="flex gap-3"><Compass className="w-4 h-4 text-primary mt-0.5 shrink-0" />Topics you already know move to the end of your path as review.</li>
            </ul>
            <Button size="lg" className="w-full mt-6" onClick={() => { setScores(empty()); setIdx(0); setStage('quiz'); }}>{hadPrev ? 'Retake the test' : 'Start'}</Button>
            {hadPrev ? <p className="text-xs text-muted-foreground mt-3">Retaking replaces your current path.</p>
              : <button className="text-xs text-muted-foreground mt-4 underline" onClick={() => navigate('/modules?skip=1')}>Skip for now</button>}
          </motion.div>
        )}

        {stage === 'quiz' && q && (
          <div>
            <div className="text-xs font-semibold tracking-widest text-muted-foreground mb-2">{idx + 1} OF {QUESTIONS.length}</div>
            <Progress value={(idx / QUESTIONS.length) * 100} className="h-2 mb-8" />
            <motion.h2 key={idx} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="text-xl font-semibold text-foreground mb-6">{q.q}</motion.h2>
            <div className="space-y-3">
              {opts.map((o, i) => (
                <button key={i} onClick={() => answer(i)} className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${picked === i ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'}`}>{o.t}</button>
              ))}
              <button onClick={() => answer(-1)} className={`w-full text-left rounded-xl border-2 border-dashed p-4 text-muted-foreground ${picked === -1 ? 'border-primary' : 'border-border'}`}>I don't know</button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-2xl bg-primary text-primary-foreground p-6">
              <div className="text-xs uppercase tracking-widest opacity-80">Your starting point</div>
              <h2 className="text-2xl font-bold mt-1">{r.allStrong ? 'You know this well' : r.start === 'group-0' ? 'Start from the foundations' : `Skip ahead to Phase ${start.n}`}</h2>
              <p className="opacity-90 mt-2 text-sm">{r.allStrong ? 'You got most of every phase right. Start with Phase 04 and use the others as review.' : `You scored ${correct} of ${QUESTIONS.length}. Your path starts where you have the most to gain${r.strong.length ? ', and topics you already know come last as review.' : '.'}`}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 mt-5">
              <div className="text-sm font-semibold text-foreground mb-3">Up first</div>
              <div className="flex items-center gap-3"><span className="text-2xl">{start.icon}</span><div><div className="font-medium">{start.mod}</div><div className="text-xs text-muted-foreground">Phase {start.n} · {start.name}</div></div></div>
              <Button className="w-full mt-4" onClick={() => navigate(`/modules/${start.slug}`)}>Start learning <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 mt-5 space-y-4">
              <div className="text-sm font-semibold text-foreground">How you did</div>
              {ORDER.map((g) => {
                const s = scores[g]; const strong = r.strong.includes(g);
                return (
                  <div key={g}>
                    <div className="flex justify-between text-sm"><span>Phase {GROUPS[g].n} · {GROUPS[g].name}</span><span className="text-muted-foreground">{s.c}/{s.t}</span></div>
                    <Progress value={s.t ? (s.c / s.t) * 100 : 0} className="h-1.5 mt-1.5" />
                    <span className={`text-xs mt-1 inline-block ${g === r.start ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{g === r.start ? 'Start here' : strong ? 'Strong. Review later' : 'Learn next'}</span>
                  </div>
                );
              })}
            </div>
            {!user && <p className="text-xs text-muted-foreground text-center mt-4"><Link to="/login" className="underline">Sign in</Link> to keep your path on any device.</p>}
            <Link to="/modules"><Button variant="outline" className="w-full mt-4">See my full path</Button></Link>
          </motion.div>
        )}
      </section>
    </Layout>
  );
};
export default Diagnostic;

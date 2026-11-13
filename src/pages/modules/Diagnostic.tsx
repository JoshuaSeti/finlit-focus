import { useEffect, useMemo, useState } from 'react';
import Paywall from '@/components/learning/Paywall';
import { getAccess } from '@/lib/access';
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
  const [stage, setStage] = useState<'intro' | 'age' | 'quiz' | 'done'>('intro');
  const [age, setAge] = useState('');
  const ageNum = parseInt(age, 10);
  const ageOk = ageNum >= 5 && ageNum <= 120;
  const submitAge = async () => {
    if (!ageOk || !user) return;
    await supabase.from('profiles').update({ age: ageNum }).eq('user_id', user.id);
    setScores(empty()); setIdx(0); setStage('quiz');
  };
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Scores>(empty);
  const [picked, setPicked] = useState<number | null>(null);
  const [hadPrev, setHadPrev] = useState(false);
  const [paid, setPaid] = useState(false);
  useEffect(() => { if (stage !== 'intro') return; if (!user) return; getAccess(user.id).then((a) => { setPaid(a.paid); setHadPrev(!!a.scores); }); supabase.from('profiles').select('age').eq('user_id', user.id).maybeSingle().then(({ data }) => { if (data?.age) setAge(String(data.age)); }); }, [user?.id]); // eslint-disable-line
  const retakeLocked = hadPrev && !paid && stage === 'intro';

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
        import('@/lib/streak').then((m) => m.touchStreak());
      }
      setStage('done');
    }, 220);
  };

  const r = roadmap(scores);
  const start = GROUPS[r.start];

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 max-w-xl">
        {!user && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><Compass className="w-8 h-8 text-primary" /></div>
            <h1 className="text-3xl font-bold text-foreground">Find your starting point</h1>
            <p className="text-muted-foreground mt-3">Create a free account to take your placement test, save your path and open your free lesson.</p>
            <Button size="lg" className="w-full mt-6" onClick={() => navigate('/login?next=/diagnostic')}>Create free account</Button>
            <button className="text-sm text-primary mt-4 underline" onClick={() => navigate('/login?next=/diagnostic&mode=signin')}>I already have an account</button>
          </div>
        )}
        {user && retakeLocked && (
          <div className="flex flex-col">
            <Paywall signedIn={!!user} title="Retake your placement test" note="Your path is ready. Unlock full access to retake the test and open every lesson." onUnlocked={() => setPaid(true)} />
            <Link to="/modules" className="text-sm text-center text-muted-foreground underline">Back to my lessons</Link>
          </div>
        )}
        {user && stage === 'intro' && !retakeLocked && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5"><Compass className="w-8 h-8 text-primary" /></div>
            <h1 className="text-3xl font-bold text-foreground">Find your starting point</h1>
            <p className="text-muted-foreground mt-3">15 questions on money in Zambia. Your answers decide where your path begins.</p>
            <ul className="text-left rounded-xl border border-border bg-card p-5 mt-8 space-y-3 text-sm">
              <li className="flex gap-3"><Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />About 3 minutes. No marks, no pressure.</li>
              <li className="flex gap-3"><HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />Not sure? Tap "I don't know". That tells us where to start you.</li>
              <li className="flex gap-3"><Compass className="w-4 h-4 text-primary mt-0.5 shrink-0" />This isn't a pass or fail test. Everyone goes through every lesson. It only picks where you start.</li>
            </ul>
            <Button size="lg" className="w-full mt-6" onClick={() => setStage('age')}>{hadPrev ? 'Retake the test' : 'Start'}</Button>
            {hadPrev ? <p className="text-xs text-muted-foreground mt-3">Retaking replaces your current path.</p>
              : <button className="text-xs text-muted-foreground mt-4 underline" onClick={() => navigate('/modules?skip=1')}>Skip for now</button>}
          </motion.div>
        )}

        {user && stage === 'age' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-2xl font-bold text-foreground">How old are you?</h1>
            <p className="text-muted-foreground mt-2 text-sm">This helps us shape lessons for people like you.</p>
            <form onSubmit={(e) => { e.preventDefault(); submitAge(); }}>
              <input type="number" inputMode="numeric" min={5} max={120} autoFocus value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 24" aria-label="Your age" className="mt-6 w-40 mx-auto block text-center text-3xl font-bold rounded-xl border-2 border-border bg-card p-4 focus:border-primary outline-none" />
              {age && !ageOk && <p className="text-xs text-destructive mt-2">Please enter an age between 5 and 120.</p>}
              <Button type="submit" size="lg" className="w-full mt-6" disabled={!ageOk}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </form>
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
              <div className="text-xs uppercase tracking-widest opacity-80">Your recommended starting point</div>
              <h2 className="text-2xl font-bold mt-1">Phase {start.n} · {start.name}</h2>
              <p className="opacity-90 mt-2 text-sm">Every FinLit learner goes through the full course, every phase and every lesson. Your answers only decide where you begin, so you start where you have the most to gain.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 mt-5">
              <div className="text-sm font-semibold text-foreground mb-3">Start here</div>
              <div className="flex items-center gap-3"><span className="text-2xl">{start.icon}</span><div><div className="font-medium">{start.mod}</div><div className="text-xs text-muted-foreground">Phase {start.n} · {start.name}</div></div></div>
              <Button className="w-full mt-4" onClick={() => navigate(`/modules/${start.slug}`)}>Start learning <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 mt-5">
              <div className="text-sm font-semibold text-foreground mb-1">Your full path</div>
              <p className="text-xs text-muted-foreground mb-4">You'll complete all of these. The order is set for you.</p>
              <ol className="space-y-3">
                {r.order.map((g, i) => (
                  <li key={g} className="flex items-center gap-3 text-sm">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                    <span className="flex-1">{GROUPS[g].icon} Phase {GROUPS[g].n} · {GROUPS[g].name}</span>
                    <span className={`text-xs ${i === 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{i === 0 ? 'Start here' : i === 1 ? 'Up next' : 'On your path'}</span>
                  </li>
                ))}
              </ol>
            </div>
            <Link to="/modules"><Button variant="outline" className="w-full mt-4">See my full path</Button></Link>
          </motion.div>
        )}
      </section>
    </Layout>
  );
};
export default Diagnostic;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Gamepad2, 
  Wallet, 
  TrendingUp,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Paywall from '@/components/learning/Paywall';
import { getAccess } from '@/lib/access';
import { enablePush, pushSupported } from '@/lib/push';
import {
  GROUPS,
  ORDER,
  SITUATIONS,
  SCENARIO_QUESTIONS,
  REALITY_QUESTIONS,
  TRAIT_DEFS,
  roadmap,
  saveLocal,
  computeCharacterResult,
  type Situation,
  type TraitKey,
  type Scores,
  type CharacterResult
} from '@/lib/placement';

const emptyScores = (): Scores => Object.fromEntries(ORDER.map((g) => [g, { c: 0, t: 0 }])) as Scores;

const Diagnostic = () => {
 const { user, isAdmin } = useAuth();

  const navigate = useNavigate();

  // Stages: intro -> age -> situation (Part A) -> scenarios (Part B) -> reality (Part C) -> done
  const [stage, setStage] = useState<'intro' | 'age' | 'situation' | 'scenarios' | 'reality' | 'done'>('intro');
  const [age, setAge] = useState('');
  const ageNum = parseInt(age, 10);
  const ageOk = ageNum >= 5 && ageNum <= 120;

  // State tracking
  const [situation, setSituation] = useState<Situation>(SITUATIONS[0]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [realityIdx, setRealityIdx] = useState(0);
  const [pickedOpt, setPickedOpt] = useState<number | null>(null);

  // Traits and Debt flags
  const [rawTraits, setRawTraits] = useState<Record<TraitKey, number>>({
    IMP: 0, GEN: 0, SCM: 0, RSK: 0, PLN: 0, SAV: 0
  });
  const [hasDebtFlag, setHasDebtFlag] = useState(false);

  // Q4 Allocation State (Total = 100%)
  const [allocations, setAllocations] = useState({
    savings: 20,
    family: 20,
    wants: 20,
    investing: 20,
    debts: 20
  });

  // RPC 15 answers array
  const [rpcAnswers, setRpcAnswers] = useState<number[]>([]);
  const [groupScores, setGroupScores] = useState<Scores>(emptyScores());
  const [characterResult, setCharacterResult] = useState<CharacterResult | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [hadPrev, setHadPrev] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!user) return;
    getAccess(user.id).then((a) => {
      setPaid(a.paid);
      setHadPrev(!!a.scores);
    });
    supabase.from('profiles').select('age').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      if (data?.age) setAge(String(data.age));
    });
  }, [user?.id]);

 const retakeLocked = !isAdmin && hadPrev && !paid && stage === 'intro';


  // 1. Submit Age
  const submitAge = async () => {
    if (!ageOk || !user) return;
    await supabase.from('profiles').update({ age: ageNum }).eq('user_id', user.id);
    setStage('situation');
  };

  // 2. Select Life Situation (Part A)
  const chooseSituation = (s: Situation) => {
    setSituation(s);
    setStage('scenarios');
    setScenarioIdx(0);
  };

  // Q4 handler
  const submitQ4Allocation = () => {
    const total = allocations.savings + allocations.family + allocations.wants + allocations.investing + allocations.debts;
    if (total !== 100) return;

    const savPoints = Math.min(3, Math.floor(allocations.savings / 10));
    const genPoints = Math.min(3, Math.floor(allocations.family / 10));
    const impPoints = Math.min(3, Math.floor(allocations.wants / 10));
    const rskPoints = Math.min(3, Math.floor(allocations.investing / 10));
    const plnBonus = (allocations.savings + allocations.debts) >= 40 ? 2 : 0;

    setRawTraits(prev => ({
      ...prev,
      SAV: prev.SAV + savPoints,
      GEN: prev.GEN + genPoints,
      IMP: prev.IMP + impPoints,
      RSK: prev.RSK + rskPoints,
      PLN: prev.PLN + plnBonus,
    }));

    // Record RPC answer: prudent if savings + debts >= 40%
    setRpcAnswers(prev => [...prev, plnBonus > 0 ? 0 : 1]);
    setScenarioIdx(prev => prev + 1);
  };

  // Answer standard scenario question (Part B)
  const answerScenario = (optIdx: number) => {
    if (pickedOpt !== null || saving) return;
    setPickedOpt(optIdx);

    const q = SCENARIO_QUESTIONS[scenarioIdx];
    const opt = q.options[optIdx];

    if (opt.points) {
      setRawTraits(prev => {
        const next = { ...prev };
        Object.entries(opt.points!).forEach(([k, v]) => {
          next[k as TraitKey] = (next[k as TraitKey] || 0) + (v || 0);
        });
        return next;
      });
    }

    if (opt.flagDebt) setHasDebtFlag(true);

    const nextRpc = [...rpcAnswers, opt.rpcValue];
    setRpcAnswers(nextRpc);

    setTimeout(() => {
      setPickedOpt(null);
      if (scenarioIdx + 1 < SCENARIO_QUESTIONS.length) {
        setScenarioIdx(prev => prev + 1);
      } else {
        setStage('reality');
        setRealityIdx(0);
      }
    }, 220);
  };

  // Answer reality question (Part C - Doubled points)
  const answerReality = async (optIdx: number) => {
    if (pickedOpt !== null || saving) return;
    setPickedOpt(optIdx);

    const q = REALITY_QUESTIONS[realityIdx];
    const opt = q.options[optIdx];

    let currentTraits = { ...rawTraits };
    if (opt.points) {
      Object.entries(opt.points).forEach(([k, v]) => {
        currentTraits[k as TraitKey] = (currentTraits[k as TraitKey] || 0) + (v || 0) * 2; // Doubled
      });
      setRawTraits(currentTraits);
    }

    const nextRpc = [...rpcAnswers, opt.rpcValue];
    setRpcAnswers(nextRpc);

    setTimeout(async () => {
      setPickedOpt(null);
      if (realityIdx + 1 < REALITY_QUESTIONS.length) {
        setRealityIdx(prev => prev + 1);
      } else {
        // Complete & finalize
        const charRes = computeCharacterResult(situation, currentTraits, hasDebtFlag);
        setCharacterResult(charRes);
        await finalizeDiagnostic(nextRpc, charRes);
      }
    }, 220);
  };

  // Submit to backend RPC and initialize sim_profiles
  const finalizeDiagnostic = async (answers: number[], charRes: CharacterResult) => {
    setSaving(true);
    setSaveError('');

    try {
      // Ensure exactly 15 answers for backend RPC
      const submission = answers.slice(0, 15);
      while (submission.length < 15) submission.push(0);

      const { data, error } = await supabase.rpc('submit_placement', { p_answers: submission });
      if (error) throw error;

      const res = data as unknown as { scores: Scores };
      setGroupScores(res.scores);
      saveLocal({ scores: res.scores, ts: Date.now() });

      // The server chooses a fixed starting balance once; retakes cannot reset game money.
      if (user) {
        const { error: setupError } = await supabase.rpc('initialize_simulator', {
          p_situation: charRes.situation.id,
          p_backstory: `${charRes.situation.title} • ${charRes.archetype.title}`,
        });
        if (setupError) throw setupError;
      }

      import('@/lib/streak').then((m) => m.touchStreak());
      setStage('done');
    } catch {
      setSaveError('Your result could not be saved to your profile. Retakes require full access.');
    } finally {
      setSaving(false);
    }
  };

  const r = roadmap(groupScores);
  const start = GROUPS[r.start];

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 max-w-2xl">
        {saving && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Building your financial profile & character…</p>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive space-y-3">
            <p className="font-semibold text-sm">{saveError}</p>
            <Button onClick={() => finalizeDiagnostic(rpcAnswers, characterResult!)} disabled={saving}>
              Try saving again
            </Button>
          </div>
        )}

        {/* 1. Guest Gate */}
        {!user && stage === 'intro' && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Find your starting point</h1>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto">
              Create a free account to take your 17-question intake, map your money habits, and unlock your simulator profile.
            </p>
            <Button size="lg" className="w-full max-w-sm mt-6 rounded-full font-semibold" onClick={() => navigate('/login?next=/diagnostic')}>
              Create free account
            </Button>
            <div className="mt-4">
              <button className="text-sm text-primary underline" onClick={() => navigate('/login?next=/diagnostic&mode=signin')}>
                I already have an account
              </button>
            </div>
          </div>
        )}

        {/* 2. Retake Locked Paywall */}
        {user && retakeLocked && (
          <div className="flex flex-col">
            <Paywall signedIn={!!user} title="Retake your placement test" note="Your path is ready. Unlock full access to retake the test and open every lesson." onUnlocked={() => setPaid(true)} />
            <Link to="/modules" className="text-sm text-center text-muted-foreground underline mt-4">Back to my lessons</Link>
          </div>
        )}

        {/* 3. Intro Screen */}
        {user && stage === 'intro' && !retakeLocked && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Financial Intake & Placement</h1>
            <p className="text-muted-foreground mt-3 text-base">
              17 real-world Zambian questions. Shapes your curriculum and builds your character in the Yungsta Simulator.
            </p>
            <div className="rounded-2xl border border-border bg-card p-6 mt-8 space-y-4 text-left text-sm">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Takes about 3–4 minutes. There are no right or wrong answers—only real choices.</span>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Sets your starting cash, income, and life situation in the simulator.</span>
              </div>
              <div className="flex items-start gap-3">
                <Compass className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Maps your 6 financial traits and unlocks your first recommended free lesson.</span>
              </div>
            </div>
            <Button size="lg" className="w-full mt-8 rounded-full font-semibold" onClick={() => setStage('age')}>
              {hadPrev ? 'Retake Intake Test' : 'Begin Intake'}
            </Button>
          </motion.div>
        )}

        {/* 4. Age Screen */}
        {user && stage === 'age' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
            <h1 className="text-2xl font-bold text-foreground">How old are you?</h1>
            <p className="text-muted-foreground mt-2 text-sm">Helps us tailor practical scenarios for people in your age group.</p>
            <form onSubmit={(e) => { e.preventDefault(); submitAge(); }}>
              <input 
                type="number" 
                inputMode="numeric" 
                min={5} 
                max={120} 
                autoFocus 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="24" 
                aria-label="Your age" 
                className="mt-6 w-36 mx-auto block text-center text-4xl font-extrabold rounded-2xl border-2 border-border bg-card p-4 focus:border-primary outline-none" 
              />
              {age && !ageOk && <p className="text-xs text-destructive mt-2">Please enter an age between 5 and 120.</p>}
              <Button type="submit" size="lg" className="w-full mt-8 rounded-full font-semibold" disabled={!ageOk}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </motion.div>
        )}

        {/* 5. Part A: Life Situation */}
        {user && stage === 'situation' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-xs font-mono font-bold tracking-widest text-primary uppercase mb-2">
              Part A: Your Starting Baseline
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Which sounds most like your life right now?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This sets your starting cash, monthly income, and living obligations in the Yungsta simulator.
            </p>

            <div className="space-y-3.5">
              {SITUATIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => chooseSituation(s)}
                  className="w-full text-left p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/60 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                      {s.title}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-foreground">
                      Start: K{s.cash.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{s.subtitle}</p>
                  <div className="flex gap-4 text-[11px] font-mono text-muted-foreground border-t border-border/50 pt-2">
                    <span>Income: ~K{s.income.toLocaleString()}/mo</span>
                    <span>Obligations: K{s.obligations.toLocaleString()}/mo</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 6. Part B: Scenario Dilemmas (Q2 to Q14) */}
        {user && stage === 'scenarios' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                Part B: Scenarios • Question {scenarioIdx + 2} of 17
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {Math.round(((scenarioIdx + 2) / 17) * 100)}%
              </span>
            </div>
            <Progress value={((scenarioIdx + 2) / 17) * 100} className="h-2 mb-8" />

            {/* Special Question 4: 100% Allocation Splitter */}


                        {scenarioIdx === 2 ? (
              <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase mb-2">
                  <PieChart className="w-4 h-4" /> Allocation Challenge
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  You earn an unexpected K5,000 bonus or profit.
                </h3>
                <p className="text-xs text-muted-foreground mb-5">
                  Pick a strategy below that reflects your instinct, or adjust the percentages:
                </p>

                {/* 1-Click Strategy Presets */}
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {[
                    {
                      title: 'The Shield',
                      subtitle: 'Buffer & Debt relief',
                      alloc: { savings: 40, debts: 30, family: 15, investing: 10, wants: 5 }
                    },
                    {
                      title: 'The Builder',
                      subtitle: 'Business & Growth',
                      alloc: { investing: 45, savings: 25, debts: 15, family: 10, wants: 5 }
                    },
                    {
                      title: 'Family First',
                      subtitle: 'Supporting relatives',
                      alloc: { family: 40, savings: 25, debts: 20, investing: 10, wants: 5 }
                    },
                    {
                      title: 'Balanced',
                      subtitle: 'Even 20% split',
                      alloc: { savings: 20, debts: 20, family: 20, investing: 20, wants: 20 }
                    },
                  ].map((preset) => {
                    const isSelected = 
                      allocations.savings === preset.alloc.savings &&
                      allocations.debts === preset.alloc.debts &&
                      allocations.family === preset.alloc.family &&
                      allocations.investing === preset.alloc.investing &&
                      allocations.wants === preset.alloc.wants;

                    return (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => setAllocations(preset.alloc)}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary' 
                            : 'border-border/70 hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="font-bold text-sm text-foreground">{preset.title}</div>
                        <div className="text-[11px] text-muted-foreground">{preset.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Split Breakdown */}
                <div className="space-y-3 mb-6 bg-muted/20 p-4 rounded-xl border border-border/50">
                  {[
                    { key: 'savings', label: 'Savings & Safety Buffer', value: allocations.savings },
                    { key: 'debts', label: 'Paying Debts & Bills', value: allocations.debts },
                    { key: 'investing', label: 'Business & Investing', value: allocations.investing },
                    { key: 'family', label: 'Family & Relatives', value: allocations.family },
                    { key: 'wants', label: 'Personal Wants / Lifestyle', value: allocations.wants },
                  ].map((b) => (
                    <div key={b.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground">{b.label}</span>
                        <span className="font-semibold text-primary">{b.value}% (K{(5000 * b.value / 100).toLocaleString()})</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={b.value}
                        onChange={(e) => setAllocations({ ...allocations, [b.key]: parseInt(e.target.value, 10) })}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  ))}
                </div>

                {(() => {
                  const total = allocations.savings + allocations.family + allocations.wants + allocations.investing + allocations.debts;
                  return (
                    <div className="pt-2 flex items-center justify-between">
                      <span className={`text-xs font-semibold ${total === 100 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                        Total: {total}% {total !== 100 && `(${100 - total}% remaining)`}
                      </span>
                      <Button onClick={submitQ4Allocation} disabled={total !== 100} className="rounded-full font-semibold px-6">
                        Confirm Split <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  );
                })()}
              </div>
            ) : (

              
              <div>
                <motion.h3 
                  key={scenarioIdx} 
                  initial={{ opacity: 0, x: 14 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="text-xl font-bold text-foreground mb-6 leading-snug"
                >
                  {SCENARIO_QUESTIONS[scenarioIdx].question}
                </motion.h3>

                <div className="space-y-3">
                  {SCENARIO_QUESTIONS[scenarioIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => answerScenario(i)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                        pickedOpt === i 
                          ? 'border-primary bg-primary/10 font-medium' 
                          : 'border-border/80 bg-card hover:border-primary/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5 shrink-0 ${
                          pickedOpt === i ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{opt.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. Part C: Reality Check (Fast Yes/No, Doubled) */}
        {user && stage === 'reality' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-600 uppercase">
                Part C: Reality Check • Question {realityIdx + 15} of 17
              </span>
              <span className="text-xs text-muted-foreground font-mono">Points count ×2</span>
            </div>
            <Progress value={((realityIdx + 15) / 17) * 100} className="h-2 mb-8" />

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium mb-6">
              Answer honestly based on what you actually did over the last 30 days.
            </div>

            <motion.h3 
              key={realityIdx} 
              initial={{ opacity: 0, x: 14 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="text-xl font-bold text-foreground mb-6 leading-snug"
            >
              {REALITY_QUESTIONS[realityIdx].question}
            </motion.h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REALITY_QUESTIONS[realityIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerReality(i)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    pickedOpt === i 
                      ? 'border-primary bg-primary/10 font-semibold' 
                      : 'border-border/80 bg-card hover:border-primary/50 text-foreground'
                  }`}
                >
                  <span className="text-base font-bold block mb-1">
                    {opt.text.startsWith('Yes') ? 'Yes' : 'No'}
                  </span>
                  <span className="text-xs text-muted-foreground">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 8. Done / Results Dashboard */}
        {stage === 'done' && characterResult && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">



{pushSupported() && typeof Notification !== 'undefined' && Notification.permission === 'default' && (
  <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl shrink-0">
        🔔
      </div>
      <div>
        <div className="font-bold text-sm text-foreground">
          Never lose your daily coin streak
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Get high-priority daily nudges before midnight to protect your progress.
        </p>
      </div>
    </div>
    <Button 
      size="sm" 
      onClick={async () => {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        await enablePush();
      }}
      className="rounded-full px-5 font-semibold shrink-0"
    >
      Let us remind you
    </Button>
  </div>
)}




            
            
            {/* Archetype Card */}
            <div className="rounded-3xl bg-gradient-to-br from-primary to-green-800 text-primary-foreground p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest font-mono opacity-80">
                  Your Financial Archetype
                </span>
                <span className="text-3xl">{characterResult.archetype.avatar}</span>
              </div>
              <h2 className="text-3xl font-extrabold">{characterResult.archetype.title}</h2>
              <p className="text-sm font-medium opacity-90 mt-1 italic">
                "{characterResult.archetype.tagline}"
              </p>
              <div className="mt-4 pt-4 border-t border-primary-foreground/20 text-xs opacity-95 leading-relaxed">
                <span className="font-bold">Core Learning Focus:</span> {characterResult.archetype.focus}
              </div>
            </div>

            {/* 6 Trait Analysis */}
            <div className="rounded-2xl border border-border/80 bg-card p-6">
              <h3 className="font-bold text-foreground text-base mb-1">Your 6 Financial Traits</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Normalized on a 0–10 scale based on your scenario responses and reality check.
              </p>

              <div className="space-y-3.5">
                {(Object.entries(characterResult.normalizedTraits) as [TraitKey, number][]).map(([k, score]) => {
                  const def = TRAIT_DEFS[k];
                  const level = score >= 7 ? 'High' : score >= 4 ? 'Moderate' : 'Low';
                  return (
                    <div key={k} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-foreground">{def.name} ({k})</span>
                        <span className="font-mono text-muted-foreground">{score}/10 · {level}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 7 ? 'bg-primary' : score >= 4 ? 'bg-primary/70' : 'bg-muted-foreground/40'
                          }`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulator Starting Setup */}
            <div className="rounded-2xl border border-border/80 bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Gamepad2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Yungsta Simulator Starting Setup</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Starting Cash</span>
                  <span className="font-mono font-bold text-sm text-primary">K{characterResult.startingCash.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Est. Income</span>
                  <span className="font-mono font-bold text-sm text-foreground">K{characterResult.monthlyIncome.toLocaleString()}/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Obligations</span>
                  <span className="font-mono font-bold text-sm text-foreground">K{characterResult.monthlyObligations.toLocaleString()}/mo</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block">Kaloba Debt</span>
                  <span className={`font-mono font-bold text-sm ${characterResult.startingDebt > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {characterResult.startingDebt > 0 ? `K${characterResult.startingDebt}` : 'None (K0)'}
                  </span>
                </div>
              </div>

              <Link to="/sim">
                <Button variant="secondary" className="w-full rounded-full font-semibold">
                  Open Yungsta Simulator With This Profile <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* Recommended Course Module */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-wide block mb-1">
                Curriculum Recommendation
              </span>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Phase {start.n} · {start.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Based on your diagnostic score, this is where you have the highest immediate room to improve.
              </p>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border mb-4">
                <span className="text-2xl">{start.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-foreground">{start.mod}</div>
                  <div className="text-xs text-primary font-medium">Free Placement Starter Lesson</div>
                </div>
              </div>

              <Button className="w-full rounded-full font-semibold" onClick={() => navigate(`/modules/${start.slug}`)}>
                Start Learning Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

          </motion.div>
        )}
      </section>
    </Layout>
  );
};

export default Diagnostic;

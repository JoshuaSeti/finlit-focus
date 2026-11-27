import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { touchStreak } from '@/lib/streak';
import Paywall from '@/components/learning/Paywall';
import { getAccess } from '@/lib/access';
import { freeSlug } from '@/lib/placement';
import { syncOrQueueProgress, useNetworkStatus } from '@/lib/offline-sync';
import { LearningModule, loadModuleHtml, prepareModuleHtml, progressKey, shareSessionWithSimulator, summarize } from '@/lib/modules';
import { getLesson1Dilemma } from '@/lib/simulator-dilemmas';
import { ProtegeDialogueStage } from '@/lib/ProtegeDialogueStage';
import { PersonalMirrorHotSeat } from '@/lib/PersonalMirrorHotSeat';
import { AlignmentScorecard } from '@/lib/AlignmentScorecard';
import { Button } from '@/components/ui/button';

const ModulePlayer = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const { isOnline, pendingCount } = useNetworkStatus();
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const userRef = useRef(user);
  userRef.current = user;
  const userId = user?.id ?? null;
  const loadedKey = useRef('');
  const [locked, setLocked] = useState(false);

  // Simulation flow: 'reading' | 'protege' | 'hotseat' | 'debrief'
  const [simulationStep, setSimulationStep] = useState<'reading' | 'protege' | 'hotseat' | 'debrief'>('reading');
  const [dilemmaData, setDilemmaData] = useState(() => getLesson1Dilemma('employee', 'spender', 'Protégé'));
  const [mentorshipResult, setMentorshipResult] = useState<{ totalScore: number; protectedKwacha: number; habitName?: string } | null>(null);
  const [personalResult, setPersonalResult] = useState<{ alignmentScore: number; verdict: string } | null>(null);

  // Sync situation from user's sim profile if logged in
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase
        .from('sim_profiles')
        .select('initial_situation, character_name')
        .eq('id', user.id)
        .maybeSingle();

      const situation = (prof?.initial_situation as any) || 'employee';
      const name = prof?.character_name || 'Protégé';
      setDilemmaData(getLesson1Dilemma(situation, 'spender', name));
    })();
  }, [user]);

  // Load module, restore saved progress, build the page
  useEffect(() => {
    if (isLoading) return;
    const key = `${slug}:${userId ?? 'guest'}`;
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    (async () => {
      setError('');
      const { data: m } = await supabase.from('learning_modules').select('*').eq('slug', slug).maybeSingle();
      if (!m) { setError('This lesson could not be found.'); return; }
      setTitle((m as LearningModule).title);

      const acc = await getAccess(user?.id ?? null);
      if (!isAdmin && !acc.paid && (!acc.scores || slug !== freeSlug(acc.scores))) { 
        setLocked(true); 
        return; 
      }

      if (user) {
        await shareSessionWithSimulator();
        const { data: p } = await supabase.from('module_progress').select('progress').eq('user_id', user.id).eq('module_slug', slug).maybeSingle();
        if (p?.progress && Object.keys(p.progress as object).length) {
          localStorage.setItem(progressKey(slug), JSON.stringify(p.progress));
        }
      }
      try {
        const html = prepareModuleHtml(await loadModuleHtml(m as LearningModule), slug, user);
        sessionStorage.setItem(`finlit-module-html:${slug}`, html);
        setSrc(`/module-host.html?slug=${encodeURIComponent(slug)}&v=${Date.now()}`);
      } catch (e: any) {
        setError(e.message || 'Could not load this lesson.');
      }
    })();
  }, [slug, userId, isLoading]);

  // Handle messages from the lesson bridge
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data || {};
      if (d.source !== 'finlit-module' || d.slug !== slug) return;
      
      const u = userRef.current;

      if (d.type === 'progress' && u) {
        const s = summarize(d.progress, d.sections || []);
        await syncOrQueueProgress(u.id, slug, d.progress, s);
      } else if (d.type === 'certificate' && u) {
        const { data: claimed } = await supabase.rpc('claim_module_certificate' as never, {
          p_slug: slug,
          p_name: d.name || null,
        } as never);
        if ((claimed as { ok?: boolean } | null)?.ok) {
          await supabase.from('module_events').insert({
            user_id: u.id,
            module_slug: slug,
            kind: 'certificate',
            payload: { name: d.name, score: d.score }
          });
        }
      } else if (d.type === 'practice' && u) {
        if (d.status === 'practice-complete') {
          touchStreak().catch(() => {});
          // Trigger Protégé simulator dilemma
          setSimulationStep('protege');
        }
        await supabase.from('module_events').insert({
          user_id: u.id,
          module_slug: slug,
          kind: 'practice',
          payload: { status: d.status }
        });
      } else if (d.type === 'event' && typeof d.kind === 'string' && u) {
        await supabase.from('module_events').insert({
          user_id: u.id,
          module_slug: slug,
          kind: d.kind.slice(0, 60),
          payload: d.payload || {}
        });
      }

      if (d.type === 'home') {
        navigate('/modules');
      } else if (d.type === 'open' && d.slug) {
        navigate(`/modules/${String(d.slug).replace(/-full$/, '')}`);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [slug, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* 3-Stage Progress Header (Duolingo Stepper + Apple Cleanliness) */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-border bg-card shrink-0">
        
        {/* Left: Exit to Modules */}
        <Link 
          to="/modules" 
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 
          <span className="hidden sm:inline">Exit Lesson</span>
        </Link>

        {/* Center: 3-Beat Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-bold">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            simulationStep === 'reading'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted/50 text-muted-foreground border-border'
          }`}>
            <span>1</span>
            <span className="hidden sm:inline">Core Concept</span>
          </div>

          <span className="text-muted-foreground">→</span>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            simulationStep === 'protege'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted/50 text-muted-foreground border-border'
          }`}>
            <span>2</span>
            <span className="hidden sm:inline">Mentor Protégé</span>
          </div>

          <span className="text-muted-foreground">→</span>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
            simulationStep === 'hotseat' || simulationStep === 'debrief'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted/50 text-muted-foreground border-border'
          }`}>
            <span>3</span>
            <span className="hidden sm:inline">Your Hot-Seat</span>
          </div>
        </div>

        {/* Right: Quick Test Shortcut & Sync Status */}
        <div className="flex items-center gap-2">
          {simulationStep === 'reading' && !locked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulationStep('protege')}
              className="text-xs rounded-full h-8 px-3 text-primary border-primary/30 hover:bg-primary/10 font-semibold"
            >
              Mentor Protégé →
            </Button>
          )}

          {!isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          ) : pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Syncing...
            </span>
          ) : null}
        </div>
      </div>

      {/* Main Body */}
      {locked ? (
        <Paywall signedIn={!!user} onUnlocked={() => { loadedKey.current = ''; setLocked(false); window.location.reload(); }} />
      ) : error ? (
        <div className="p-8 text-center text-muted-foreground">{error}</div>
      ) : simulationStep === 'protege' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-background">
          <ProtegeDialogueStage
            protegeName={dilemmaData.protegeName}
            beats={dilemmaData.beats}
            onComplete={(stats) => {
              setMentorshipResult(stats);
              setSimulationStep('hotseat');
            }}
          />
        </div>
      ) : simulationStep === 'hotseat' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-background">
          <PersonalMirrorHotSeat
            hotSeat={dilemmaData.hotSeat}
            onDecision={(result) => {
              setPersonalResult(result);
              setSimulationStep('debrief');
            }}
          />
        </div>
      ) : simulationStep === 'debrief' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-background">
          <AlignmentScorecard
            protegeName={dilemmaData.protegeName}
            mentorshipScore={mentorshipResult?.totalScore ?? 80}
            personalScore={personalResult?.alignmentScore ?? 75}
            protectedKwacha={mentorshipResult?.protectedKwacha ?? 600}
            habitName={mentorshipResult?.habitName}
            verdict={personalResult?.verdict ?? 'Balanced Discipline'}
            onFinish={() => {
              navigate('/modules');
            }}
          />
        </div>
      ) : src ? (
        <iframe key={src} src={src} title={title} className="flex-1 w-full border-0" allow="fullscreen; clipboard-write" />
      ) : (
        <div className="p-8 text-center text-muted-foreground">Loading lesson…</div>
      )}
    </div>
  );

  
};

export default ModulePlayer;

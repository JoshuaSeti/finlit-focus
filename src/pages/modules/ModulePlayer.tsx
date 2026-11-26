import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { touchStreak } from '@/lib/streak';
import Paywall from '@/components/learning/Paywall';
import { getAccess } from '@/lib/access';
import { freeSlug } from '@/lib/placement';
import { syncOrQueueProgress, useNetworkStatus } from '@/lib/offline-sync';
import { WifiOff, Check } from 'lucide-react';
import { LearningModule, loadModuleHtml, prepareModuleHtml, progressKey, shareSessionWithSimulator, summarize } from '@/lib/modules';



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

  // Load module, restore saved progress, build the page.
  // Runs once per slug+sign-in state — background auth events (e.g. the
  // simulator iframe refreshing its token) must NOT reload the lesson.
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
      // Only the learner's recommended starting lesson is free; the rest need the K20 unlock.
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

  // Messages from the module.
  // Messages from the module.
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
        const now = new Date().toISOString();
        await supabase.from('module_progress').upsert({
          user_id: u.id,
          module_slug: slug,
          completed_at: now,
          certificate_claimed_at: now,
          certificate_name: d.name || null
        }, { onConflict: 'user_id,module_slug' });
        await supabase.from('module_events').insert({
          user_id: u.id,
          module_slug: slug,
          kind: 'certificate',
          payload: { name: d.name, score: d.score }
        });
      } else if (d.type === 'practice' && u) {
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
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border shrink-0">
        <Link to="/modules" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Lessons
        </Link>
        <span className="text-sm font-medium text-foreground truncate">{title}</span>

        {/* Discreet Native Offline/Sync Status Pill */}
        <div className="ml-auto flex items-center gap-2">
          {!isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <WifiOff className="w-3 h-3" /> Offline • Saved locally
            </span>
          ) : pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Syncing...
            </span>
          ) : null}

          {!isLoading && !user && (
            <Link to="/login" className="text-sm text-primary font-medium whitespace-nowrap">Sign in to save progress</Link>
          )}
        </div>
      </div>

      {locked ? (
        <Paywall signedIn={!!user} onUnlocked={() => { loadedKey.current = ''; setLocked(false); window.location.reload(); }} />
      ) : error ? (
        <div className="p-8 text-center text-muted-foreground">{error}</div>
      ) : src ? (
        <iframe key={src} src={src} title={title} className="flex-1 w-full border-0" allow="fullscreen; clipboard-write" />
      ) : (
        <div className="p-8 text-center text-muted-foreground">Loading lesson…</div>
      )}
    </div>
  );
};

export default ModulePlayer;

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LearningModule, loadModuleHtml, prepareModuleHtml, progressKey, shareSessionWithSimulator, summarize } from '@/lib/modules';

const ModulePlayer = () => {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const userRef = useRef(user);
  userRef.current = user;

  // Load module, restore saved progress, build the page.
  useEffect(() => {
    if (isLoading) return;
    let url: string | null = null;
    (async () => {
      setError('');
      const { data: m } = await supabase.from('learning_modules').select('*').eq('slug', slug).maybeSingle();
      if (!m) { setError('This lesson could not be found.'); return; }
      setTitle((m as LearningModule).title);
      if (user) {
        await shareSessionWithSimulator();
        const { data: p } = await supabase.from('module_progress').select('progress').eq('user_id', user.id).eq('module_slug', slug).maybeSingle();
        if (p?.progress && Object.keys(p.progress as object).length) {
          localStorage.setItem(progressKey(slug), JSON.stringify(p.progress));
        }
      }
      try {
        const html = prepareModuleHtml(await loadModuleHtml(m as LearningModule), slug, user);
        url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
        setSrc(url);
      } catch (e: any) {
        setError(e.message || 'Could not load this lesson.');
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [slug, user, isLoading]);

  // Messages from the module.
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      const d = e.data || {};
      if (d.source !== 'finlit-module' || d.slug !== slug) return;
      if (d.type === 'home') return navigate('/modules');
      if (d.type === 'open' && d.slug) return navigate(`/modules/${String(d.slug).replace(/-full$/, '')}`);
      const u = userRef.current;
      if (!u) return;
      if (d.type === 'progress') {
        const s = summarize(d.progress, d.sections || []);
        const { data: existing } = await supabase.from('module_progress').select('completed_at').eq('user_id', u.id).eq('module_slug', slug).maybeSingle();
        await supabase.from('module_progress').upsert({
          user_id: u.id, module_slug: slug, progress: d.progress,
          sections_done: s.sections_done, sections_total: s.sections_total,
          quiz_correct: s.quiz_correct, quiz_total: s.quiz_total,
          completed_at: existing?.completed_at ?? (s.complete ? new Date().toISOString() : null),
        }, { onConflict: 'user_id,module_slug' });
        if (s.complete && !existing?.completed_at) {
          await supabase.from('module_events').insert({ user_id: u.id, module_slug: slug, kind: 'module_complete', payload: { quiz_correct: s.quiz_correct, quiz_total: s.quiz_total } });
        }
      } else if (d.type === 'certificate') {
        await supabase.from('module_progress').upsert({ user_id: u.id, module_slug: slug, certificate_claimed_at: new Date().toISOString(), certificate_name: d.name || null }, { onConflict: 'user_id,module_slug' });
        await supabase.from('module_events').insert({ user_id: u.id, module_slug: slug, kind: 'certificate', payload: { name: d.name, score: d.score } });
      } else if (d.type === 'practice') {
        await supabase.from('module_events').insert({ user_id: u.id, module_slug: slug, kind: 'practice', payload: { status: d.status } });
      } else if (d.type === 'event' && typeof d.kind === 'string') {
        await supabase.from('module_events').insert({ user_id: u.id, module_slug: slug, kind: d.kind.slice(0, 60), payload: d.payload || {} });
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
        {!isLoading && !user && (
          <Link to="/login" className="ml-auto text-sm text-primary font-medium whitespace-nowrap">Sign in to save progress</Link>
        )}
      </div>
      {error ? (
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

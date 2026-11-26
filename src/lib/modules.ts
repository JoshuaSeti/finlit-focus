import { supabase } from '@/integrations/supabase/client';

export type LearningModule = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_published: boolean;
  default_path: string | null;
  storage_path: string | null;
  practice_enabled: boolean;
};

export const progressKey = (slug: string) => `finlit-progress-${slug}`;

/** Fetch the module's HTML with transparent offline device cache fallback */
export async function loadModuleHtml(m: Pick<LearningModule, 'slug'>): Promise<string> {
  const cacheKey = `finlit-module-cache:${m.slug}`;

  // Helper to read from local device cache
  const readLocalCache = async (): Promise<string | null> => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('finlit-modules-v1');
        const res = await cache.match(`/cached-module/${m.slug}`);
        if (res) return await res.text();
      } catch {}
    }
    return localStorage.getItem(cacheKey);
  };

  // Helper to save to local device cache
  const saveLocalCache = async (html: string) => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cache = await caches.open('finlit-modules-v1');
        await cache.put(`/cached-module/${m.slug}`, new Response(html, { headers: { 'Content-Type': 'text/html' } }));
      } catch {}
    }
    try {
      localStorage.setItem(cacheKey, html);
    } catch {}
  };

  // If currently offline, skip straight to local device cache
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = await readLocalCache();
    if (cached) return cached;
    throw new Error('This lesson has not been opened yet while online. Connect to the internet once to save it.');
  }

  try {
    const { data, error } = await supabase.functions.invoke('module-content', { body: { slug: m.slug } });
    if (error) throw new Error('Could not load module');
    
    let html = '';
    if (typeof data === 'string') html = data;
    else if (data instanceof Blob) html = await data.text();
    else throw new Error('Could not load module');

    // Save to local device cache for future offline visits
    await saveLocalCache(html);
    return html;
  } catch (err: any) {
    // Fallback to cache if network call failed
    const cached = await readLocalCache();
    if (cached) return cached;
    throw err;
  }
}


/** Prepare module HTML to run inside the site: add the bridge, fix links that pointed at the old site. */
export function prepareModuleHtml(html: string, slug: string, user: { id: string; email?: string | null } | null) {
  const origin = window.location.origin;
  const cfg = JSON.stringify({ slug, user: user ? { id: user.id, email: user.email ?? null } : null });
  const head =
        `<script>window.__FINLIT_BRIDGE__=${cfg};</script>` +
    `<script src="${origin}/finlit-bridge.js"></script>`;
  let out = html
    .replace(/location\.href\s*=\s*['"](?:\.\/)?index\.html[^'"]*['"]/g, 'window.FinLitBridge.home()')
    .replace(/<script src="\/(?:fee-bar|gate|referral)\.js"[^>]*><\/script>/g, '');
  out = /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, (m) => m + head) : head + out;
  return out;
}

export type LearningModule = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  sort_order: number;
  is_published: boolean;
  default_path: string | null;
  storage_path: string | null;
  practice_enabled: boolean;
  cover_image_url?: string | null;
  theme_color?: string | null;
};

export function summarize(progress: any, sections: string[]) {
  const doneMap = progress?.done || {};
  const visitedMap = progress?.visited || {};
  const finishedSections = sections.filter((s) => doneMap[s] || visitedMap[s]);
  const total = sections.length;

  // Complete if all declared sections are visited/done, or explicit completion flag or certificate claimed
  const hasCert = Boolean(progress?.certificate || progress?.certificate_claimed_at);
  const quizPassed = Boolean(
    progress?.quizScore &&
    progress.quizScore.total > 0 &&
    progress.quizScore.correct / progress.quizScore.total >= 0.7
  );
  const allSectionsFinished = total > 0 && sections.every((s) => doneMap[s] || visitedMap[s]);
  const isExplicitComplete = progress?.complete === true || progress?.completed === true;

  const isComplete = allSectionsFinished || isExplicitComplete || hasCert || (quizPassed && finishedSections.length > 0);

  return {
    sections_done: finishedSections.length > 0 ? finishedSections.length : (progress?.sections_done ?? (isComplete ? total : 0)),
    sections_total: total,
    quiz_correct: progress?.quizScore?.correct ?? null,
    quiz_total: progress?.quizScore?.total ?? null,
    complete: isComplete,
  };
}

}

/** Share the site's sign-in with the simulator pages (they read the standard browser key). */
export async function shareSessionWithSimulator() {
  try {
    const { data } = await supabase.auth.getSession();
    const ref = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (data.session && ref) localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(data.session));
  } catch {
    /* ignore */
  }
}

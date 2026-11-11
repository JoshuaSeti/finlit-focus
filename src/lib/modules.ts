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

/** Fetch the module's current HTML: an uploaded version wins over the built-in file. */
export async function loadModuleHtml(m: Pick<LearningModule, 'storage_path' | 'default_path'>): Promise<string> {
  if (m.storage_path) {
    const { data, error } = await supabase.storage.from('modules').download(m.storage_path);
    if (!error && data) return await data.text();
    if (!m.default_path) throw error || new Error('Could not load module');
  }
  if (!m.default_path) throw new Error('This module has no content yet');
  const r = await fetch(m.default_path, { cache: 'no-cache' });
  if (!r.ok) throw new Error('Could not load module');
  return await r.text();
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

export function summarize(progress: any, sections: string[]) {
  const done = progress?.done ? Object.keys(progress.done).filter((k) => progress.done[k]) : [];
  const total = sections.length;
  return {
    sections_done: done.length,
    sections_total: total,
    quiz_correct: progress?.quizScore?.correct ?? null,
    quiz_total: progress?.quizScore?.total ?? null,
    complete: total > 0 && sections.every((s) => progress?.done?.[s]),
  };
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

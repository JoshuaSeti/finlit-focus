import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Serves lesson HTML only to learners who are entitled to it:
// admins, paid learners (lesson_access), or the learner's one free starter lesson.
const PASS = 0.66;
const ORDER = ['group-0', 'group-1', 'group-2', 'group-3', 'group-4'];
const START: Record<string, string> = {
  'group-0': 'module-0a', 'group-1': 'module-1-0', 'group-2': 'module-2-0', 'group-3': 'module-3-0', 'group-4': 'module-4-0',
};
function freeSlug(scores: any): string | null {
  if (!scores || typeof scores !== 'object') return null;
  const work = ORDER.filter((g) => { const s = scores[g]; return !(s && s.t > 0 && s.c / s.t >= PASS); });
  return START[work[0] ?? 'group-4'];
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) return json({ error: 'Please sign in first.' }, 401);

    const { slug } = await req.json().catch(() => ({}));
    if (typeof slug !== 'string' || !/^[a-z0-9-]{1,60}$/.test(slug)) return json({ error: 'Not found' }, 404);

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roles } = await db.from('user_roles').select('role').eq('user_id', user.id);
    const admin = !!roles?.some((r: any) => r.role === 'admin' || r.role === 'super_admin');

    const { data: m } = await db.from('learning_modules').select('slug,is_published,storage_path,default_path').eq('slug', slug).maybeSingle();
    if (!m || (!m.is_published && !admin)) return json({ error: 'Not found' }, 404);

    if (!admin) {
      const { data: paid } = await db.from('lesson_access').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!paid) {
        const { data: pr } = await db.from('placement_results').select('scores').eq('user_id', user.id).eq('server_scored', true)
          .order('created_at', { ascending: false }).limit(1);
        if (freeSlug(pr?.[0]?.scores) !== slug) return json({ error: 'locked' }, 403);
      }
    }

    const tryGet = async (path: string | null) => {
      if (!path) return null;
      const { data } = await db.storage.from('modules').download(path);
      return data ? await data.text() : null;
    };
    const builtin = m.default_path ? `builtin/${m.default_path.split('/').pop()}` : null;
    const html = (await tryGet(m.storage_path)) ?? (await tryGet(builtin));
    if (!html) return json({ error: 'This module has no content yet' }, 404);
    return new Response(html, { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong.' }, 500);
  }
});

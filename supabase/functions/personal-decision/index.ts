import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Body = z.object({
  event_title: z.string().max(200).default(''),
  situation: z.string().max(2000).default(''),
  advice: z.string().max(400).default(''),
  outcome: z.string().max(2000).default(''),
  yungsta: z.string().max(60).default('your yungsta'),
});

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = req.headers.get('Authorization') || '';
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!u?.user) return json({ error: 'unauthorized' }, 401);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const b = parsed.data;

  const prompt = `A learner in Zambia just advised their simulated character "${b.yungsta}".
Story: ${b.event_title}
Situation: ${b.situation}
Advice they gave: ${b.advice}
What happened: ${b.outcome}

Now write a short, realistic scenario (2-3 sentences, second person "you") where the LEARNER faces the same money principle in their own everyday life in Zambia, with concrete Kwacha (K) amounts suited to a young person or student. Then give exactly 4 concrete options (each one specific action with an amount where it makes sense). Exactly one should be the financially wise choice; the others tempting but weaker. Explain in 1-2 sentences why the wise option is best.`;

  const schema = {
    type: 'object', additionalProperties: false,
    properties: {
      scenario: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      wise_index: { type: 'integer' },
      why: { type: 'string' },
    },
    required: ['scenario', 'options', 'wise_index', 'why'],
  };
  const r = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    headers: { 'Lovable-API-Key': Deno.env.get('LOVABLE_API_KEY')!, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra',
      stream: true,
      store: false,
      reasoning: { effort: 'low' },
      input: [
        { role: 'system', content: 'You write short, practical financial-literacy scenarios for Zambian learners. Plain English, no jargon. Return exactly 4 options and wise_index from 0 to 3.' },
        { role: 'user', content: prompt },
      ],
      text: { format: { type: 'json_schema', name: 'personal_decision', strict: true, schema } },
    }),
  });
  if (r.status === 429) return json({ error: 'busy' }, 429);
  if (r.status === 402) return json({ error: 'credits' }, 402);
  if (!r.ok || !r.body) return json({ error: 'ai_failed' }, 500);
  let text = '', buf = '';
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try { const ev = JSON.parse(payload); if (ev.type === 'response.output_text.delta') text += ev.delta; } catch { /* skip */ }
    }
  }
  try {
    const args = JSON.parse(text);
    if (!Array.isArray(args.options) || args.options.length !== 4 || args.wise_index < 0 || args.wise_index > 3) throw new Error('bad');
    return json(args);
  } catch {
    return json({ error: 'ai_failed' }, 500);
  }
});

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

  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You write short, practical financial-literacy scenarios for Zambian learners. Plain English, no jargon.' },
        { role: 'user', content: prompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'personal_decision',
          parameters: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
              wise_index: { type: 'integer', minimum: 0, maximum: 3 },
              why: { type: 'string' },
            },
            required: ['scenario', 'options', 'wise_index', 'why'],
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'personal_decision' } },
    }),
  });
  if (r.status === 429) return json({ error: 'busy' }, 429);
  if (r.status === 402) return json({ error: 'credits' }, 402);
  if (!r.ok) return json({ error: 'ai_failed' }, 500);
  const data = await r.json();
  try {
    const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
    if (!Array.isArray(args.options) || args.options.length !== 4) throw new Error('bad');
    return json(args);
  } catch {
    return json({ error: 'ai_failed' }, 500);
  }
});

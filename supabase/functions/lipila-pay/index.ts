import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { PRICE_ZMW, lipilaBase, admin, confirmPayment } from '../_shared/lipila.ts';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Body = z.union([
  z.object({ action: z.literal('start'), phone: z.string().regex(/^(260|0)?[79]\d{8}$/) }),
  z.object({ action: z.literal('check'), referenceId: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser(auth.replace('Bearer ', ''));
    if (!user) return json({ error: 'Please sign in first.' }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: 'Please enter a valid Zambian mobile number.' }, 400);
    const db = admin();

    if (parsed.data.action === 'check') {
      const { data: p } = await db.from('lipila_payments').select('user_id,status').eq('reference_id', parsed.data.referenceId).maybeSingle();
      if (!p || p.user_id !== user.id) return json({ error: 'Not found' }, 404);
      if (p.status !== 'pending') return json({ status: p.status });
      return json(await confirmPayment(parsed.data.referenceId));
    }

    const digits = parsed.data.phone.replace(/^0/, '');
    const phone = digits.startsWith('260') ? digits : `260${digits}`;
    const referenceId = crypto.randomUUID();
    await db.from('lipila_payments').insert({ user_id: user.id, reference_id: referenceId, amount: PRICE_ZMW, phone });

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/lipila-webhook`;
    const res = await fetch(`${lipilaBase()}/api/v1/collections/mobile-money`, {
      method: 'POST',
      headers: {
        accept: 'application/json', 'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('LIPILA_API_KEY')!, callbackUrl,
      },
      body: JSON.stringify({
        referenceId, amount: PRICE_ZMW, narration: 'FinLit full lesson access',
        accountNumber: phone, currency: 'ZMW', email: user.email ?? '', referenceData: 'finlit-access',
      }),
    });
    const text = await res.text();
    let out: unknown = {};
    try { out = JSON.parse(text); } catch { out = { text }; }
    if (!res.ok) {
      console.error('lipila start failed', res.status, lipilaBase(), text.slice(0, 500));
      await db.from('lipila_payments').update({ status: 'failed', raw: out }).eq('reference_id', referenceId);
      return json({ error: 'The payment could not be started. Please try again.' }, 502);
    }
    return json({ referenceId, status: 'pending' });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong.' }, 500);
  }
});

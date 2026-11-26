import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
import { PRICE_ZMW, lipilaBase, admin, confirmPayment } from '../_shared/lipila.ts';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Body = z.union([
  z.object({ action: z.literal('start'), phone: z.string() }),
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
    if (!parsed.success) return json({ error: 'Invalid payment request.' }, 400);
    const db = admin();

    if (parsed.data.action === 'check') {
      const { data: p } = await db.from('lipila_payments').select('user_id,status').eq('reference_id', parsed.data.referenceId).maybeSingle();
      if (!p || p.user_id !== user.id) return json({ error: 'Not found' }, 404);
      if (p.status !== 'pending') return json({ status: p.status });
      return json(await confirmPayment(parsed.data.referenceId));
    }

    // Subscription check: allow renewal if expired or within 7 days of expiry
    const { data: access } = await db.from('lesson_access').select('expires_at').eq('user_id', user.id).maybeSingle();
    if (access?.expires_at) {
      const remainingMs = new Date(access.expires_at).getTime() - Date.now();
      const sevenDaysMs = 7 * 24 * 3600 * 1000;
      if (remainingMs > sevenDaysMs) {
        const days = Math.ceil(remainingMs / (24 * 3600 * 1000));
        return json({
          error: `Your subscription is active for another ${days} days. You can renew when you have 7 days or less remaining.`,
        }, 409);
      }
    }

    const rawDigits = String(parsed.data.phone ?? '').replace(/\D/g, '');
    const normalized = rawDigits.startsWith('0') ? `260${rawDigits.slice(1)}` : rawDigits.startsWith('260') ? rawDigits : `260${rawDigits}`;
    const phone = /^260[79]\d{8}$/.test(normalized) ? normalized : null;

    if (!phone) {
      return json({
        error: 'Please enter a valid Airtel, MTN, or Zamtel mobile number.',
        code: 'invalid_phone',
      }, 400);
    }

    // Rate limits (5 attempts/day per user, 5 prompts/day per phone)
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: recent } = await db.from('lipila_payments').select('created_at,status')
      .eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false });
    const last = recent?.[0];
    if (last && last.status === 'pending' && Date.now() - new Date(last.created_at).getTime() < 3 * 60 * 1000)
      return json({ error: 'A payment prompt was just sent. Please wait a few minutes before trying again.' }, 429);
    if ((recent?.length ?? 0) >= 5)
      return json({ error: 'Too many payment attempts today. Please try again tomorrow.' }, 429);
    const { count: phoneCount } = await db.from('lipila_payments').select('id', { count: 'exact', head: true })
      .eq('phone', phone).gte('created_at', since);
    if ((phoneCount ?? 0) >= 5)
      return json({ error: 'Too many payment prompts were sent to this number today. Please try again tomorrow.' }, 429);

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
        referenceId, amount: PRICE_ZMW, narration: 'FinLit monthly subscription',
        accountNumber: phone, currency: 'ZMW', email: user.email ?? '', referenceData: 'finlit-monthly',
      }),
    });
    const text = await res.text();
    let out: unknown = {};
    try { out = JSON.parse(text); } catch { out = { text }; }
    const slow = res.status >= 500 || /did not arrive on time|timeout/i.test(text);
    if (!res.ok && slow) {
      await db.from('lipila_payments').update({ raw: out }).eq('reference_id', referenceId);
      return json({ referenceId, status: 'pending' });
    }
    if (!res.ok) {
      await db.from('lipila_payments').update({ status: 'failed', raw: out }).eq('reference_id', referenceId);
      return json({ error: 'The payment could not be started. Please try again.' }, 502);
    }
    return json({ referenceId, status: 'pending' });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong.' }, 500);
  }
});

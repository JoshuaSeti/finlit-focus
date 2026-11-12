import { createClient } from 'npm:@supabase/supabase-js@2';

export const PRICE_ZMW = 20;
export const lipilaBase = () => Deno.env.get('LIPILA_BASE_URL') || 'https://blz.lipila.io';
export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// Ask Lipila directly for the real status (never trust a callback body alone).
export async function confirmPayment(referenceId: string) {
  const res = await fetch(
    `${lipilaBase()}/api/v1/collections/check-status?referenceId=${encodeURIComponent(referenceId)}`,
    { headers: { accept: 'application/json', 'x-api-key': Deno.env.get('LIPILA_API_KEY')! } },
  );
  const body = await res.json().catch(() => ({}));
  const raw = String(body?.status ?? body?.data?.status ?? '').toLowerCase();
  const status = raw.startsWith('success') ? 'completed' : raw.startsWith('fail') ? 'failed' : 'pending';
  const db = admin();
  const { data: pay } = await db.from('lipila_payments').select('user_id, amount, status').eq('reference_id', referenceId).maybeSingle();
  if (!pay) return { status: 'unknown' };
  const amt = Number(body?.amount ?? body?.data?.amount ?? pay.amount);
  const final = status === 'completed' && amt < PRICE_ZMW ? 'failed' : status;
  await db.from('lipila_payments').update({ status: final, raw: body, updated_at: new Date().toISOString() }).eq('reference_id', referenceId);
  if (final === 'completed') {
    await db.from('lesson_access').upsert({ user_id: pay.user_id, payment_reference: referenceId });
  }
  return { status: final };
}

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { confirmPayment } from '../_shared/lipila.ts';

async function hmacOk(raw: string, sig: string | null) {
  const secret = Deno.env.get('LIPILA_WEBHOOK_SECRET');
  if (!secret || !sig) return null; // no signature to compare
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = btoa(String.fromCharCode(...mac));
  const s = sig.replace(/^sha256=/, '').trim();
  return s === hex || s === b64;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const raw = await req.text();
  const sig = req.headers.get('x-signature') ?? req.headers.get('x-lipila-signature') ?? req.headers.get('signature');
  if ((await hmacOk(raw, sig)) === false) return new Response('bad signature', { status: 401, headers: corsHeaders });
  let body: any = {};
  try { body = JSON.parse(raw); } catch { /* ignore */ }
  const ref = String(body?.referenceId ?? body?.data?.referenceId ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(ref)) return new Response('ok', { headers: corsHeaders });
  // Status is always re-confirmed with Lipila before access is granted.
  await confirmPayment(ref);
  return new Response('ok', { headers: corsHeaders });
});

import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC = 'BMBZhTrwHT_ZCZd7I3H-TTKgHL4JSPsTuP1LR9_iJOtbrC0KucFMrqhTkxdzK4KRg-liA6tf4Aqs0himS1s8MrU';

const toKey = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.self === window.top;

/** Asks permission, subscribes this device and saves it to the learner's account. */
export async function enablePush(): Promise<NotificationPermission> {
  if (!pushSupported()) return 'denied';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm;
  await syncPush();
  return perm;
}

/** Re-saves an existing subscription (call on load when permission is granted). */
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const reg = await navigator.serviceWorker.register('/push-sw.js', { scope: '/push/' });
  await navigator.serviceWorker.ready.catch(() => undefined);
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID_PUBLIC) });
  const j = sub.toJSON();
  if (!j.endpoint || !j.keys) return;
  await supabase.from('push_subscriptions').upsert({ endpoint: j.endpoint, user_id: user.id, p256dh: j.keys.p256dh, auth: j.keys.auth });
}

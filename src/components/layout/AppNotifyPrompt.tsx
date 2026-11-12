import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enablePush, pushSupported, syncPush } from '@/lib/push';
import { isStandalone } from '@/lib/pwa';
import { useAuth } from '@/hooks/useAuth';

/** In the installed app, asks once per launch to turn on reminders until the learner decides. */
export function AppNotifyPrompt() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [perm, setPerm] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'denied'));
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('finlit-notify-hide') === '1');

  // Save this device for reminders whenever permission exists and someone is signed in.
  useEffect(() => { if (user) syncPush().catch(() => undefined); }, [user]);

  if (!pushSupported() || !isStandalone() || perm !== 'default' || hidden) return null;
  if (/^\/(admin|facilitator)/.test(pathname)) return null;

  const later = () => { sessionStorage.setItem('finlit-notify-hide', '1'); setHidden(true); };
  const allow = async () => setPerm(await enablePush().catch(() => Notification.permission));

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-foreground/40 p-3">
      <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card p-5 shadow-lg text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-6 w-6 text-primary" />
        </div>
        <div className="text-lg font-semibold text-foreground">Don't lose your coin streak 🪙</div>
        <p className="mt-1 text-sm text-muted-foreground">Turn on reminders and we'll nudge you once a day when it's time to learn.</p>
        <Button className="mt-4 w-full" onClick={allow}>Turn on reminders</Button>
        <button onClick={later} className="mt-2 w-full text-sm text-muted-foreground py-1">Not now</button>
      </div>
    </div>
  );
}

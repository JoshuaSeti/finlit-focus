import { useEffect, useState } from 'react';
import { Download, Share, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { enablePush, syncPush } from '@/lib/push';

import { useInstall, isIOS } from '@/lib/pwa';

export function InstallPrompt() {
  const { evt, installed, install } = useInstall();
  const [notif, setNotif] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  // While the app is open, remind at the learner's usual hour if they haven't studied today.
  useEffect(() => {
    if (notif !== 'granted') return;
    const t = setInterval(() => {
      const hour = Number(localStorage.getItem('finlit-study-hour'));
      const today = new Date().toDateString();
      if (!Number.isNaN(hour) && new Date().getHours() === hour && localStorage.getItem('finlit-reminded') !== today) {
        localStorage.setItem('finlit-reminded', today);
        navigator.vibrate?.([300, 100, 300]);
      }
    }, 60000);
    return () => clearInterval(t);
  }, [notif]);

  useEffect(() => { syncPush().catch(() => undefined); }, []);
  const askNotif = async () => { if (typeof Notification !== 'undefined') setNotif(await enablePush().catch(() => Notification.permission)); };

  return (
    <div className="space-y-3">
      {!installed && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="font-semibold text-foreground">Get the FinLit app</div>
          <p className="text-sm text-muted-foreground mt-1">Install it on your phone for faster lessons and one-tap access every day.</p>
          {evt ? (
            <Button size="sm" className="mt-3" onClick={install}>
              <Download className="w-4 h-4 mr-1" />Install app
            </Button>
          ) : isIOS() ? (
            <p className="text-sm mt-3 flex flex-wrap items-center gap-1 text-foreground">Tap <Share className="w-4 h-4" /> Share, then “Add to Home Screen”.</p>
          ) : (
            <p className="text-sm mt-3 text-foreground">Open your browser menu (⋮) and tap “Install app” or “Add to Home screen”.</p>
          )}
        </div>
      )}
      {notif === 'default' && (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground flex-1">Turn on reminders so your yungsta never loses its coin streak 🪙</p>
          <Button size="sm" variant="outline" onClick={askNotif}>Remind me</Button>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstall, isIOS } from '@/lib/pwa';

/** Small install bar shown on every public/learner page until the app is installed. */
export function GlobalInstallBanner() {
  const { pathname } = useLocation();
  const { evt, installed, install } = useInstall();
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('finlit-install-hide') === '1');
  if (installed || hidden || window.self !== window.top) return null;
  if (/^\/(admin|facilitator)/.test(pathname) || pathname === '/modules') return null;
  const close = () => { sessionStorage.setItem('finlit-install-hide', '1'); setHidden(true); };
  return (
    <div className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-md rounded-2xl border border-primary/30 bg-card p-3 shadow-lg flex items-center gap-3">
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">Get the FinLit app</div>
        {evt ? (
          <div className="text-xs text-muted-foreground">One tap to your lessons every day.</div>
        ) : isIOS() ? (
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">Tap <Share className="w-3 h-3" /> then “Add to Home Screen”.</div>
        ) : (
          <div className="text-xs text-muted-foreground">Browser menu (⋮) → “Install app”.</div>
        )}
      </div>
      {evt && <Button size="sm" onClick={install}><Download className="w-4 h-4 mr-1" />Install</Button>}
      <button onClick={close} aria-label="Hide" className="text-muted-foreground p-1"><X className="w-4 h-4" /></button>
    </div>
  );
}

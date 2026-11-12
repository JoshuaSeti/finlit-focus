import { useEffect, useState } from 'react';

export type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type W = Window & { __bip?: BIP | null };

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Shared install state; the browser's install offer is captured early in index.html. */
export function useInstall() {
  const [evt, setEvt] = useState<BIP | null>(() => (window as W).__bip ?? null);
  const [installed, setInstalled] = useState(isStandalone());
  useEffect(() => {
    const sync = () => { setEvt((window as W).__bip ?? null); if (!(window as W).__bip && isStandalone()) setInstalled(true); };
    const done = () => setInstalled(true);
    window.addEventListener('finlit-bip', sync);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('finlit-bip', sync); window.removeEventListener('appinstalled', done); };
  }, []);
  const install = async () => {
    if (!evt) return false;
    await evt.prompt();
    const c = await evt.userChoice;
    (window as W).__bip = null;
    setEvt(null);
    if (c.outcome === 'accepted') setInstalled(true);
    return c.outcome === 'accepted';
  };
  return { evt, installed, install };
}

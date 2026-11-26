import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeZmPhone } from '@/lib/placement';
import { Celebration } from '@/components/Celebration';

/** K20 one-time unlock for the full lesson experience, paid by mobile money via Lipila. */
const Paywall = ({ signedIn, onUnlocked, title = 'Unlock every lesson', note }: { signedIn: boolean; onUnlocked: () => void; title?: string; note?: string }) => {
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [state, setState] = useState<'idle' | 'starting' | 'waiting' | 'failed'>('idle');
  const [msg, setMsg] = useState('');
  const [showCelebrate, setShowCelebrate] = useState(false);

  const poll = async (referenceId: string) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const { data } = await supabase.functions.invoke('lipila-pay', { body: { action: 'check', referenceId } });
      if (data?.status === 'completed') {
        setShowCelebrate(true);
        setTimeout(() => onUnlocked(), 2000);
        return;
      }
      if (data?.status === 'failed') {
        setState('failed');
        setMsg('The payment did not go through. Please try again.');
        return;
      }
    }
    setState('failed');
    setMsg('We have not received confirmation yet. If you approved the prompt, refresh this page in a moment.');
  };

  const pay = async () => {
    const num = normalizeZmPhone(phone);
    if (!num) {
      setState('failed');
      setMsg('Please enter a valid Airtel, MTN, or Zamtel mobile number.');
      return;
    }
    setState('starting');
    setMsg('');
    setSubmittedPhone(num);

    const { data, error } = await supabase.functions.invoke('lipila-pay', {
      body: { action: 'start', phone: num },
    });

    if (error || !data?.referenceId) {
      setState('failed');
      setMsg(data?.error || 'Could not initiate payment. Please verify the number and try again.');
      return;
    }

    setState('waiting');
    poll(data.referenceId);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
        <p className="text-sm text-muted-foreground">
          One payment of <strong className="text-foreground">K20</strong> opens all lessons, your Yungsta practice, and certificates.
        </p>

        {!signedIn ? (
          <Button asChild className="w-full">
            <Link to="/login">Sign in to unlock</Link>
          </Button>
        ) : state === 'waiting' ? (
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            <p className="font-medium text-foreground">Prompt sent to +{submittedPhone}</p>
            <p className="text-xs">
              Check the phone now and enter the mobile money PIN to approve <strong>K20</strong>.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setState('idle'); setMsg(''); }}
            >
              Try a different number
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-left">
            <div>
              <label htmlFor="momo-phone" className="block text-xs font-medium text-foreground mb-1">
                Payer's Mobile Money Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="momo-phone"
                  inputMode="tel"
                  placeholder="e.g. 097 123 4567 or 096..."
                  className="pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') pay(); }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Enter your number, or a parent's/sponsor's number paying for you.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={pay}
              disabled={state === 'starting' || !normalizeZmPhone(phone)}
            >
              {state === 'starting' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending prompt…
                </>
              ) : (
                'Send K20 Mobile Money Prompt'
              )}
            </Button>
          </div>
        )}

        {msg && <p className="text-xs text-destructive">{msg}</p>}
      </div>

      <Celebration
        active={showCelebrate}
        onComplete={() => setShowCelebrate(false)}
        title="Yoooooo!!! Payment Confirmed! 🪙"
        subtitle="All lessons, Yungsta practice, and certificates are now unlocked."
      />
    </div>
  );
};

export default Paywall;

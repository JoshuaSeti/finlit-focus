import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** K20 one-time unlock for the full lesson experience, paid by mobile money via Lipila. */
const Paywall = ({ signedIn, onUnlocked }: { signedIn: boolean; onUnlocked: () => void }) => {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'starting' | 'waiting' | 'failed'>('idle');
  const [msg, setMsg] = useState('');

  const poll = async (referenceId: string) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const { data } = await supabase.functions.invoke('lipila-pay', { body: { action: 'check', referenceId } });
      if (data?.status === 'completed') return onUnlocked();
      if (data?.status === 'failed') { setState('failed'); setMsg('The payment did not go through. Please try again.'); return; }
    }
    setState('failed');
    setMsg('We have not received confirmation yet. If you paid, refresh this page in a minute.');
  };

  const pay = async () => {
    setState('starting'); setMsg('');
    const { data, error } = await supabase.functions.invoke('lipila-pay', { body: { action: 'start', phone: phone.replace(/\s|\+/g, '') } });
    if (error || !data?.referenceId) {
      setState('failed');
      setMsg(data?.error || 'Please check your number and try again.');
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
        <h2 className="text-xl font-semibold text-foreground">Unlock every lesson</h2>
        <p className="text-sm text-muted-foreground">
          One payment of <strong className="text-foreground">K20</strong> opens all lessons, your yungsta practice and certificates.
        </p>
        {!signedIn ? (
          <Button asChild className="w-full"><Link to="/login">Sign in to unlock</Link></Button>
        ) : state === 'waiting' ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
            <p>Check your phone and enter your mobile money PIN to approve K20.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Input inputMode="tel" placeholder="Airtel, MTN or Zamtel number e.g. 0971234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button className="w-full" onClick={pay} disabled={state === 'starting' || phone.length < 9}>
              {state === 'starting' ? 'Sending request…' : 'Pay K20 with mobile money'}
            </Button>
          </div>
        )}
        {msg && <p className="text-sm text-destructive">{msg}</p>}
      </div>
    </div>
  );
};

export default Paywall;

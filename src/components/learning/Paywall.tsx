import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeZmPhone } from '@/lib/placement';
import { Celebration } from '@/components/Celebration';

const verifiedZmPhone = (u: { phone?: string | null; phone_confirmed_at?: string | null } | null) =>
  u?.phone_confirmed_at ? normalizeZmPhone(u.phone ?? '') : null;

/** K20 one-time unlock for the full lesson experience, paid by mobile money via Lipila. */
const Paywall = ({ signedIn, onUnlocked, title = 'Unlock every lesson', note }: { signedIn: boolean; onUnlocked: () => void; title?: string; note?: string }) => {
  const { user } = useAuth();
  const [verified, setVerified] = useState<string | null>(() => verifiedZmPhone(user));
  const [phone, setPhone] = useState('');
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [state, setState] = useState<'idle' | 'sending_code' | 'verifying_code' | 'starting' | 'waiting' | 'failed'>('idle');
  const [msg, setMsg] = useState('');
  const [showCelebrate, setShowCelebrate] = useState(false);

  useEffect(() => {
    setVerified(verifiedZmPhone(user));
  }, [user?.phone, user?.phone_confirmed_at]);

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
    setMsg('We have not received confirmation yet. If you paid, refresh this page in a minute.');
  };

  const sendCode = async () => {
    const num = normalizeZmPhone(phone);
    if (!num) { setState('failed'); setMsg('Please enter a valid Airtel, MTN or Zamtel number.'); return; }
    setState('sending_code'); setMsg('');
    const { error } = await supabase.auth.updateUser({ phone: `+${num}` });
    if (error) {
      setState('failed');
      setMsg(
        /sms|phone provider|unsupported/i.test(error.message)
          ? 'Mobile number verification is being set up. Please try again shortly or contact FinLit.'
          : error.message,
      );
      return;
    }
    setPendingPhone(num);
    setOtp('');
    setState('idle');
  };

  const confirmCode = async () => {
    if (!pendingPhone || otp.trim().length < 4) { setState('failed'); setMsg('Enter the verification code sent to your phone.'); return; }
    setState('verifying_code'); setMsg('');
    const { error } = await supabase.auth.verifyOtp({ phone: `+${pendingPhone}`, token: otp.trim(), type: 'phone_change' });
    if (error) { setState('failed'); setMsg('That code did not match or has expired. Please try again.'); return; }
    const { data } = await supabase.auth.getUser();
    const confirmed = verifiedZmPhone(data.user) ?? pendingPhone;
    setVerified(confirmed);
    setPendingPhone(null);
    setOtp('');
    setState('idle');
  };

  const pay = async () => {
    if (!verified) { setState('failed'); setMsg('Please verify your mobile number first.'); return; }
    setState('starting'); setMsg('');
    const { data, error } = await supabase.functions.invoke('lipila-pay', { body: { action: 'start' } });
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
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
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
        ) : verified ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Verified number: <strong>+{verified}</strong></span>
            </div>
            <Button className="w-full" onClick={pay} disabled={state === 'starting'}>
              {state === 'starting' ? 'Sending request…' : 'Pay K20 with mobile money'}
            </Button>
          </div>
        ) : pendingPhone ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Enter the SMS code sent to <strong>+{pendingPhone}</strong> to confirm this number belongs to you.</p>
            <Input inputMode="numeric" placeholder="6-digit verification code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={10} />
            <Button className="w-full" onClick={confirmCode} disabled={state === 'verifying_code' || otp.trim().length < 4}>
              {state === 'verifying_code' ? 'Verifying…' : 'Verify mobile number'}
            </Button>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => { setPendingPhone(null); setOtp(''); setMsg(''); }}>
              Use a different number
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Verify your own mobile money number first so payment prompts only go to you.</p>
            <Input inputMode="tel" placeholder="e.g. 0971234567 or +260971234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button className="w-full" onClick={sendCode} disabled={state === 'sending_code' || !normalizeZmPhone(phone)}>
              {state === 'sending_code' ? 'Sending code…' : 'Send verification code'}
            </Button>
          </div>
        )}
        {msg && <p className="text-sm text-destructive">{msg}</p>}
      </div>
      <Celebration
        active={showCelebrate}
        onComplete={() => setShowCelebrate(false)}
        title="Payment Confirmed! 🪙"
        subtitle="All lessons, Yungsta practice and certificates are now unlocked."
      />
    </div>
  );
};

export default Paywall;

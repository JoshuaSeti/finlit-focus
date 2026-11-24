import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { isRecoveryLink, resetLoginPath } from '@/lib/password-reset';
import finlitLogo from '@/assets/finlit-logo.png';

// Capture before the auth client consumes and clears the URL fragment.
const arrivedWithRecoveryLink = isRecoveryLink(window.location.hash);

export default function ResetPassword() {
  const [params] = useSearchParams();
  const login = resetLoginPath(params.get('from'));
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let recovery = arrivedWithRecoveryLink;
    const validate = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (active) setStatus(recovery && data.user && !error ? 'ready' : 'invalid');
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recovery = true;
        setTimeout(() => { if (active) void validate(); }, 0);
      }
      if (event === 'SIGNED_OUT' && active) setStatus(previous => previous === 'done' ? previous : 'invalid');
    });
    void validate();
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    if (status !== 'ready') return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('done');
      setPassword('');
      setConfirm('');
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update your password. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-card border rounded-lg shadow-lg p-6 sm:p-8">
        <img src={finlitLogo} alt="FinLit" className="h-16 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground">Choose a new password</h1>
        {status === 'checking' && <p role="status" className="mt-4 text-muted-foreground">Checking your reset link…</p>}
        {status === 'invalid' && <div className="mt-4 space-y-4">
          <p role="alert" className="text-muted-foreground">This reset link is invalid or has expired. Request a new link to continue.</p>
          <Button asChild className="w-full"><Link to={`/forgot-password?from=${encodeURIComponent(login)}`}>Request a new link</Link></Button>
        </div>}
        {status === 'done' && <p role="status" className="mt-4 text-muted-foreground">Your password has been updated. Sign in with your new password.</p>}
        {status === 'ready' && <form onSubmit={submit} className="mt-5 space-y-4">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving…' : 'Save new password'}</Button>
        </form>}
        <Button asChild variant="link" className="mt-5 px-0"><Link to={login}>← Back to sign in</Link></Button>
      </section>
    </main>
  );
}
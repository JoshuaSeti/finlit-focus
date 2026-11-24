import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { resetLoginPath } from '@/lib/password-reset';
import finlitLogo from '@/assets/finlit-logo.png';

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const login = resetLoginPath(params.get('from'));
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password?from=${encodeURIComponent(login)}`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError('We could not send the reset link. Please try again shortly.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-card border rounded-lg shadow-lg p-6 sm:p-8">
        <img src={finlitLogo} alt="FinLit" className="h-16 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
        {sent ? (
          <div role="status" className="mt-4 space-y-3 text-muted-foreground">
            <p>If an account uses that email, you’ll receive a link to choose a new password.</p>
            <p>Check your inbox and spam folder.</p>
            <Button variant="link" className="px-0" onClick={() => setSent(false)}>Use another email</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">Enter your account email to receive a reset link.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={sending}>{sending ? 'Sending…' : 'Send reset link'}</Button>
          </form>
        )}
        <Button asChild variant="link" className="mt-5 px-0"><Link to={login}>← Back to sign in</Link></Button>
      </section>
    </main>
  );
}
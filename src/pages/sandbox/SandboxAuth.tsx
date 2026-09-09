import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import finlitLogo from '@/assets/finlit-logo.png';

const SandboxAuth = () => {
  const navigate = useNavigate();
  const { signIn, user, isLoading: authLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/sandbox', { replace: true });
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setIsLoading(false);
      if (error) {
        setError('Invalid email or password.');
        return;
      }
      navigate('/sandbox');
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/sandbox`,
        data: { full_name: fullName },
      },
    });
    setIsLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already')
          ? 'That email already has an account. Try signing in instead.'
          : signUpError.message,
      );
      return;
    }

    if (data.session) {
      navigate('/sandbox');
    } else {
      setNotice('Check your email to confirm your account, then come back and sign in.');
      setMode('signin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src={finlitLogo} alt="FinLit" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">FinLit Sandbox</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Free courses open to everyone. Create an account to save your progress.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {notice && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-foreground">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError('');
                setNotice('');
              }}
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxAuth;

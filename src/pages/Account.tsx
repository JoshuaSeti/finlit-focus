import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const AVATARS = ['🦁', '🐘', '🦒', '🦓', '🐆', '🦅', '🐊', '🦬', '🌍', '🌻', '⚡', '🚀', '💡', '🎯', '🌳', '🪙'];

const Account = () => {
  const { user, isLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [f, setF] = useState({ full_name: '', display_name: '', avatar: '🦁', town: '', bio: '', show_publicly: false });
  const [pw, setPw] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name,display_name,avatar,town,bio,show_publicly').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => data && setF({
        full_name: data.full_name || '', display_name: data.display_name || '', avatar: data.avatar || '🦁',
        town: data.town || '', bio: data.bio || '', show_publicly: !!data.show_publicly,
      }));
  }, [user?.id]);

  if (isLoading) return null;
  if (!user) return <Navigate to="/login?mode=signin&next=/account" replace />;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from('profiles').update({
      full_name: f.full_name.trim().slice(0, 80), display_name: f.display_name.trim().slice(0, 40) || null,
      avatar: f.avatar, town: f.town.trim().slice(0, 40) || null, bio: f.bio.trim().slice(0, 140) || null,
      show_publicly: f.show_publicly,
    }).eq('user_id', user.id);
    setBusy(false);
    toast(error ? { title: 'Could not save', description: error.message, variant: 'destructive' } : { title: 'Profile saved' });
  };

  const changePw = async () => {
    if (pw.a.length < 6) return toast({ title: 'Use at least 6 characters', variant: 'destructive' });
    if (pw.a !== pw.b) return toast({ title: 'The two passwords do not match', variant: 'destructive' });
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    if (!error) setPw({ a: '', b: '' });
    toast(error ? { title: 'Could not change password', description: error.message, variant: 'destructive' } : { title: 'Password changed' });
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Layout>
      <section className="container mx-auto px-4 pt-32 pb-16 max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent grid place-items-center text-4xl">{f.avatar}</div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">My account</h1>
            <p className="text-sm text-muted-foreground break-all">{user.email}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-5">
          <h2 className="font-semibold text-foreground">Profile</h2>
          <div>
            <Label>Pick your avatar</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {AVATARS.map((a) => (
                <button key={a} type="button" onClick={() => setF({ ...f, avatar: a })} aria-label={`Avatar ${a}`}
                  className={`aspect-square rounded-xl text-2xl grid place-items-center border ${f.avatar === a ? 'border-primary bg-accent' : 'border-border bg-background'}`}>{a}</button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Full name</Label><Input value={f.full_name} onChange={set('full_name')} maxLength={80} /></div>
            <div><Label>Name others see</Label><Input value={f.display_name} onChange={set('display_name')} maxLength={40} placeholder="e.g. Mwila" /></div>
            <div className="sm:col-span-2"><Label>Town (optional)</Label><Input value={f.town} onChange={set('town')} maxLength={40} placeholder="e.g. Kitwe" /></div>
            <div className="sm:col-span-2"><Label>A line about you (optional)</Label><Textarea value={f.bio} onChange={set('bio')} maxLength={140} rows={2} placeholder="e.g. Saving up for my first tuck shop" /></div>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/50 p-4">
            <div>
              <p className="font-medium text-foreground">Show me on Friends of FinLit</p>
              <p className="text-sm text-muted-foreground">Your avatar, name, town and line appear on the About page as a FinLit Learner. Your email is never shown.</p>
            </div>
            <Switch checked={f.show_publicly} onCheckedChange={(v) => setF({ ...f, show_publicly: v })} aria-label="Show me on Friends of FinLit" />
          </div>
          <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-4">
          <h2 className="font-semibold text-foreground">Change password</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>New password</Label><Input type="password" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} /></div>
            <div><Label>Type it again</Label><Input type="password" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} /></div>
          </div>
          <Button variant="outline" onClick={changePw}>Update password</Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/modules"><Button variant="outline">Back to my lessons</Button></Link>
          <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
        </div>
      </section>
    </Layout>
  );
};

export default Account;

import { useEffect, useRef, useState } from 'react';
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
import { LearnerAvatar } from '@/components/community/LearnerAvatar';
import { whatsappInvite } from '@/lib/invite';

export const AVATARS = ['🦁', '🐘', '🦒', '🦓', '🐆', '🦅', '🐊', '🦬', '🌍', '🌻', '⚡', '🚀', '💡', '🎯', '🌳', '🪙'];

const Account = () => {
  const { user, isLoading, signOut } = useAuth();
  const { toast } = useToast();
   const [f, setF] = useState({ 
    full_name: '', 
    display_name: '', 
    avatar: '🦁', 
    town: '', 
    age: '', 
    bio: '', 
    show_publicly: false, 
    avatar_url: '', 
    id: '',
    gender: '' as 'female' | 'male' | '',
    greeting_tone: 'friendly' as 'friendly' | 'professional'
  });
 const [pw, setPw] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState(false);
  const wasPublic = useRef(false);

  useEffect(() => {
    if (!user) return;
     supabase.from('profiles').select('id,full_name,display_name,avatar,avatar_url,town,age,bio,show_publicly,gender,greeting_tone').eq('user_id', user.id).maybeSingle()
      .then(({ data }: any) => { if (data) wasPublic.current = !!data.show_publicly; return data && setF({
        full_name: data.full_name || '', display_name: data.display_name || '', avatar: data.avatar || '🦁',
        town: data.town || '', age: data.age ? String(data.age) : '', bio: data.bio || '', show_publicly: !!data.show_publicly, avatar_url: data.avatar_url || '', id: data.id,
        gender: data.gender || '',
        greeting_tone: data.greeting_tone || 'friendly',
      }); });
  }, [user?.id]);

  if (isLoading) return null;
  if (!user) return <Navigate to="/login?mode=signin&next=/account" replace />;

  const save = async () => {
    setBusy(true);
    // Hiding the card: move the photo to a new file so links already copied stop working.
    let avatarUrl = f.avatar_url;
    if (wasPublic.current && !f.show_publicly && avatarUrl) {
      const m = avatarUrl.match(/avatars\/([^?]+)/);
      const old = m ? decodeURIComponent(m[1]) : null;
      if (old && old.startsWith(`${user.id}/`)) {
        const next = `${user.id}/${crypto.randomUUID()}.${old.split('.').pop() || 'jpg'}`;
        const { error: mvErr } = await supabase.storage.from('avatars').move(old, next);
        const signed = mvErr ? null : await supabase.storage.from('avatars').createSignedUrl(next, 60 * 60 * 24 * 365 * 10);
        if (signed?.data?.signedUrl) avatarUrl = signed.data.signedUrl;
      }
    }
       const { error } = await supabase.from('profiles').update({
      full_name: f.full_name.trim().slice(0, 80), display_name: f.display_name.trim().slice(0, 40) || null,
      avatar: f.avatar, town: f.town.trim().slice(0, 40) || null, age: (() => { const n = parseInt(f.age, 10); return n >= 5 && n <= 120 ? n : null; })(), bio: f.bio.trim().slice(0, 140) || null,
      show_publicly: f.show_publicly, avatar_url: avatarUrl || null,
      gender: f.gender || null,
      greeting_tone: f.greeting_tone || 'friendly',
    } as any).eq('user_id', user.id);
    if (!error && !f.avatar_url) {
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files?.length) await supabase.storage.from('avatars').remove(files.map((x) => `${user.id}/${x.name}`));
    }
    if (!error) { wasPublic.current = f.show_publicly; if (avatarUrl !== f.avatar_url) setF((p) => ({ ...p, avatar_url: avatarUrl })); }
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

  // Deleting the old file makes any previously shared photo link stop working.
  const removeOldAvatar = async (oldUrl: string, keep?: string) => {
    const m = oldUrl?.match(/avatars\/([^?]+)/);
    const old = m ? decodeURIComponent(m[1]) : null;
    if (old && old !== keep && old.startsWith(`${user.id}/`)) await supabase.storage.from('avatars').remove([old]);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast({ title: 'Please pick a photo', variant: 'destructive' });
    if (file.size > 3 * 1024 * 1024) return toast({ title: 'Photo must be under 3MB', variant: 'destructive' });
    setBusy(true);
    const path = `${user.id}/${Date.now()}.${(file.name.split('.').pop() || 'jpg').toLowerCase()}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
    const signed = error ? null : await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    const url = signed?.data?.signedUrl;
    if (url) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      await removeOldAvatar(f.avatar_url, path);
    }
    setBusy(false);
    if (!url) return toast({ title: 'Upload failed', description: error?.message, variant: 'destructive' });
    setF((p) => ({ ...p, avatar_url: url }));
    toast({ title: 'Photo updated' });
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Layout>
      <section className="container mx-auto px-4 pt-32 pb-16 max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <LearnerAvatar url={f.avatar_url} emoji={f.avatar} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">My account</h1>
            <p className="text-sm text-muted-foreground break-all">{user.email}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft space-y-5">
          <h2 className="font-semibold text-foreground">Profile</h2>
          <div className="flex items-center gap-4">
            <LearnerAvatar url={f.avatar_url} emoji={f.avatar} size={80} />
            <div className="space-y-2">
              <Label htmlFor="photo" className="inline-flex cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent">{f.avatar_url ? 'Change photo' : 'Upload a photo'}</Label>
              <input id="photo" type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
              {f.avatar_url && <button type="button" className="block text-xs text-muted-foreground underline" onClick={() => setF({ ...f, avatar_url: '' })}>Use an emoji instead (then save)</button>}
            </div>
          </div>
          <div>
            <Label>Or pick an emoji</Label>
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
                    <div className="sm:col-span-2"><Label>Age</Label><Input type="number" inputMode="numeric" min={5} max={120} value={f.age} onChange={set('age')} placeholder="e.g. 24" /></div>

            {/* Gender Selection */}
            <div>
              <Label>Gender</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setF({ ...f, gender: f.gender === 'female' ? '' : 'female' })}
                  className={`py-2 px-3 text-sm rounded-xl font-medium border transition-colors ${
                    f.gender === 'female'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setF({ ...f, gender: f.gender === 'male' ? '' : 'male' })}
                  className={`py-2 px-3 text-sm rounded-xl font-medium border transition-colors ${
                    f.gender === 'male'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  Male
                </button>
              </div>
            </div>

            {/* Greeting Tone Selection */}
            <div>
              <Label>Greeting Tone</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setF({ ...f, greeting_tone: 'friendly' })}
                  className={`py-2 px-3 text-sm rounded-xl font-medium border transition-colors ${
                    f.greeting_tone === 'friendly'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  Friendly & Warm
                </button>
                <button
                  type="button"
                  onClick={() => setF({ ...f, greeting_tone: 'professional' })}
                  className={`py-2 px-3 text-sm rounded-xl font-medium border transition-colors ${
                    f.greeting_tone === 'professional'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background text-muted-foreground'
                  }`}
                >
                  Strictly Professional
                </button>
              </div>
            </div>

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

        {f.id && (
          <div className="bg-card rounded-2xl p-6 shadow-soft space-y-3">
            <h2 className="font-semibold text-foreground">Invite friends</h2>
            <p className="text-sm text-muted-foreground">Share your FinLit card. Friends who add you can see your streak, lessons and Yungsta mood — never your email or age.</p>
            <div className="flex flex-wrap gap-2">
              <a href={whatsappInvite(f.id)} target="_blank" rel="noreferrer"><Button className="rounded-full">Share on WhatsApp</Button></a>
              <Link to={`/u/${f.id}`}><Button variant="outline" className="rounded-full">View my card</Button></Link>
            </div>
          </div>
        )}

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

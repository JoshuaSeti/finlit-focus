import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Copy } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LearnerAvatar } from '@/components/community/LearnerAvatar';
import type { Card } from '@/components/community/FriendsCircle';
import { profileLink, whatsappInvite } from '@/lib/invite';

const LearnerCard = () => {
  const { id = '' } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [c, setC] = useState<Card | null | undefined>(undefined);
  const load = () => supabase.rpc('learner_card', { p_profile: id }).then(({ data }) => setC((data as unknown as Card) || null));
  useEffect(() => { if (!isLoading) load(); }, [id, isLoading, user?.id]);

  const add = async () => {
    const { error } = await supabase.rpc(c?.is_friend ? 'remove_friend' : 'add_friend', { p_profile: id });
    if (error) toast({ title: 'Something went wrong', description: error.message, variant: 'destructive' }); else load();
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 pt-32 pb-16 max-w-md">
        {c === undefined ? null : !c ? (
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">Sign in to see this learner's card and add them as a friend.</p>
            <Link to={`/login?mode=signup&next=/u/${id}`}><Button className="rounded-full">Join FinLit</Button></Link>
          </div>
        ) : (
          <div className="bg-card rounded-3xl p-6 shadow-soft text-center">
            <div className="flex justify-center"><LearnerAvatar url={c.avatar_url} emoji={c.avatar} size={112} /></div>
            <h1 className="text-2xl font-bold text-foreground mt-3">{c.name}</h1>
            <span className="inline-block mt-1 text-xs font-semibold rounded-full px-3 py-0.5 bg-primary/15 text-foreground">FinLit Learner</span>
            {c.town && <p className="text-sm text-muted-foreground mt-2">{c.town}</p>}
            {c.bio && <p className="text-sm text-foreground mt-2">{c.bio}</p>}
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="rounded-2xl bg-muted/50 p-3"><p className="text-xl font-bold text-foreground">🪙 {c.streak}</p><p className="text-xs text-muted-foreground">day streak</p></div>
              <div className="rounded-2xl bg-muted/50 p-3"><p className="text-xl font-bold text-foreground">{c.lessons}</p><p className="text-xs text-muted-foreground">lessons done</p></div>
              <div className="rounded-2xl bg-muted/50 p-3"><p className="text-sm font-bold text-foreground leading-tight">{c.calm || '—'}</p><p className="text-xs text-muted-foreground">Yungsta mood</p></div>
            </div>
            <div className="flex flex-col gap-2 mt-5">
              {c.is_me ? (
                <>
                  <a href={whatsappInvite(id)} target="_blank" rel="noreferrer"><Button className="rounded-full w-full"><MessageCircle className="w-4 h-4 mr-1" />Share on WhatsApp</Button></a>
                  <Button variant="outline" className="rounded-full" onClick={() => { navigator.clipboard.writeText(profileLink(id)); toast({ title: 'Link copied' }); }}><Copy className="w-4 h-4 mr-1" />Copy my link</Button>
                </>
              ) : user ? (
                <Button className="rounded-full" variant={c.is_friend ? 'outline' : 'default'} onClick={add}>{c.is_friend ? 'Remove friend' : 'Add as friend'}</Button>
              ) : (
                <Link to={`/login?mode=signup&next=/u/${id}`}><Button className="rounded-full w-full">Join FinLit to add {c.name}</Button></Link>
              )}
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};
export default LearnerCard;

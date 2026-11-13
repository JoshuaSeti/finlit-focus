import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LearnerAvatar } from './LearnerAvatar';
import { whatsappInvite } from '@/lib/invite';

export type Card = { id: string; name: string; avatar: string | null; avatar_url: string | null; town: string | null; bio: string | null; streak: number; lessons: number; calm: string | null; is_me?: boolean; is_friend?: boolean };

export function FriendsCircle({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<Card[]>([]);
  const [me, setMe] = useState<{ id: string; show_publicly: boolean } | null>(null);
  useEffect(() => {
    supabase.rpc('my_friends').then(({ data }) => setFriends((data as unknown as Card[]) || []));
    supabase.from('profiles').select('id,show_publicly').eq('user_id', userId).maybeSingle().then(({ data }) => data && setMe(data));
  }, [userId]);

  const joinShowcase = async () => {
    await supabase.from('profiles').update({ show_publicly: true }).eq('user_id', userId);
    setMe((m) => m && { ...m, show_publicly: true });
  };

  return (
    <div className="space-y-4 mt-4">
      {me && !me.show_publicly && (
        <div className="bg-accent rounded-2xl p-5">
          <p className="font-semibold text-foreground">Join Friends of FinLit?</p>
          <p className="text-sm text-muted-foreground mt-1">Show Zambia you're learning: your photo, name and town on our About page. Your email stays private.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button size="sm" className="rounded-full" onClick={joinShowcase}>Yes, show me</Button>
            <Link to="/account"><Button size="sm" variant="outline" className="rounded-full">Edit my profile</Button></Link>
          </div>
        </div>
      )}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">My study circle</h3></div>
        {friends.length === 0
          ? <p className="text-sm text-muted-foreground mt-2">Invite friends to learn with you and see each other's streaks and progress.</p>
          : <ul className="mt-3 space-y-3">{friends.map((f) => (
              <li key={f.id}><Link to={`/u/${f.id}`} className="flex items-center gap-3 min-w-0">
                <LearnerAvatar url={f.avatar_url} emoji={f.avatar} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground truncate">🪙 {f.streak}-day streak · {f.lessons} lessons{f.calm ? ` · ${f.calm}` : ''}</p>
                </div>
              </Link></li>))}
            </ul>}
        {me && (
          <a href={whatsappInvite(me.id)} target="_blank" rel="noreferrer" className="block mt-4">
            <Button size="sm" variant="outline" className="rounded-full w-full"><MessageCircle className="w-4 h-4 mr-1" />Invite on WhatsApp</Button>
          </a>
        )}
      </div>
    </div>
  );
}

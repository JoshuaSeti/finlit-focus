import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LearnerAvatar } from '@/components/community/LearnerAvatar';

type L = { id: string; name: string; avatar: string; avatar_url: string | null; town: string | null; bio: string | null };

export function FinLitLearners() {
  const [list, setList] = useState<L[]>([]);
  useEffect(() => { supabase.rpc('public_learners').then(({ data }) => setList((data as L[]) || [])); }, []);
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Friends of FinLit</p>
          <h2 className="text-3xl font-bold text-foreground mt-1">Zambians learning with us</h2>
          <p className="text-muted-foreground mt-2">Learners who chose to show themselves here. Money skills are for everyone.</p>
        </div>
        {list.length === 0 ? (
          <p className="text-center text-muted-foreground">Be the first: turn on “Show me on Friends of FinLit” in <Link to="/account" className="text-primary underline">your account</Link>.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((l) => (
              <Link to={`/u/${l.id}`} key={l.id} className="bg-card rounded-2xl p-4 shadow-soft text-center min-w-0 block hover:shadow-md transition-shadow">
                <div className="flex justify-center"><LearnerAvatar url={l.avatar_url} emoji={l.avatar} size={72} /></div>
                <p className="font-semibold text-foreground mt-2 truncate">{l.name}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold rounded-full px-2 py-0.5 bg-primary/15 text-foreground">FinLit Learner</span>
                {l.town && <p className="text-xs text-muted-foreground mt-1 truncate">{l.town}</p>}
                {l.bio && <p className="text-xs text-muted-foreground mt-2 break-words">{l.bio}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Copy, MapPin, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Celebration } from '@/components/Celebration';
import { FitName } from '@/components/team/FitName';
import { splitName } from '@/lib/team';
import { shareableProfileLink, whatsappInvite } from '@/lib/invite';
import type { Card } from '@/components/community/FriendsCircle';

const nameClass =
  "relative z-0 block max-w-full select-none whitespace-nowrap text-center font-black uppercase leading-[0.85] tracking-tighter text-[length:clamp(3rem,15vw,6rem)] text-primary/20 dark:text-primary/15 transition-all";

const LearnerCard = () => {
  const { id = '' } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [c, setC] = useState<Card | null | undefined>(undefined);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const load = () =>
    supabase
      .rpc('learner_card', { p_profile: id })
      .then(({ data }) => setC((data as unknown as Card) || null));

  useEffect(() => {
    if (!isLoading) load();
  }, [id, isLoading, user?.id]);

  const add = async () => {
    const { error } = await supabase.rpc(
      c?.is_friend ? 'remove_friend' : 'add_friend',
      { p_profile: id }
    );
    if (error) {
      toast({
        title: 'Something went wrong',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      if (!c?.is_friend) setShowCelebrate(true);
      load();
    }
  };

  const nameParts = c?.name ? splitName(c.name, 'LEARNER') : { top: 'FINLIT', bottom: 'LEARNER' };

  return (
    <Layout>
      <section className="container mx-auto px-4 pt-28 pb-16 max-w-md">
        {c === undefined ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !c ? (
          <div className="text-center space-y-4 py-16 bg-card rounded-3xl p-8 border border-border shadow-soft">
            {user ? (
              <>
                <p className="text-muted-foreground text-sm">
                  We couldn't find this learner's card or their profile is private.
                </p>
                <Button asChild className="rounded-full">
                  <Link to="/modules">Back to my lessons</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-sm">
                  Sign in to view this learner's card and connect with them.
                </p>
                <Button asChild className="rounded-full">
                  <Link to={`/login?mode=signup&next=/u/${id}`}>Join FinLit</Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card/90 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-border/70 shadow-card text-center overflow-hidden relative"
          >
            {/* Split Bold Typography Hero */}
            <div className="relative flex flex-col items-center justify-center my-2">
              <FitName aria-hidden className={nameClass + " -mb-3"}>
                {nameParts.top}
              </FitName>

              {/* Elevated Portrait Box */}
              <div className="relative z-10 my-1">
                <div className="h-36 w-32 sm:h-40 sm:w-36 rounded-[2rem] overflow-hidden border-2 border-background/90 shadow-2xl ring-4 ring-primary/10 bg-gradient-to-b from-primary/15 to-primary/5 flex items-center justify-center mx-auto">
                  {c.avatar_url ? (
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="h-full w-full object-cover"
                      loading="eager"
                    />
                  ) : (
                    <span className="text-5xl select-none">
                      {c.avatar || '🦁'}
                    </span>
                  )}
                </div>
              </div>

              <FitName aria-hidden className={nameClass + " -mt-3"}>
                {nameParts.bottom}
              </FitName>
            </div>

            {/* Learner Meta */}
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-4">
              {c.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1 bg-primary/15 text-primary">
                <Sparkles className="w-3 h-3" /> FinLit Learner
              </span>
              {c.town && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
                  <MapPin className="w-3 h-3" /> {c.town}
                </span>
              )}
            </div>

            {c.bio && (
              <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto italic leading-relaxed">
                "{c.bio}"
              </p>
            )}

            {/* Tactile Stats Pill Grid */}
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              <div className="rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/50 p-3 shadow-sm">
                <p className="text-xl font-black text-foreground">🪙 {c.streak}</p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                  Streak
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/50 p-3 shadow-sm">
                <p className="text-xl font-black text-foreground">{c.lessons}</p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                  Lessons
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20 border border-border/50 p-3 shadow-sm">
                <p className="text-sm font-bold text-foreground leading-tight truncate">
                  {c.calm || '—'}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                  Mood
                </p>
              </div>
            </div>

            {/* Social & Connect Action Buttons */}
            <div className="flex flex-col gap-2.5 mt-6">
              {c.is_me ? (
                <>
                  <a href={whatsappInvite(id)} target="_blank" rel="noreferrer" className="w-full">
                    <Button className="rounded-full w-full h-11 font-semibold">
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Share on WhatsApp
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="rounded-full w-full h-11 font-semibold"
                    onClick={() => {
                      navigator.clipboard.writeText(shareableProfileLink(id));
                      toast({ title: 'Link copied to clipboard' });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy my link
                  </Button>
                </>
              ) : user ? (
                <Button
                  className="rounded-full w-full h-11 font-semibold"
                  variant={c.is_friend ? 'outline' : 'default'}
                  onClick={add}
                >
                  {c.is_friend ? 'Remove friend' : 'Add as friend'}
                </Button>
              ) : (
                <Button asChild className="rounded-full w-full h-11 font-semibold">
                  <Link to={`/login?mode=signup&next=/u/${id}`}>
                    Join FinLit to connect with {nameParts.top}
                  </Link>
                </Button>
              )}
            </div>

            {/* Onboarding Call to Action for Visitors */}
            {user && !c.is_me && (
              <div className="mt-6 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Your Next Step
                </p>
                <h4 className="text-sm font-semibold text-foreground mt-1">
                  Start your financial journey
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Take the quick diagnostic to find your starting lesson and level up together with {c.name}.
                </p>
                <Button
                  asChild
                  className="w-full mt-3 rounded-full h-10 text-xs font-bold"
                  variant="default"
                >
                  <Link to="/diagnostic">Take Free Placement Diagnostic →</Link>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </section>

      <Celebration
        active={showCelebrate}
        onComplete={() => setShowCelebrate(false)}
        title="Friend Added! 🎉"
        subtitle={`You and ${c?.name ?? 'your friend'} are now connected on FinLit.`}
      />
    </Layout>
  );
};

export default LearnerCard;

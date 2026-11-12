import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { onStreak, touchStreak, type Streak } from '@/lib/streak';

export function CoinStreak({ signedIn }: { signedIn: boolean }) {
  const [s, setS] = useState<Streak | null>(null);
  useEffect(() => {
    if (!signedIn) return;
    const off = onStreak(setS);
    touchStreak();
    return off;
  }, [signedIn]);
  if (!signedIn || !s) return null;
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 1.2, delay: 0.3 }} className="text-3xl" aria-hidden>🪙</motion.span>
      <div className="min-w-0">
        <div className="font-bold text-foreground">{s.current}-day coin streak</div>
        <div className="text-xs text-muted-foreground">Come back tomorrow to add another coin. Best: {s.longest} days</div>
      </div>
    </motion.div>
  );
}

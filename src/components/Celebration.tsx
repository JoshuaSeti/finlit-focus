import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CelebrationProps = {
  active: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  coinsCount?: number;
};

export function Celebration({
  active,
  onComplete,
  title = "Congratulations! 🪙",
  subtitle = "You're all set to level up your financial journey.",
  coinsCount = 20
}: CelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; scale: number; emoji: string }>>([]);

  useEffect(() => {
    if (active) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
      const emojis = ['🪙', '✨', '🎉', '🌟', '🚀'];
      const newParticles = Array.from({ length: coinsCount }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 320,
        y: -(Math.random() * 260 + 100),
        delay: Math.random() * 0.25,
        scale: Math.random() * 0.5 + 0.8,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-3xl p-6 text-center max-w-xs mx-4"
          >
            <div className="relative h-16 flex items-center justify-center">
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    x: p.x,
                    y: p.y,
                    scale: p.scale,
                    rotate: p.x * 2,
                  }}
                  transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
                  className="absolute text-2xl select-none"
                >
                  {p.emoji}
                </motion.span>
              ))}
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
                🪙
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-2">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

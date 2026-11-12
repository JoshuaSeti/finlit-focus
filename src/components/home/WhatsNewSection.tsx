import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Gamepad2, Coins, Users, ArrowRight, Sparkles, PartyPopper } from 'lucide-react';

const features = [
  { icon: Compass, title: 'Diagnostic & Personal Roadmap', text: 'A quick check-in finds where you need the most help and opens your first lesson free.', cta: 'Take the diagnostic', to: '/diagnostic' },
  { icon: Gamepad2, title: 'Yungsta Simulator', text: 'Guide a young Zambian through real money choices and live with the consequences.', cta: 'Start learning', to: '/modules' },
  { icon: Coins, title: 'Coin Streaks & the FinLit App', text: 'Earn a gold coin every day you learn. Install FinLit on your phone for daily nudges.', cta: 'See lessons', to: '/modules' },
  { icon: Users, title: 'Meet the Team Worlds', text: 'Step into each team member’s world — music, photos, games and notes from visitors.', cta: 'Meet the team', to: '/about' },
];

const Wave = ({ className, d }: { className: string; d: string }) => (
  <motion.path d={d} className={className} fill="none" strokeWidth={6} strokeLinecap="round"
    initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
    transition={{ duration: 2.2, ease: 'easeInOut' }} />
);

export function WhatsNewSection({ onEnter }: { onEnter?: () => void }) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28" style={{ background: 'var(--gradient-hero)' }}>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden>
        <Wave className="stroke-primary/50" d="M-50 140 C 250 40, 450 260, 760 150 S 1250 40, 1500 170" />
        <Wave className="stroke-green-600/30" d="M-50 330 C 300 230, 520 450, 820 330 S 1300 230, 1500 360" />
        <Wave className="stroke-primary/40" d="M-50 560 C 280 470, 500 680, 780 560 S 1280 450, 1500 600" />
        <Wave className="stroke-green-700/20" d="M-50 720 C 340 640, 600 800, 900 700 S 1300 640, 1500 740" />
      </svg>

      {[...Array(14)].map((_, i) => (
        <motion.span key={i} aria-hidden
          className={`pointer-events-none absolute rounded-full ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-green-300' : 'bg-green-600'}`}
          style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 90}%`, width: 6 + (i % 4) * 3, height: 6 + (i % 4) * 3 }}
          animate={{ y: [0, -14, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2 }} />
      ))}

      <div className="container relative mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-1.5 text-sm font-semibold text-green-700">
            <PartyPopper className="h-4 w-4" /> It’s finally here
          </span>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-foreground md:text-6xl">
            Welcome to <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-primary)' }}>FinLit 2.0</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A year in the making. Thank you for waiting with us — here’s everything new for learners across Zambia.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.12 }} whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>
                <f.icon className="h-6 w-6" />
              </div>
              <Sparkles className="absolute right-5 top-5 h-5 w-5 text-primary opacity-60 transition group-hover:rotate-12 group-hover:opacity-100" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.text}</p>
              <Link to={f.to} className="mt-4 inline-flex items-center gap-1 font-semibold text-green-700 hover:gap-2 transition-all">
                {f.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
        {onEnter && (
          <div className="mt-10 text-center">
            <button onClick={onEnter} className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-primary-foreground shadow-lg transition hover:scale-105" style={{ background: 'var(--gradient-primary)' }}>
              Explore FinLit <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

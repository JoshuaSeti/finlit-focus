import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, RefreshCw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  protegeName: string;
  mentorshipScore: number;
  personalScore: number;
  protectedKwacha: number;
  habitName?: string;
  verdict: string;
  onFinish: () => void;
}

const ScoreRing = ({
  value,
  label,
  subtitle,
  strokeClass,
}: {
  value: number;
  label: string;
  subtitle: string;
  strokeClass: string;
}) => {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, value)) / 100) * circ;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-soft">
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/70" />
          <motion.circle
            cx="42"
            cy="42"
            r={r}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={strokeClass}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-base font-bold tracking-tight text-foreground">
          {value}%
        </div>
      </div>
      <div className="min-w-0 space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground/90 leading-snug">{subtitle}</div>
      </div>
    </div>
  );
};

export const AlignmentScorecard: React.FC<Props> = ({
  protegeName,
  mentorshipScore,
  personalScore,
  protectedKwacha,
  habitName,
  verdict,
  onFinish,
}) => {
  const alignmentGap = Math.max(0, mentorshipScore - personalScore);
  const aligned = alignmentGap <= 25;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto my-auto space-y-5 font-apple text-foreground pb-10"
    >
      {/* Editorial Botanical Forest Summary Banner */}
      <div className="finlit-scene-card rounded-[28px] p-6 sm:p-8 text-forest-foreground space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/35 text-primary text-xs font-semibold">
            <Award className="w-3.5 h-3.5" /> Character Debrief
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            aligned ? 'bg-primary/20 text-primary' : 'bg-copper/25 text-copper'
          }`}>
            {verdict}
          </span>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Advice vs. Action</h2>
          <p className="text-sm text-forest-muted leading-relaxed">
            {aligned
              ? 'You practiced the exact financial discipline you taught your Protégé.'
              : `You advised ${protegeName} with clarity, but live temptation pulled your own decision off course.`}
          </p>
        </div>
      </div>

      {/* Apple-Style Dual Progress Rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <ScoreRing
          value={mentorshipScore}
          label="Mentorship"
          subtitle={`Guiding ${protegeName}`}
          strokeClass="stroke-green-600"
        />
        <ScoreRing
          value={personalScore}
          label="Your Hot-Seat"
          subtitle="Under live temptation"
          strokeClass="stroke-copper"
        />
      </div>

      {/* Alignment Gap & Takeaway Strip */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3.5 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Say–Do Alignment Gap
          </span>
          <span className={`text-sm font-bold ${aligned ? 'text-emeraldSoft-ink' : 'text-copper'}`}>
            {alignmentGap === 0 ? '0% · Walked the Talk' : `${alignmentGap}% Gap`}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {protectedKwacha > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emeraldSoft border border-emeraldSoft-border text-emeraldSoft-ink">
              <ShieldCheck className="w-3.5 h-3.5" />
              K{protectedKwacha.toLocaleString()} protected for {protegeName}
            </span>
          )}
          {habitName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-copper-soft border border-copper-border text-copper">
              <RefreshCw className="w-3.5 h-3.5" />
              Habit instilled: {habitName}
            </span>
          )}
        </div>
      </div>

      <Button
        onClick={onFinish}
        size="lg"
        className="w-full rounded-full h-13 py-3.5 text-sm font-semibold bg-forest hover:bg-forest-deep text-forest-foreground shadow-soft"
      >
        Complete Lesson & Return to Lessons
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </motion.div>
  );
};

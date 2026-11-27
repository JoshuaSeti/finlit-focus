import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
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

export const AlignmentScorecard: React.FC<Props> = ({
  protegeName,
  mentorshipScore,
  personalScore,
  protectedKwacha,
  habitName,
  verdict,
  onFinish,
}) => {
  const overallMastery = Math.round((mentorshipScore + personalScore) / 2);
  const hypocrisyIndex = Math.max(0, mentorshipScore - personalScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6 text-foreground"
    >
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" /> Lesson 1 Mastery Debrief
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">The Protégé Alignment Index</h2>
        <p className="text-xs text-muted-foreground">Measuring the gap between financial advice and personal action.</p>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs font-mono uppercase text-muted-foreground">Mentorship Score</span>
          <div className="text-2xl font-black text-foreground">{mentorshipScore}%</div>
          <span className="text-[11px] text-muted-foreground block">
            Guiding {protegeName}
          </span>
        </div>

        <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-1">
          <span className="text-xs font-mono uppercase text-muted-foreground">Personal Execution</span>
          <div className="text-2xl font-black text-foreground">{personalScore}%</div>
          <span className="text-[11px] text-muted-foreground block">
            Under live temptation
          </span>
        </div>
      </div>

      {/* Alignment / Hypocrisy Status */}
      <div className="bg-secondary/60 border border-border rounded-2xl p-4 space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-semibold uppercase tracking-wider">Hypocrisy Gap:</span>
          <span className={hypocrisyIndex > 40 ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
            {hypocrisyIndex === 0 ? '0% (Perfect Alignment)' : `${hypocrisyIndex}% Gap`}
          </span>
        </div>
        <div className="text-sm font-medium text-foreground">
          Verdict: <span className="font-bold text-primary">{verdict}</span>
        </div>
        {protectedKwacha > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>K{protectedKwacha} capital protected for {protegeName}</span>
          </div>
        )}
        {habitName && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Habit instilled: <strong>{habitName}</strong></span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="pt-2 space-y-2">
        <Button onClick={onFinish} className="w-full rounded-full h-12 text-sm font-semibold">
          Complete Lesson 1 & Save Character Evolution <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
};

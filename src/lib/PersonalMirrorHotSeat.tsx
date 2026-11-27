import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { PersonalHotSeatScenario } from '@/lib/simulator-dilemmas';
import { Button } from '@/components/ui/button';

interface Props {
  hotSeat: PersonalHotSeatScenario;
  onDecision: (result: {
    alignmentScore: number;
    hypocrisyScore: number;
    choiceId: string;
    verdict: string;
  }) => void;
}

export const PersonalMirrorHotSeat: React.FC<Props> = ({ hotSeat, onDecision }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedChoice = hotSeat.choices.find((c) => c.id === selectedId);

  const handleConfirm = () => {
    if (!selectedChoice) return;
    onDecision({
      alignmentScore: selectedChoice.alignmentScore,
      hypocrisyScore: selectedChoice.hypocrisyScore,
      choiceId: selectedChoice.id,
      verdict: selectedChoice.verdict,
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* High-Contrast Obsidian Header */}
      <div className="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> The Solomon's Mirror • Hot-Seat
          </span>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800">
            {hotSeat.situationTitle}
          </span>
        </div>

        {/* Incoming Notification Pill */}
        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3.5 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm font-mono text-zinc-300">
            <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Incoming Alert</div>
            <div>{hotSeat.incomingAlert}</div>
          </div>
        </div>

        {/* The Social Temptation */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 text-sm leading-relaxed text-zinc-200">
          <span className="text-zinc-400 font-semibold block text-xs uppercase mb-1">Social Pressure:</span>
          {hotSeat.socialPressure}
        </div>

        {hotSeat.archetypeWarning && (
          <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
            {hotSeat.archetypeWarning}
          </div>
        )}
      </div>

      {/* Decision Choice Cards */}
      <div className="space-y-2.5">
        <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block px-1">
          How do you personally handle this windfall right now?
        </span>

        {hotSeat.choices.map((choice) => {
          const isSelected = selectedId === choice.id;
          return (
            <motion.div
              key={choice.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedId(choice.id)}
              className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 space-y-2 ${
                isSelected
                  ? 'bg-primary/10 border-primary text-foreground shadow-md'
                  : 'bg-card border-border hover:border-primary/40 text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{choice.label}</span>
                {isSelected && <ShieldCheck className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                {choice.actionSummary}
              </p>

              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2 border-t border-border/60 text-xs font-medium text-primary space-y-1"
                >
                  <div>{choice.feedback}</div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {selectedChoice && (
        <div className="pt-2">
          <Button onClick={handleConfirm} className="w-full rounded-full h-11 text-sm font-semibold">
            Lock In Personal Decision <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

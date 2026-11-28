import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalHotSeatScenario } from '@/lib/simulator-dilemmas';

interface Props {
  hotSeat: PersonalHotSeatScenario;
  onDecision: (result: { alignmentScore: number; choiceId: string; verdict: string }) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const PersonalMirrorHotSeat: React.FC<Props> = ({ hotSeat, onDecision }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedChoice = hotSeat.choices.find((c) => c.id === selectedId);
  const isAligned = selectedChoice ? selectedChoice.alignmentScore >= 75 : false;

  const handleConfirm = () => {
    if (!selectedChoice) return;
    onDecision({
      alignmentScore: selectedChoice.alignmentScore,
      choiceId: selectedChoice.id,
      verdict: selectedChoice.verdict,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-36 font-sans">
      {/* Editorial Hot-Seat Scenario Card */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Live Decision</div>
            <div className="text-xs text-muted-foreground">Your Turn · Practical Execution</div>
          </div>
        </div>

        <p className="text-[17px] sm:text-[18px] font-medium leading-relaxed text-foreground">
          {hotSeat.incomingAlert}
        </p>

        {hotSeat.socialPressure && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-1">
            {hotSeat.socialPressure}
          </p>
        )}
      </div>

      {/* Clean Option Cards — Harmonized with Protégé Stage */}
      <div className="space-y-3">
        {hotSeat.choices.map((choice, idx) => {
          const isSelected = selectedId === choice.id;

          return (
            <button
              key={choice.id}
              type="button"
              disabled={!!selectedChoice}
              onClick={() => setSelectedId(choice.id)}
              className={`w-full text-left p-4.5 rounded-xl flex items-start gap-3.5 transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? isAligned
                    ? 'bg-primary/5 border-primary ring-1 ring-primary'
                    : 'bg-muted/80 border-border ring-1 ring-border'
                  : selectedChoice
                  ? 'opacity-40 cursor-not-allowed border-border/40 bg-card'
                  : 'bg-card hover:bg-secondary/40 border-border/70'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                  isSelected
                    ? isAligned
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-foreground text-background border-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {OPTION_LETTERS[idx]}
              </span>
              <div className="flex-1 space-y-1">
                <div className="text-[15px] font-normal leading-relaxed text-foreground">{choice.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback Sheet */}
      <AnimatePresence>
        {selectedChoice && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed inset-x-4 sm:inset-x-6 bottom-5 z-50 max-w-2xl mx-auto"
          >
            <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className={`text-xs font-semibold uppercase tracking-wider block ${isAligned ? 'text-primary' : 'text-muted-foreground'}`}>
                  {selectedChoice.verdict}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {selectedChoice.feedback}
                </p>
              </div>

              <Button
                onClick={handleConfirm}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 h-11 shrink-0"
              >
                See Debrief & Results
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

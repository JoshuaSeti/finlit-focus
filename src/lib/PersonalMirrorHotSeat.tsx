import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, MessageCircle, ArrowRight, Check, AlertTriangle, Wallet } from 'lucide-react';
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

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const PersonalMirrorHotSeat: React.FC<Props> = ({ hotSeat, onDecision }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedChoice = hotSeat.choices.find((c) => c.id === selectedId);
  const isAligned = selectedChoice ? selectedChoice.alignmentScore >= 75 : false;

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
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-between min-h-[calc(100vh-8rem)] pb-44 space-y-6 font-apple">
      {/* Twilight Dusk & Zambian Copper Apple Notification Card */}
      <div className="finlit-hotseat-card rounded-[28px] p-6 sm:p-7 text-dusk-foreground space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-copper">
            <Wallet className="w-4 h-4" />
            <span>Your Turn · Live Decision</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-dusk-foreground/10 border border-dusk-foreground/15 text-dusk-foreground/90">
              {hotSeat.situationTitle}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-copper/20 border border-copper/40 text-copper">
              K{hotSeat.windfallAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* iOS-Style Incoming Credit Notification */}
          <div className="finlit-notif-glass rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-primary">Money Received</span>
                <span className="text-[11px] text-dusk-muted">Now</span>
              </div>
              <p className="text-sm text-dusk-foreground/95 leading-snug">{hotSeat.incomingAlert}</p>
            </div>
          </div>

          {/* iOS-Style Social Pressure Message */}
          <div className="finlit-notif-glass rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-copper/20 border border-copper/35 flex items-center justify-center text-copper shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-copper">Live Temptation</span>
                <span className="text-[11px] text-dusk-muted">1m ago</span>
              </div>
              <p className="text-sm text-dusk-foreground/90 leading-relaxed">{hotSeat.socialPressure}</p>
            </div>
          </div>
        </div>

        {hotSeat.archetypeWarning && (
          <div className="rounded-2xl px-4 py-3 text-xs font-medium bg-copper/15 border border-copper/30 text-copper-foreground/90">
            {hotSeat.archetypeWarning}
          </div>
        )}
      </div>

      {/* Refined Personal Decision Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            You gave great advice — now what do you do?
          </span>
        </div>

        {hotSeat.choices.map((choice, idx) => {
          const isSelected = selectedId === choice.id;
          const cardTone = isSelected
            ? isAligned
              ? 'bg-emeraldSoft/80 border-green-600/60 ring-2 ring-primary/30'
              : 'bg-copper-soft/85 border-copper/60 ring-2 ring-copper/25'
            : selectedChoice
            ? 'opacity-50'
            : '';

          const badgeTone = isSelected
            ? isAligned
              ? 'bg-green-700 text-forest-foreground'
              : 'bg-copper text-copper-foreground'
            : 'bg-secondary text-secondary-foreground';

          return (
            <motion.button
              key={choice.id}
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={() => setSelectedId(choice.id)}
              className={`finlit-option-card w-full text-left rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer ${cardTone}`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${badgeTone}`}>
                {isSelected ? (isAligned ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-3.5 h-3.5" />) : OPTION_LETTERS[idx]}
              </span>
              <div className="flex-1 space-y-1">
                <div className="text-[15px] font-semibold text-foreground">{choice.label}</div>
                <p className="text-sm text-muted-foreground leading-snug">{choice.actionSummary}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Floating Apple Frosted Insight Sheet */}
      <AnimatePresence>
        {selectedChoice && (
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 36, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-3 sm:inset-x-6 bottom-3 sm:bottom-5 z-50 pointer-events-none"
          >
            <div className="finlit-glass-sheet pointer-events-auto max-w-2xl mx-auto rounded-[26px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 flex-1">
                <div className={`w-1.5 self-stretch rounded-full shrink-0 ${isAligned ? 'bg-green-600' : 'bg-copper'}`} />
                <div className="space-y-1">
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isAligned ? 'text-emeraldSoft-ink' : 'text-copper'}`}>
                    {selectedChoice.verdict}
                  </span>
                  <p className="text-sm text-foreground/90 leading-relaxed">{selectedChoice.feedback}</p>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                size="lg"
                className={`rounded-full font-semibold px-6 h-12 shrink-0 shadow-soft transition-transform active:scale-[0.98] ${
                  isAligned
                    ? 'bg-forest hover:bg-forest-deep text-forest-foreground'
                    : 'bg-copper hover:bg-copper/90 text-copper-foreground'
                }`}
              >
                See Alignment Debrief
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

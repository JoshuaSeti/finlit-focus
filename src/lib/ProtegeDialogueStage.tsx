import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Compass, Check, AlertTriangle } from 'lucide-react';
import { ProtegeDialogueBeat, ProtegeBeatChoice } from '@/lib/simulator-dilemmas';
import { Button } from '@/components/ui/button';

interface Props {
  protegeName: string;
  beats: ProtegeDialogueBeat[];
  onComplete: (stats: { totalScore: number; protectedKwacha: number; habitName?: string }) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const ProtegeDialogueStage: React.FC<Props> = ({ protegeName, beats, onComplete }) => {
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);
  const [rapport, setRapport] = useState(65);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [protectedKwacha, setProtectedKwacha] = useState(0);
  const [activeHabit, setActiveHabit] = useState<string | undefined>();
  const [selectedChoice, setSelectedChoice] = useState<ProtegeBeatChoice | null>(null);

  const beat = beats[currentBeatIdx];
  if (!beat) return null;

  const handleSelectChoice = (choice: ProtegeBeatChoice) => {
    setSelectedChoice(choice);
    setRapport((prev) => Math.max(10, Math.min(100, prev + choice.telemetry.trustDelta)));
    setAccumulatedScore((prev) => prev + choice.score);
    if (choice.telemetry.protectedKwacha) {
      setProtectedKwacha((prev) => prev + (choice.telemetry.protectedKwacha ?? 0));
    }
    if (choice.telemetry.habitName) setActiveHabit(choice.telemetry.habitName);
  };

  const handleNextBeat = () => {
    setSelectedChoice(null);
    if (currentBeatIdx + 1 < beats.length) {
      setCurrentBeatIdx((prev) => prev + 1);
    } else {
      onComplete({
        totalScore: Math.round(accumulatedScore / beats.length),
        protectedKwacha,
        habitName: activeHabit,
      });
    }
  };

  const isSound = selectedChoice ? selectedChoice.score >= 70 : false;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-5 pb-44 text-foreground font-apple">
      {/* Apple-Style Segmented Beat Track & FinLit Telemetry */}
      <div className="w-full pt-1 pb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${beats.length}, minmax(0, 1fr))` }}>
            {beats.map((b, i) => {
              const filled = i < currentBeatIdx || (i === currentBeatIdx && !!selectedChoice);
              const active = i === currentBeatIdx && !selectedChoice;
              return (
                <div key={b.beatNumber} className="h-1.5 rounded-full bg-border/80 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${filled ? 'bg-green-600' : active ? 'bg-copper' : 'bg-transparent'}`}
                    initial={false}
                    animate={{ width: filled ? '100%' : active ? '48%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emeraldSoft border border-emeraldSoft-border text-xs font-semibold text-emeraldSoft-ink">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>K{protectedKwacha.toLocaleString()}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-copper-soft border border-copper-border text-xs font-semibold text-copper">
              <Compass className="w-3.5 h-3.5" />
              <span>{rapport}% trust</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensional Botanical Forest Protégé Scene Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.beatNumber}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <div className="finlit-scene-card rounded-[28px] p-6 sm:p-7 text-forest-foreground space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-lg shadow-sm">
                  {protegeName.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-forest-foreground">{protegeName}</div>
                  <div className="text-xs text-forest-muted">Your Protégé · Lusaka</div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-forest-foreground/10 border border-forest-foreground/15 text-forest-foreground/90">
                Dilemma {currentBeatIdx + 1} of {beats.length}
              </span>
            </div>

            <p className="text-[17px] sm:text-[19px] font-medium leading-[1.55] tracking-[-0.01em] text-forest-foreground/95">
              “{beat.prompt}”
            </p>
          </div>

          {/* Refined Apple-Precision Choice Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                Your mentorship call
              </p>
              <span className="text-xs text-muted-foreground">Choose one path</span>
            </div>

            {beat.choices.map((choice, idx) => {
              const isSelected = selectedChoice?.id === choice.id;

              return (
                <motion.button
                  key={choice.id}
                  type="button"
                  whileTap={selectedChoice ? undefined : { scale: 0.99 }}
                  disabled={!!selectedChoice}
                  onClick={() => handleSelectChoice(choice)}
                  className={`w-full text-left p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-200 border ${
                    isSelected
                      ? isSound
                        ? 'bg-emeraldSoft/80 border-primary/60 ring-2 ring-primary/20 shadow-sm'
                        : 'bg-copper-soft/80 border-copper/60 ring-2 ring-copper/20 shadow-sm'
                      : selectedChoice
                      ? 'opacity-40 cursor-not-allowed border-border/40 bg-card/60'
                      : 'bg-card hover:bg-secondary/50 border-border/70 hover:border-border cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                      isSelected
                        ? isSound
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-copper text-copper-foreground border-copper'
                        : 'border-border/80 bg-background/80 text-muted-foreground'
                    }`}
                  >
                    {OPTION_LETTERS[idx]}
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] font-medium leading-relaxed text-foreground tracking-tight">
                      {choice.text}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Floating Apple Frosted Insight Sheet (Uniquely FinLit, no Duolingo full-width dark banner) */}
      <AnimatePresence>
        {selectedChoice && (
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 36, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-x-3 sm:inset-x-6 bottom-4 sm:bottom-6 z-[60] pointer-events-none"
          >
            <div className="finlit-glass-sheet pointer-events-auto max-w-2xl mx-auto rounded-[26px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 flex-1">
                <div className={`w-1.5 self-stretch rounded-full shrink-0 ${isSound ? 'bg-green-600' : 'bg-copper'}`} />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSound ? 'text-emeraldSoft-ink' : 'text-copper'}`}>
                      {isSound ? 'Sound Mentorship' : 'Costly Detour'}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {selectedChoice.telemetry.trustDelta >= 0
                        ? `+${selectedChoice.telemetry.trustDelta}% trust`
                        : `${selectedChoice.telemetry.trustDelta}% trust`}
                    </span>
                    {selectedChoice.telemetry.protectedKwacha ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emeraldSoft text-emeraldSoft-ink">
                        +K{selectedChoice.telemetry.protectedKwacha.toLocaleString()} protected
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    “{selectedChoice.reaction}”
                  </p>
                </div>
              </div>

              <Button
                onClick={handleNextBeat}
                size="lg"
                className={`rounded-full font-semibold px-6 h-12 shrink-0 shadow-soft transition-transform active:scale-[0.98] ${
                  isSound
                    ? 'bg-forest hover:bg-forest-deep text-forest-foreground'
                    : 'bg-copper hover:bg-copper/90 text-copper-foreground'
                }`}
              >
                {currentBeatIdx + 1 < beats.length ? 'Next Dilemma' : 'Step Into Your Hot-Seat'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

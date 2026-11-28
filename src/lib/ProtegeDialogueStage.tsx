import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ProtegeDialogueBeat, ProtegeBeatChoice } from '@/lib/simulator-dilemmas';

interface Props {
  protegeName: string;
  beats: ProtegeDialogueBeat[];
  onComplete: (stats: { totalScore: number; protectedKwacha: number; habitName?: string }) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const ProtegeDialogueStage: React.FC<Props> = ({ protegeName, beats, onComplete }) => {
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [protectedKwacha, setProtectedKwacha] = useState(0);
  const [activeHabit, setActiveHabit] = useState<string | undefined>();
  const [selectedChoice, setSelectedChoice] = useState<ProtegeBeatChoice | null>(null);

  const beat = beats[currentBeatIdx];
  if (!beat) return null;

  const handleSelectChoice = (choice: ProtegeBeatChoice) => {
    setSelectedChoice(choice);
    setAccumulatedScore((prev) => prev + choice.score);
    if (choice.telemetry?.protectedKwacha) {
      setProtectedKwacha((prev) => prev + (choice.telemetry.protectedKwacha ?? 0));
    }
    if (choice.telemetry?.habitName) setActiveHabit(choice.telemetry.habitName);
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
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 pb-36 text-foreground font-sans">
      {/* Clean Segmented Progress Bar — No Pills */}
      <div className="w-full pt-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
          <span>Dilemma {currentBeatIdx + 1} of {beats.length}</span>
          <span>{protegeName}’s Dilemma</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${beats.length}, minmax(0, 1fr))` }}>
          {beats.map((b, i) => {
            const filled = i < currentBeatIdx || (i === currentBeatIdx && !!selectedChoice);
            return (
              <div key={b.beatNumber} className="h-1 rounded-full bg-border overflow-hidden">
                <div className={`h-full transition-all duration-300 ${filled ? 'bg-primary' : 'bg-transparent'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial Protégé Scenario Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.beatNumber}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {protegeName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{protegeName}</div>
                <div className="text-xs text-muted-foreground">Your Protégé</div>
              </div>
            </div>
            <p className="text-[17px] sm:text-[18px] font-medium leading-relaxed text-foreground">
              “{beat.prompt}”
            </p>
          </div>

          {/* Clean Option Cards — Exactly Matching Hot-Seat Layout */}
          <div className="space-y-3">
            {beat.choices.map((choice, idx) => {
              const isSelected = selectedChoice?.id === choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={!!selectedChoice}
                  onClick={() => handleSelectChoice(choice)}
                  className={`w-full text-left p-4.5 rounded-xl flex items-start gap-3.5 transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? isSound
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
                        ? isSound
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-foreground text-background border-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    {OPTION_LETTERS[idx]}
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] font-normal leading-relaxed text-foreground">
                      {choice.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Clean Feedback Tray */}
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
                <span className={`text-xs font-semibold uppercase tracking-wider block ${isSound ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isSound ? 'Sound Mentorship' : 'Costly Detour'}
                </span>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {selectedChoice.feedback}
                </p>
              </div>
              <Button
                onClick={handleNextBeat}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-6 h-11 shrink-0"
              >
                {currentBeatIdx + 1 < beats.length ? 'Next Dilemma' : 'Go to Your Hot-Seat'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

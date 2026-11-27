import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { ProtegeDialogueBeat, ProtegeBeatChoice } from '@/lib/simulator-dilemmas';
import { Button } from '@/components/ui/button';

interface Props {
  protegeName: string;
  beats: ProtegeDialogueBeat[];
  onComplete: (stats: { totalScore: number; protectedKwacha: number; habitName?: string }) => void;
}

export const ProtegeDialogueStage: React.FC<Props> = ({ protegeName, beats, onComplete }) => {
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);
  const [stress, setStress] = useState(65); // Starting stress level
  const [trust, setTrust] = useState(50);   // Starting mentor trust
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [protectedKwacha, setProtectedKwacha] = useState(0);
  const [activeHabit, setActiveHabit] = useState<string | undefined>();
  const [selectedChoice, setSelectedChoice] = useState<ProtegeBeatChoice | null>(null);

  const beat = beats[currentBeatIdx];

  const handleSelectChoice = (choice: ProtegeBeatChoice) => {
    setSelectedChoice(choice);
    setStress((prev) => Math.max(10, Math.min(100, prev + choice.telemetry.stressDelta)));
    setTrust((prev) => Math.max(10, Math.min(100, prev + choice.telemetry.trustDelta)));
    setAccumulatedScore((prev) => prev + choice.score);

    if (choice.telemetry.protectedKwacha) {
      setProtectedKwacha((prev) => prev + (choice.telemetry.protectedKwacha || 0));
    }
    if (choice.telemetry.habitName) {
      setActiveHabit(choice.telemetry.habitName);
    }
  };

  const handleNextBeat = () => {
    setSelectedChoice(null);
    if (currentBeatIdx + 1 < beats.length) {
      setCurrentBeatIdx((prev) => prev + 1);
    } else {
      const avgScore = Math.round((accumulatedScore / beats.length));
      onComplete({
        totalScore: avgScore,
        protectedKwacha,
        habitName: activeHabit,
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 text-foreground">
      {/* Telemetry HUD */}
      <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
          <span>Protégé Telemetry: {protegeName}</span>
          <span>Beat {currentBeatIdx + 1} of {beats.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Stress Meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> Anxiety
              </span>
              <span className="font-semibold">{stress}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-amber-500 h-full rounded-full"
                animate={{ width: `${stress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Mentor Trust */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Trust in You
              </span>
              <span className="font-semibold">{trust}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-emerald-500 h-full rounded-full"
                animate={{ width: `${trust}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {protectedKwacha > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5" />
            <span>K{protectedKwacha} capital protected from unvetted schemes</span>
          </div>
        )}
      </div>

      {/* Dialogue Balloon Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={beat.beatNumber}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
              {protegeName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">{protegeName}</span>
              <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
                "{beat.prompt}"
              </p>
            </div>
          </div>

          {/* Selected Reaction Feedback */}
          {selectedChoice && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-secondary/60 border border-border rounded-2xl p-3.5 text-sm space-y-2"
            >
              <div className="text-xs font-bold text-primary uppercase tracking-wider">
                {protegeName}'s Reaction:
              </div>
              <p className="italic text-muted-foreground">"{selectedChoice.reaction}"</p>
              <div className="pt-2 flex justify-end">
                <Button size="sm" onClick={handleNextBeat} className="rounded-full">
                  {currentBeatIdx + 1 < beats.length ? 'Next Dialogue' : 'Proceed to Personal Hot-Seat'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tactical Response Choices */}
      {!selectedChoice && (
        <div className="space-y-2.5 pt-1">
          <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider block px-1">
            Choose your guidance:
          </span>
          {beat.choices.map((choice) => (
            <motion.button
              key={choice.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectChoice(choice)}
              className="w-full text-left bg-card hover:bg-secondary/50 border border-border hover:border-primary/40 rounded-2xl p-4 transition-all duration-200 shadow-sm space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground group-hover:text-foreground">
                  {choice.tag}
                </span>
                <span className="text-xs text-muted-foreground font-mono">Tap to advise</span>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">
                "{choice.text}"
              </p>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

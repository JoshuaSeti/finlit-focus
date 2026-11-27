import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Heart,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { ProtegeDialogueBeat, ProtegeBeatChoice } from '@/lib/simulator-dilemmas';
import { Button } from '@/components/ui/button';

interface Props {
  protegeName: string;
  beats: ProtegeDialogueBeat[];
  onComplete: (stats: { totalScore: number; protectedKwacha: number; habitName?: string }) => void;
}

export const ProtegeDialogueStage: React.FC<Props> = ({ protegeName, beats, onComplete }) => {
  const [currentBeatIdx, setCurrentBeatIdx] = useState(0);
  const [trust, setTrust] = useState(65);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [protectedKwacha, setProtectedKwacha] = useState(0);
  const [activeHabit, setActiveHabit] = useState<string | undefined>();
  const [selectedChoice, setSelectedChoice] = useState<ProtegeBeatChoice | null>(null);

  const beat = beats[currentBeatIdx];
  const progressPct = ((currentBeatIdx + (selectedChoice ? 1 : 0.5)) / beats.length) * 100;

  const handleSelectChoice = (choice: ProtegeBeatChoice) => {
    setSelectedChoice(choice);
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
      const avgScore = Math.round(accumulatedScore / beats.length);
      onComplete({
        totalScore: avgScore,
        protectedKwacha,
        habitName: activeHabit,
      });
    }
  };

  const isGoodChoice = selectedChoice ? selectedChoice.score >= 70 : false;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col justify-between min-h-[calc(100vh-8rem)] pb-24 text-foreground relative">
      
      {/* 1. Duolingo Top Header: Progress Bar & Vitality Chip */}
      <div className="w-full pt-2 pb-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Segmented / Smooth Progress Bar */}
          <div className="flex-1 h-3.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border">
            <motion.div
              className="h-full bg-primary rounded-full transition-all duration-300"
              initial={{ width: '0%' }}
              animate={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Protected Capital Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
            <span>K{protectedKwacha} Protected</span>
          </div>

          {/* Protégé Trust Heart */}
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 shrink-0">
            <Heart className="w-4 h-4 fill-current" />
            <span>{trust}%</span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-muted-foreground">
            Dilemma {currentBeatIdx + 1} of {beats.length} • Guide {protegeName}
          </span>
        </div>
      </div>

      {/* 2. Character Stage & Comic Speech Bubble */}
      <div className="flex-1 flex flex-col justify-center space-y-6 my-auto">
        <div className="flex items-start gap-4">
          
          {/* Protégé Avatar Badge */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-2xl shadow-md">
              {protegeName.slice(0, 1)}
            </div>
            <span className="mt-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {protegeName}
            </span>
          </div>

          {/* Comic Speech Bubble */}
          <div className="relative flex-1 bg-card border-2 border-border/80 rounded-3xl p-5 shadow-sm text-foreground">
            {/* Speech bubble arrow pointer */}
            <div className="absolute -left-2.5 top-6 w-4 h-4 bg-card border-l-2 border-b-2 border-border/80 rotate-45" />
            
            <p className="text-base sm:text-lg font-semibold leading-relaxed">
              "{beat.prompt}"
            </p>
          </div>
        </div>

        {/* 3. Tactile 3D Choice Cards (Duolingo Style) */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Choose what advice you give:
          </p>

          {beat.choices.map((choice, idx) => {
            const isSelected = selectedChoice?.id === choice.id;

            return (
              <motion.button
                key={choice.id}
                whileTap={{ scale: 0.98 }}
                disabled={!!selectedChoice}
                onClick={() => handleSelectChoice(choice)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? isGoodChoice
                      ? 'border-emerald-500 bg-emerald-500/10 border-b-4'
                      : 'border-amber-500 bg-amber-500/10 border-b-4'
                    : selectedChoice
                    ? 'border-border/60 opacity-50 bg-card cursor-not-allowed'
                    : 'border-border border-b-4 hover:border-primary/50 bg-card hover:bg-secondary/40 active:border-b-2 active:translate-y-0.5 shadow-sm'
                }`}
              >
                {/* Index Pill */}
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                  isSelected
                    ? isGoodChoice
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-amber-500 text-white border-amber-600'
                    : 'bg-secondary text-secondary-foreground border-border'
                }`}>
                  {idx + 1}
                </span>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      {choice.tag}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold leading-snug">
                    "{choice.text}"
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 4. Duolingo Signature Slide-Up Bottom Tray */}
      <AnimatePresence>
        {selectedChoice && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className={`fixed inset-x-0 bottom-0 border-t-2 p-4 sm:p-6 shadow-2xl z-50 backdrop-blur-md ${
              isGoodChoice
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
                : 'bg-amber-950/95 border-amber-500 text-amber-100'
            }`}
          >
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {isGoodChoice ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-400">
                        Smart Mentorship!
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-400">
                        Risky Move!
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-white/90 font-medium">
                  "{selectedChoice.reaction}"
                </p>
              </div>

              {/* Big Chunky CONTINUE Button */}
              <Button
                onClick={handleNextBeat}
                size="lg"
                className={`rounded-2xl font-bold px-8 py-6 text-base shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all shrink-0 ${
                  isGoodChoice
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-700'
                    : 'bg-amber-500 hover:bg-amber-400 text-white border-amber-700'
                }`}
              >
                {currentBeatIdx + 1 < beats.length ? 'Continue' : 'To Your Hot-Seat'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

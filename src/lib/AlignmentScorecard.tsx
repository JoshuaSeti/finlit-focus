import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Gamepad2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  protegeName: string;
  mentorshipScore: number;
  personalScore: number;
  protectedKwacha: number;
  verdict: string;
  onClaimCertificate: () => void;
  onEnterSimulator: () => void;
  onReturnToLessons: () => void;
}

export const AlignmentScorecard: React.FC<Props> = ({
  protegeName,
  mentorshipScore,
  personalScore,
  protectedKwacha,
  onClaimCertificate,
  onEnterSimulator,
  onReturnToLessons,
}) => {
  const alignmentGap = Math.abs(mentorshipScore - personalScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto flex flex-col gap-6 py-4 pb-20 font-sans"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Decision Alignment Debrief</h2>
        <p className="text-sm text-muted-foreground">
          Comparing the advice you gave {protegeName} with the choices you made yourself.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Mentorship Score</span>
          <div className="text-3xl font-bold text-primary">{mentorshipScore}%</div>
          <p className="text-xs text-muted-foreground">Guiding {protegeName}</p>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 text-center space-y-1">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Hot-Seat Score</span>
          <div className="text-3xl font-bold text-foreground">{personalScore}%</div>
          <p className="text-xs text-muted-foreground">Your own execution</p>
        </div>
      </div>

      <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Say–Do Alignment Gap</span>
          <span className="font-bold text-primary">{alignmentGap}%</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {alignmentGap <= 15
            ? `You practiced what you preached. The discipline you advised ${protegeName} to follow is the discipline you displayed when your own money was tested.`
            : `Notice the gap between your coaching and your personal decision. High-stress situations often tempt us away from principles we know intellectually.`}
        </p>
      </div>

      {/* Connected Action Buttons: Simulator + Certificate + Roadmap */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={onEnterSimulator}
          size="lg"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full h-12 flex items-center justify-center gap-2"
        >
          <Gamepad2 className="w-5 h-5" />
          <span>Enter {protegeName}’s World (Live Simulator)</span>
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={onClaimCertificate}
            variant="outline"
            className="rounded-full h-11 border-border/80 font-medium flex items-center justify-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>Claim Certificate</span>
          </Button>

          <Button
            onClick={onReturnToLessons}
            variant="ghost"
            className="rounded-full h-11 text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
          >
            <span>Back to Lessons</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

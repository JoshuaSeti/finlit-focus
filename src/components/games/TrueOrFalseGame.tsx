import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RefreshCw, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Question {
  statement: string;
  answer: boolean;
}

const questions: Question[] = [
  { statement: "Saving money is only possible if you earn a lot.", answer: false },
  { statement: "Buying something on sale still costs money.", answer: true },
  { statement: "Needs are things you cannot live without.", answer: true },
  { statement: "Wants can sometimes feel like needs.", answer: true },
  { statement: "Spending small amounts daily can add up to a lot monthly.", answer: true },
  { statement: "Having a budget means you can never have fun.", answer: false },
  { statement: "Borrowing money always solves financial problems.", answer: false },
  { statement: "Saving even a small amount regularly is better than saving nothing.", answer: true },
  { statement: "Peer pressure can influence spending decisions.", answer: true },
  { statement: "Money left unspent automatically grows on its own.", answer: false },
  { statement: "Impulse buying usually happens without planning.", answer: true },
  { statement: "Earning money is more important than managing it well.", answer: false },
  { statement: "Lifestyle inflation means spending more as you earn more.", answer: true },
  { statement: "You should spend all your money while you are young.", answer: false },
  { statement: "Tracking expenses helps you understand where your money goes.", answer: true },
  { statement: "Wants should usually come before savings.", answer: false },
  { statement: "Emergency funds are only for adults with jobs.", answer: false },
  { statement: "Using all your income every month is a good habit.", answer: false },
  { statement: "Social media can increase unnecessary spending.", answer: true },
  { statement: "Saving money means you are being greedy.", answer: false },
  { statement: "Buying something to impress others is a financial decision.", answer: true },
  { statement: "Short-term happiness can lead to long-term money stress.", answer: true },
  { statement: "You need a bank account to start saving money.", answer: false },
  { statement: "Financial discipline is learned, not automatic.", answer: true },
  { statement: "Discounts can make people buy things they do not need.", answer: true },
  { statement: "Having money problems always means you are lazy.", answer: false },
  { statement: "A budget tells your money where to go.", answer: true },
  { statement: "Spending money can sometimes be emotional.", answer: true },
  { statement: "The more you earn, the less you need to budget.", answer: false },
  { statement: "Saving first and spending later is a smart strategy.", answer: true },
  { statement: "Not all debt is bad in every situation.", answer: true },
  { statement: "Buying food outside every day is usually cheaper than cooking.", answer: false },
  { statement: "Planning purchases reduces regret.", answer: true },
  { statement: "Being broke and being poor are the same thing.", answer: false },
  { statement: "Financial habits formed early can last a lifetime.", answer: true },
  { statement: "Saving is pointless if inflation exists.", answer: false },
  { statement: "Money stress can affect mental health.", answer: true },
  { statement: "Wanting something means you should buy it.", answer: false },
  { statement: "Small financial choices matter more than one big decision.", answer: true },
  { statement: "Financial literacy is a skill that can be improved.", answer: true },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const TrueOrFalseGame = () => {
  const [shuffledQuestions, setShuffledQuestions] = useState(() => shuffleArray(questions).slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex) / shuffledQuestions.length) * 100;

  const handleAnswer = useCallback((userAnswer: boolean) => {
    if (answered !== null) return;
    
    const correct = userAnswer === currentQuestion.answer;
    setAnswered(userAnswer);
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
  }, [answered, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
      setAnswered(null);
      setIsCorrect(null);
    } else {
      setGameComplete(true);
    }
  }, [currentIndex, shuffledQuestions.length]);

  const resetGame = useCallback(() => {
    setShuffledQuestions(shuffleArray(questions).slice(0, 10));
    setCurrentIndex(0);
    setScore(0);
    setAnswered(null);
    setIsCorrect(null);
    setGameComplete(false);
  }, []);

  if (gameComplete) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Trophy className="w-20 h-20 mx-auto text-primary mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Game Complete!</h3>
        <p className="text-lg text-muted-foreground mb-4">
          You scored <span className="font-bold text-primary">{score}</span> out of {shuffledQuestions.length}
        </p>
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: `${(percentage / 100) * 352} 352` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
            {percentage}%
          </span>
        </div>
        <Button onClick={resetGame} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Play Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {shuffledQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-foreground leading-relaxed">
                "{currentQuestion.statement}"
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleAnswer(true)}
                    disabled={answered !== null}
                    variant={
                      answered !== null
                        ? currentQuestion.answer === true
                          ? "default"
                          : answered === true
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className={`w-full h-14 text-lg font-semibold transition-all ${
                      answered === null ? "hover:bg-primary hover:text-primary-foreground" : ""
                    } ${answered !== null && currentQuestion.answer === true ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <Check className="w-5 h-5 mr-2" />
                    True
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleAnswer(false)}
                    disabled={answered !== null}
                    variant={
                      answered !== null
                        ? currentQuestion.answer === false
                          ? "default"
                          : answered === false
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className={`w-full h-14 text-lg font-semibold transition-all ${
                      answered === null ? "hover:bg-primary hover:text-primary-foreground" : ""
                    } ${answered !== null && currentQuestion.answer === false ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <X className="w-5 h-5 mr-2" />
                    False
                  </Button>
                </motion.div>
              </div>

              <AnimatePresence>
                {answered !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div
                      className={`p-4 rounded-lg text-center font-medium ${
                        isCorrect
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCorrect ? "🎉 Correct!" : `❌ Incorrect! The answer is ${currentQuestion.answer ? "True" : "False"}.`}
                    </div>
                    <Button onClick={handleNext} className="w-full gap-2">
                      {currentIndex < shuffledQuestions.length - 1 ? (
                        <>
                          Next Question
                          <ChevronRight className="w-4 h-4" />
                        </>
                      ) : (
                        "See Results"
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

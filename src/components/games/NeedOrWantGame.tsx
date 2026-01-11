import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, RefreshCw, Trophy, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Question {
  item: string;
  context: string;
  answer: 'need' | 'want';
}

const questions: Question[] = [
  { item: "A smartphone", context: "You already own a working phone, but this one has better features.", answer: "want" },
  { item: "Mobile data", context: "You need it to access and submit schoolwork online.", answer: "need" },
  { item: "Unlimited social media data", context: "Your schoolwork does not require constant scrolling.", answer: "want" },
  { item: "Taxi ride to school", context: "Public transport is available but slower.", answer: "want" },
  { item: "Transport during heavy rain", context: "Walking would make you late and sick.", answer: "need" },
  { item: "New school shoes", context: "Your current pair is damaged and unusable.", answer: "need" },
  { item: "Branded school shoes", context: "Cheaper options meet the same school rules.", answer: "want" },
  { item: "Internet at home", context: "School computer access is limited and unreliable.", answer: "need" },
  { item: "Home Wi-Fi speed upgrade", context: "Current speed already supports your work.", answer: "want" },
  { item: "Eating lunch outside daily", context: "Food is available at home.", answer: "want" },
  { item: "Buying lunch during exam week", context: "Time pressure makes going home impossible.", answer: "need" },
  { item: "New clothes", context: "Existing clothes are clean and functional.", answer: "want" },
  { item: "Formal clothes for school events", context: "Required to participate.", answer: "need" },
  { item: "Music streaming subscription", context: "Free alternatives exist.", answer: "want" },
  { item: "Headphones", context: "You study in a noisy environment.", answer: "need" },
  { item: "Wireless headphones", context: "Wired ones already work.", answer: "want" },
  { item: "Energy drinks", context: "Tiredness is caused by poor sleep habits.", answer: "want" },
  { item: "Balanced meals", context: "Necessary for health and focus.", answer: "need" },
  { item: "Savings account", context: "Emergencies happen regardless of income.", answer: "need" },
  { item: "Saving for a new phone", context: "Your current phone works fine.", answer: "want" },
  { item: "Laptop", context: "School assignments require online research and typing.", answer: "need" },
  { item: "High-end laptop", context: "Basic models meet the same requirements.", answer: "want" },
  { item: "Haircut", context: "Needed for hygiene and school rules.", answer: "need" },
  { item: "Weekly hairstyle changes", context: "Done for appearance only.", answer: "want" },
  { item: "Medical check-up", context: "Symptoms are persistent.", answer: "need" },
  { item: "Online vitamins", context: "No medical deficiency exists.", answer: "want" },
  { item: "Mandatory school trip", context: "Required and graded.", answer: "need" },
  { item: "Optional school trip", context: "Fun but not required.", answer: "want" },
  { item: "Phone repairs", context: "Phone cannot make calls or receive messages.", answer: "need" },
  { item: "Phone accessories", context: "No impact on functionality.", answer: "want" },
  { item: "Transport to a job interview", context: "Could lead to income.", answer: "need" },
  { item: "Celebrating first paycheck", context: "Emotionally rewarding but not essential.", answer: "want" },
  { item: "Emergency savings", context: "Protects against unexpected costs.", answer: "need" },
  { item: "Spending leftover money immediately", context: "No urgent reason to spend it.", answer: "want" },
  { item: "School supplies", context: "Required for learning.", answer: "need" },
  { item: "Decorative stationery", context: "Cheaper alternatives work the same.", answer: "want" },
  { item: "Basic insurance", context: "Protects against financial shocks.", answer: "need" },
  { item: "Extended warranties on everything", context: "Risk does not justify cost.", answer: "want" },
  { item: "Water during extreme heat", context: "Health and safety risk without it.", answer: "need" },
  { item: "Bottled water when tap water is safe", context: "Choice is about convenience.", answer: "want" },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const NeedOrWantGame = () => {
  const [shuffledQuestions, setShuffledQuestions] = useState(() => shuffleArray(questions).slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<'need' | 'want' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameComplete, setGameComplete] = useState(false);

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = ((currentIndex) / shuffledQuestions.length) * 100;

  const handleAnswer = useCallback((userAnswer: 'need' | 'want') => {
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
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold text-foreground">
                {currentQuestion.item}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {currentQuestion.context}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleAnswer('need')}
                    disabled={answered !== null}
                    variant={
                      answered !== null
                        ? currentQuestion.answer === 'need'
                          ? "default"
                          : answered === 'need'
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className={`w-full h-14 text-lg font-semibold transition-all ${
                      answered === null ? "hover:bg-primary hover:text-primary-foreground" : ""
                    } ${answered !== null && currentQuestion.answer === 'need' ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Need
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleAnswer('want')}
                    disabled={answered !== null}
                    variant={
                      answered !== null
                        ? currentQuestion.answer === 'want'
                          ? "default"
                          : answered === 'want'
                          ? "destructive"
                          : "outline"
                        : "outline"
                    }
                    className={`w-full h-14 text-lg font-semibold transition-all ${
                      answered === null ? "hover:bg-primary hover:text-primary-foreground" : ""
                    } ${answered !== null && currentQuestion.answer === 'want' ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Want
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
                      {isCorrect 
                        ? "🎉 Correct!" 
                        : `❌ Incorrect! This is a ${currentQuestion.answer.toUpperCase()}.`}
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

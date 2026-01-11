import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, CircleCheck, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrueOrFalseGame } from './TrueOrFalseGame';
import { NeedOrWantGame } from './NeedOrWantGame';

type GameType = 'true-or-false' | 'need-or-want' | null;

const games = [
  {
    id: 'true-or-false' as const,
    title: 'True or False',
    subtitle: 'Financial Literacy',
    description: 'Test your knowledge of financial concepts with quick true/false questions.',
    icon: CircleCheck,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'need-or-want' as const,
    title: 'Need or Want',
    subtitle: 'Hard Mode',
    description: 'Can you tell the difference between needs and wants in tricky situations?',
    icon: Package,
    color: 'bg-accent text-accent-foreground',
  },
];

export const GameSection = () => {
  const [activeGame, setActiveGame] = useState<GameType>(null);

  if (activeGame) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto"
      >
        <button
          onClick={() => setActiveGame(null)}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          ← Back to games
        </button>
        <h3 className="text-xl font-bold text-foreground mb-4">
          {activeGame === 'true-or-false' ? 'True or False: Financial Literacy' : 'Need or Want: Hard Mode'}
        </h3>
        {activeGame === 'true-or-false' ? <TrueOrFalseGame /> : <NeedOrWantGame />}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Gamepad2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Interactive Learning Games</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Test your financial literacy knowledge with these fun, quick games designed for high school students.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 h-full"
              onClick={() => setActiveGame(game.id)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${game.color} flex items-center justify-center mb-2`}>
                  <game.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{game.title}</CardTitle>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {game.subtitle}
                </span>
                <CardDescription className="mt-2">{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm font-medium text-primary hover:underline">
                  Play Now →
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

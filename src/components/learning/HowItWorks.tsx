import { useState } from 'react';
import { Compass, BookOpen, Coins, HeartPulse, Trophy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STEPS = [
  { icon: Compass, title: '1. Placement test', text: 'A short check-up with everyday Zambian money situations. It orders the lessons for you and unlocks your first recommended lesson for free.' },
  { icon: BookOpen, title: '2. Your lessons', text: 'Short, interactive lessons on budgeting, saving, mobile money, borrowing, business and investing, with real kwacha examples. A one-time K20 unlocks every lesson.' },
  { icon: HeartPulse, title: '3. Practise with Yungsta', text: 'After a lesson, you make money choices for Yungsta, a young Zambian. Good habits keep their stress low ("Vibes on vibes"); bad ones push them to "Trippin". More money does not always mean fewer problems.' },
  { icon: Coins, title: '4. Coin streak', text: 'Learn or practise on a day and you earn a coin. Keep coming back each day to grow your streak.' },
  { icon: Trophy, title: '5. Calmest players', text: 'The ranking shows who keeps Yungsta calmest over two weeks, never who has the most money.' },
];

export function HowItWorks({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(() => defaultOpen && !localStorage.getItem('finlit-guide-seen'));
  const close = (v: boolean) => { setOpen(v); if (!v) localStorage.setItem('finlit-guide-seen', '1'); };
  return (
    <>
      <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <HelpCircle className="w-4 h-4 mr-2" />How FinLit works
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl sm:rounded-3xl w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle>Welcome to FinLit lessons</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.title} className="flex gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-accent grid place-items-center"><s.icon className="w-5 h-5 text-primary" /></div>
                <div><p className="font-semibold text-foreground">{s.title}</p><p className="text-sm text-muted-foreground">{s.text}</p></div>
              </div>
            ))}
            <p className="text-sm text-muted-foreground border-t border-border pt-3">The panel beside your path holds your coin streak, the app install button and Yungsta. Tap “How FinLit works” any time to see this again.</p>
            <Button className="w-full rounded-full" onClick={() => close(false)}>Got it, let’s learn</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

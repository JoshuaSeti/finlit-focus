export interface ProtegeBeatChoice {
  id: string;
  tag: string; // e.g. "Optimal • Risk Diagnostic", "Reckless", "Convenience Bias"
  tone: 'disciplined' | 'tempting' | 'aggressive' | 'passive';
  text: string;
  reaction: string;
  score: number; // 0 - 100
  telemetry: {
    stressDelta: number; // e.g. -25
    trustDelta: number;  // e.g. +25
    protectedKwacha?: number;
    habitName?: string;
  };
}

export interface ProtegeDialogueBeat {
  beatNumber: number;
  prompt: string;
  choices: ProtegeBeatChoice[];
}

export interface PersonalHotSeatScenario {
  situationId: string;
  situationTitle: string;
  windfallAmount: number; // e.g. K850
  incomingAlert: string;
  socialPressure: string;
  archetypeWarning?: string;
  choices: {
    id: string;
    label: string;
    actionSummary: string;
    alignmentScore: number; // 0 - 100
    hypocrisyScore: number; // 0 - 100
    feedback: string;
    verdict: string;
  }[];
}

export interface Lesson1DilemmaData {
  protegeName: string;
  beats: ProtegeDialogueBeat[];
  hotSeat: PersonalHotSeatScenario;
}

export function getLesson1Dilemma(
  situationId = 'employee',
  archetypeId = 'spender',
  protegeName = 'Your Protégé'
): Lesson1DilemmaData {
  const beats: ProtegeDialogueBeat[] = [
    {
      beatNumber: 1,
      prompt: `Mentor, my first full K1,500 just came in! But listen: my supervisor wants me to put K1,200 of it into his private revolving chilimba today. He says in 3 weeks, my payout will be K2,000! If I take the other K300 to a commercial bank, ledger fees will just eat it. What should I do with this K1,200?`,
      choices: [
        {
          id: '1a',
          tag: 'Reckless Speculation',
          tone: 'tempting',
          text: 'K2,000 in 3 weeks is quick money! Put the K1,200 in before the slot gets taken, and survive on the remaining K300.',
          reaction: 'If you say so, mentor... but if he delays paying me, I won’t even have bus fare to get to work next week.',
          score: 20,
          telemetry: { stressDelta: 35, trustDelta: -20 },
        },
        {
          id: '1b',
          tag: 'Rigid Rejection',
          tone: 'aggressive',
          text: 'Are you crazy? All chilimbas are scams! Put all K1,500 in a fixed deposit right now and do not touch a single ngwee.',
          reaction: 'All of it? But mentor, I need to eat this month and pay transport to work...',
          score: 45,
          telemetry: { stressDelta: 20, trustDelta: -10 },
        },
        {
          id: '1c',
          tag: 'Mastery • Risk Diagnostic',
          tone: 'disciplined',
          text: 'Slow down. A 66% return in 3 weeks is an unregistered gamble with zero Bank of Zambia protection. Plus, locking away K1,200 leaves you with only K300 cushion. What is your real safety cushion for the month?',
          reaction: 'True... if I give him K1,200 and an emergency happens, I’d have to borrow Kaloba just to survive. I will pass on his offer.',
          score: 100,
          telemetry: { stressDelta: -25, trustDelta: 30, protectedKwacha: 1200 },
        },
      ],
    },
    {
      beatNumber: 2,
      prompt: `Okay, you made me dodge a bullet there. But what about keeping the whole K1,500 on my mobile money? It's right on my phone, super easy to pay for things at the market, and no bank branch queues.`,
      choices: [
        {
          id: '2a',
          tag: 'Convenience Bias',
          tone: 'tempting',
          text: 'Yes, just leave it on mobile money. Banks are too much headache for K1,500 anyway.',
          reaction: 'Awesome, much simpler! (3 weeks later: small airtime, transactions, and snacks slowly drained 80% of the funds).',
          score: 30,
          telemetry: { stressDelta: 10, trustDelta: -15 },
        },
        {
          id: '2b',
          tag: 'Mastery • Structural Separation',
          tone: 'disciplined',
          text: 'Mobile money is built for spending fast, not growing. When cash is one PIN code away, it evaporates. Keep K400 living expenses on mobile money, but move K300 into a zero-fee digital bank savings pocket so it stays out of sight and starts earning interest.',
          reaction: 'Out of sight, out of mind... I like that. If it is not sitting in my wallet, I will not buy unnecessary talk time or impulsive snacks.',
          score: 100,
          telemetry: { stressDelta: -15, trustDelta: 25, habitName: 'Separation of Wallets' },
        },
        {
          id: '2c',
          tag: 'Cash Hoarding',
          tone: 'passive',
          text: 'Withdraw all of it as hard cash from an agent. Keep it under your mattress at home so you can feel the paper.',
          reaction: 'In my room? Mentor, my relatives and siblings will definitely ask for half of it before the weekend ends...',
          score: 35,
          telemetry: { stressDelta: 30, trustDelta: -10 },
        },
      ],
    },
    {
      beatNumber: 3,
      prompt: `Alright, after basic rent contribution and food, I have exactly K300 that I can either invest or save every single month. But honestly, mentor... is K300 a month even worth the trouble? It feels so small. Shouldn't I just wait until I earn K5,000 to start saving?`,
      choices: [
        {
          id: '3a',
          tag: 'The Delay Trap',
          tone: 'tempting',
          text: 'You are right, K300 won’t change your life today. Enjoy your youth now, and start serious saving when your salary goes up.',
          reaction: 'Understood. (Outcome: Lifestyle inflation sets in. When earning K5,000 later, expenses expand to K5,200).',
          score: 15,
          telemetry: { stressDelta: 25, trustDelta: -20 },
        },
        {
          id: '3b',
          tag: 'Mastery • The Compounding Anchor',
          tone: 'disciplined',
          text: 'K300 a month is K3,600 a year before interest. With compound interest, your money acts like an assistant working for you while you sleep. But more importantly: if you cannot save on K1,500, you will never save on K10,000. The habit is the asset, not the amount.',
          reaction: 'An assistant working for me... I am setting up the standing order right now. K300 every month on pay day without fail!',
          score: 100,
          telemetry: { stressDelta: -30, trustDelta: 35, habitName: 'Compound Anchor' },
        },
      ],
    },
  ];

  // Dynamic Hot-Seat based on Diagnostic Situation & Archetype
  const hotSeats: Record<string, PersonalHotSeatScenario> = {
    student: {
      situationId: 'student',
      situationTitle: 'Student on Allowance',
      windfallAmount: 200,
      incomingAlert: 'CR: K200.00 received from freelance graphics task / family gift. Balance: K235.00.',
      socialPressure: `Classmates WhatsApp: "We're getting shawarmas and drinks at the corner shop, bring K80 and pull up!"`,
      archetypeWarning: archetypeId === 'spender' ? 'Beware: The Spender archetype tends to dismiss K200 as "too small to matter."' : undefined,
      choices: [
        {
          id: 's1',
          label: 'Blow It with Friends',
          actionSummary: 'Spend K80 on shawarma, K50 on drinks, K70 on airtime and data.',
          alignmentScore: 25,
          hypocrisyScore: 85,
          feedback: 'You just told your protégé that small money counts, yet you spent 100% of your windfall within 2 hours.',
          verdict: 'Hypocrisy Trap',
        },
        {
          id: 's2',
          label: 'Total Deprivation',
          actionSummary: 'Lock all K200 away and turn off your phone to avoid friends.',
          alignmentScore: 60,
          hypocrisyScore: 20,
          feedback: 'Saves cash, but extreme asceticism often leads to binge spending next week.',
          verdict: 'Rigid Austerity',
        },
        {
          id: 's3',
          label: 'The Proportional Master (Aligned)',
          actionSummary: 'Lock K80 into digital savings (proving K80 matters), allocate K70 for social food with a firm limit, keep K50 for transport.',
          alignmentScore: 100,
          hypocrisyScore: 0,
          feedback: 'Exemplary alignment. You honored your future self, enjoyed community within boundaries, and proved small sums compound.',
          verdict: 'Aligned Mentor',
        },
      ],
    },
    employee: {
      situationId: 'employee',
      situationTitle: 'First Job / Employee',
      windfallAmount: 850,
      incomingAlert: 'CR: K850.00 received for weekend overtime. Available Balance: K920.00.',
      socialPressure: `Coworkers WhatsApp: "Ba Ponono is around East Park! We got a table. Everyone chip in K450 right now, don't miss out!"`,
      archetypeWarning: archetypeId === 'giver' ? 'Watch out: The Giver archetype often pays for friends to avoid feeling selfish.' : undefined,
      choices: [
        {
          id: 'e1',
          label: 'Fund the Night Out',
          actionSummary: 'Send K450 for the table, spend K200 on drinks, K150 on cab fare.',
          alignmentScore: 20,
          hypocrisyScore: 90,
          feedback: 'You lectured your protégé on avoiding social pressure, then caved to the exact same urge.',
          verdict: 'Hypocrisy Trap',
        },
        {
          id: 'e2',
          label: 'The Strategic Allocator (Aligned)',
          actionSummary: 'Transfer K400 immediately to locked high-yield savings pocket, budget K250 for food with friends, hold K200 as emergency liquidity.',
          alignmentScore: 100,
          hypocrisyScore: 0,
          feedback: 'You paid your future self first, maintained social ties with clear boundaries, and practiced what you preached.',
          verdict: 'Aligned Mentor',
        },
        {
          id: 'e3',
          label: 'Complete Withdrawal',
          actionSummary: 'Put all K850 in a 30-day fixed lock, tell everyone you are completely broke.',
          alignmentScore: 65,
          hypocrisyScore: 15,
          feedback: 'Disciplined, but total social evasion can hurt workplace relationships.',
          verdict: 'Over-Correction',
        },
      ],
    },
    trader: {
      situationId: 'trader',
      situationTitle: 'Small Trader / Business Owner',
      windfallAmount: 2500,
      incomingAlert: 'Cash in Hand: K2,500 surplus cash after a high-volume market sales day.',
      socialPressure: `A supplier calls: "I have 5 bundles of fast-moving phone accessories at 50% discount if you bring K2,200 cash before 17:00."`,
      archetypeWarning: archetypeId === 'hustler' ? 'Warning: Hustler archetype loves rapid turnover and risks depleting core working capital.' : undefined,
      choices: [
        {
          id: 't1',
          label: 'Gamble on Flash Stock',
          actionSummary: 'Hand over K2,200 immediately without verifying supplier license or checking store rent due on Monday.',
          alignmentScore: 30,
          hypocrisyScore: 80,
          feedback: 'You advised your protégé against unverified schemes, then put core capital into an uninspected deal.',
          verdict: 'Speculative Gamble',
        },
        {
          id: 't2',
          label: 'Disciplined Capital Segregation (Aligned)',
          actionSummary: 'Deposit K1,700 back into dedicated business restocking account, bank K500 into retained emergency reserve, take K300 personal profit.',
          alignmentScore: 100,
          hypocrisyScore: 0,
          feedback: 'Perfect business financial hygiene. Separating business capital from personal cash is the cornerstone of sustainable enterprise.',
          verdict: 'Aligned Entrepreneur',
        },
        {
          id: 't3',
          label: 'Pocket as Personal Profit',
          actionSummary: 'Treat all K2,500 as personal spending money and celebrate with family.',
          alignmentScore: 15,
          hypocrisyScore: 95,
          feedback: 'Eating your seed capital is how profitable kiosks quietly go bankrupt.',
          verdict: 'Capital Bleed',
        },
      ],
    },
    family: {
      situationId: 'family',
      situationTitle: 'Supporting a Family',
      windfallAmount: 1200,
      incomingAlert: 'CR: K1,200.00 received from quarterly side-venture. Available Balance: K1,340.00.',
      socialPressure: `Urgent phone call from distant relative: "Uncle, baby is unwell at the clinic, please send K900 right now or they will discharge us!"`,
      archetypeWarning: archetypeId === 'giver' ? 'Alert: Emotional distress triggers unconditional transfers that leave your own home exposed.' : undefined,
      choices: [
        {
          id: 'f1',
          label: 'Send Full K900 Unverified',
          actionSummary: 'Transfer K900 immediately on mobile money without verifying the clinic fees, leaving your home with K440 for next week’s food.',
          alignmentScore: 35,
          hypocrisyScore: 75,
          feedback: 'Generous heart, but reckless execution. Unverified transfers often get diverted, leaving your own children vulnerable.',
          verdict: 'Unbounded Giver',
        },
        {
          id: 'f2',
          label: 'Sustainable Generosity (Aligned)',
          actionSummary: 'Verify directly with the chemist/clinic and pay K350 direct for medicines; reserve K550 for your household cushion, bank K300 in school fee buffer.',
          alignmentScore: 100,
          hypocrisyScore: 0,
          feedback: 'Boundaried generosity. You solved the real emergency with direct payment while defending your own family’s stability.',
          verdict: 'Wise Provider',
        },
        {
          id: 'f3',
          label: 'Ignore & Block',
          actionSummary: 'Refuse to pick up the call and save all K1,200.',
          alignmentScore: 50,
          hypocrisyScore: 30,
          feedback: 'Protects money, but breaks essential community social safety nets without compassion.',
          verdict: 'Cold Detachment',
        },
      ],
    },
    piecework: {
      situationId: 'piecework',
      situationTitle: 'Between Jobs / Piecework',
      windfallAmount: 350,
      incomingAlert: 'Cash in Hand: K350 paid for two days of loading and site repair.',
      socialPressure: `Township peers: "Man, piecework was heavy today! Let’s sit at the tuckshop and buy some meat and local beers."`,
      choices: [
        {
          id: 'p1',
          label: 'Blow Today’s Wages',
          actionSummary: 'Spend K220 on drinks and meat for the crew, wake up tomorrow with K130.',
          alignmentScore: 20,
          hypocrisyScore: 85,
          feedback: 'Piecework income is volatile. Spending irregular income as if it were a guaranteed daily salary ensures perpetual vulnerability.',
          verdict: 'Instant Gratification',
        },
        {
          id: 'p2',
          label: 'Income Smoothing (Aligned)',
          actionSummary: 'Immediately move K150 to your hidden digital savings pocket, allocate K100 for basic meal staples, keep K100 for tomorrow’s job search.',
          alignmentScore: 100,
          hypocrisyScore: 0,
          feedback: 'Mastery of irregular cashflow. Smoothing unpredictable income is the hardest financial discipline.',
          verdict: 'Resilient Operator',
        },
      ],
    },
  };

  const selectedHotSeat = hotSeats[situationId] || hotSeats['employee'];

  return {
    protegeName,
    beats,
    hotSeat: selectedHotSeat,
  };
}

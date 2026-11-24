export const PASS = 0.66;
export const PLACEMENT_KEY = 'finlit-placement';

export type GroupId = 'group-0' | 'group-1' | 'group-2' | 'group-3' | 'group-4';
export const ORDER: GroupId[] = ['group-0', 'group-1', 'group-2', 'group-3', 'group-4'];

export const GROUPS: Record<GroupId, { n: string; name: string; category: string; mod: string; slug: string; icon: string }> = {
  'group-0': { n: '00', name: 'Foundations', category: 'Foundations', mod: 'Foundations & Introduction to Mobile Money', slug: 'module-0a', icon: '🌱' },
  'group-1': { n: '01', name: 'Foundational Skills', category: 'Level 1', mod: 'Income, Budgeting & Goal Setting', slug: 'module-1-0', icon: '💵' },
  'group-2': { n: '02', name: 'Building & Protecting Wealth', category: 'Level 2', mod: 'Risk Management and Insurance', slug: 'module-2-0', icon: '☂️' },
  'group-3': { n: '03', name: 'Advanced & Modern Finance', category: 'Level 3', mod: 'Taxation and Financial Planning', slug: 'module-3-0', icon: '📋' },
  'group-4': { n: '04', name: 'Long-Term Security', category: 'Level 4', mod: 'Retirement and Estate Planning', slug: 'module-4-0', icon: '🌇' },
};

export type TraitKey = 'IMP' | 'GEN' | 'SCM' | 'RSK' | 'PLN' | 'SAV';

export interface TraitInfo {
  name: string;
  tagline: string;
  max: number;
}

export const TRAIT_DEFS: Record<TraitKey, TraitInfo> = {
  IMP: { name: 'Impulse Spending', tagline: 'Tendency to spend on immediate wants', max: 26 },
  GEN: { name: 'Generosity & Family', tagline: 'Commitment to supporting relatives and community', max: 20 },
  SCM: { name: 'Scam Susceptibility', tagline: 'Vulnerability to high-yield promises', max: 7 },
  RSK: { name: 'Risk Tolerance', tagline: 'Willingness to take financial chances', max: 10 },
  PLN: { name: 'Planning & Discipline', tagline: 'Habit of budgeting, tracking, and buffering', max: 34 },
  SAV: { name: 'Saving & Preservation', tagline: 'Drive to hold reserves and accumulate assets', max: 25 },
};

export interface Archetype {
  id: string;
  title: string;
  tagline: string;
  focus: string;
  avatar: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
  spender: { id: 'spender', title: 'The Spender', tagline: 'Lives for today', focus: 'Mastering delayed gratification and creating a cash reserve buffer', avatar: '🛍️' },
  giver: { id: 'giver', title: 'The Giver', tagline: 'Big heart, heavy load', focus: 'Setting healthy financial boundaries while maintaining sustainable generosity', avatar: '🤝' },
  target: { id: 'target', title: 'The Target', tagline: 'Trusting and optimistic', focus: 'Due diligence, verifying regulatory licenses, and scam recognition', avatar: '🎯' },
  hustler: { id: 'hustler', title: 'The Hustler', tagline: 'Bold entrepreneur', focus: 'Managing downside risk, avoiding debt traps, and separating business cash', avatar: '⚡' },
  planner: { id: 'planner', title: 'The Planner', tagline: 'Disciplined and orderly', focus: 'Putting savings to work against inflation and seizing calculated risks', avatar: '📊' },
  saver: { id: 'saver', title: 'The Saver', tagline: 'Cautious wealth preserver', focus: 'Beating inflation through investment instead of keeping idle cash', avatar: '🛡️' },
  balanced: { id: 'balanced', title: 'The Balanced', tagline: 'Steady and adaptable', focus: 'Sharpening advanced wealth-building and long-term security', avatar: '⚖️' },
};

export interface Situation {
  id: string;
  title: string;
  subtitle: string;
  cash: number;
  income: number;
  obligations: number;
}

export const SITUATIONS: Situation[] = [
  { id: 'student', title: 'Student on Allowance', subtitle: 'Living on an allowance or stipend', cash: 300, income: 400, obligations: 0 },
  { id: 'employee', title: 'First Job or Employee', subtitle: 'Steady monthly salary with essential living costs', cash: 2500, income: 4000, obligations: 1500 },
  { id: 'trader', title: 'Small Trader / Own Business', subtitle: 'Variable cashflow from merchandise and sales', cash: 6000, income: 5500, obligations: 2000 },
  { id: 'family', title: 'Supporting a Family', subtitle: 'Covering rent, food, school fees, and relatives', cash: 3500, income: 5000, obligations: 3500 },
  { id: 'piecework', title: 'Between Jobs / Piecework', subtitle: 'Occasional gigs and daily day jobs', cash: 500, income: 800, obligations: 500 },
];

export interface ScenarioOption {
  text: string;
  points?: Partial<Record<TraitKey, number>>;
  flagDebt?: boolean;
  rpcValue: number; // 0 = correct/prudent, >0 = alternative
}

export interface ScenarioQuestion {
  id: number;
  group: GroupId;
  question: string;
  options: ScenarioOption[];
}

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 2,
    group: 'group-1',
    question: 'You receive an unexpected K500. What do you do first?',
    options: [
      { text: "Put most of it away into savings or reserve", points: { SAV: 3, PLN: 2 }, rpcValue: 0 },
      { text: 'Use it to pay down a pending debt or bill', points: { PLN: 3 }, rpcValue: 0 },
      { text: 'Share some with family or friends who need it', points: { GEN: 2, IMP: 1 }, rpcValue: 1 },
      { text: "Buy something I've wanted for a while", points: { IMP: 3 }, rpcValue: 2 },
    ],
  },
  {
    id: 3,
    group: 'group-1',
    question: 'A friend asks to borrow K300 and says they will pay back "soon."',
    options: [
      { text: 'I lend it and agree on a clear date to be repaid', points: { GEN: 2, PLN: 2 }, rpcValue: 0 },
      { text: 'I lend only half to protect my own cash balance', points: { GEN: 1, PLN: 2 }, rpcValue: 0 },
      { text: 'I say no politely because I have no spare funds', points: { SAV: 1 }, rpcValue: 1 },
      { text: "I lend it and don't expect it back", points: { GEN: 3 }, rpcValue: 2 },
    ],
  },
  {
    id: 5,
    group: 'group-1',
    question: 'Your phone breaks unexpectedly and a replacement costs K3,000.',
    options: [
      { text: 'Wait, save up and buy when I have the cash', points: { PLN: 3, SAV: 2 }, rpcValue: 0 },
      { text: 'Pay cash straight from my emergency savings', points: { PLN: 2, SAV: 1 }, rpcValue: 0 },
      { text: 'Buy on installments or buy-now-pay-later', points: { IMP: 2, PLN: 1 }, rpcValue: 1 },
      { text: 'Borrow from a friend or a kaloba lender', points: { IMP: 1 }, flagDebt: true, rpcValue: 2 },
    ],
  },
  {
    id: 6,
    group: 'group-2',
    question: 'You come into K50,000 lump sum. What happens in the first week?',
    options: [
      { text: 'I put it in a safe place (bank, T-bills) and take time to plan', points: { SAV: 3, PLN: 3 }, rpcValue: 0 },
      { text: 'I start or expand a business immediately', points: { RSK: 3, PLN: 1 }, rpcValue: 1 },
      { text: 'I help family members and clear outstanding debts', points: { GEN: 3, PLN: 1 }, rpcValue: 1 },
      { text: "I buy the things I've wanted for a long time", points: { IMP: 3 }, rpcValue: 2 },
    ],
  },
  {
    id: 7,
    group: 'group-0',
    question: 'Someone you trust says: "Put in K2,000 and get K3,000 back in 30 days. Guaranteed."',
    options: [
      { text: 'I ask who regulates it and how returns are made, then decide', points: { PLN: 2 }, rpcValue: 0 },
      { text: 'I ask friends who already joined if they got paid', points: { SCM: 2 }, rpcValue: 1 },
      { text: 'I try with a small amount first to test it', points: { SCM: 2, RSK: 2 }, rpcValue: 2 },
      { text: 'I put in the money right away—guaranteed returns are rare', points: { SCM: 3, RSK: 3 }, rpcValue: 3 },
    ],
  },
  {
    id: 8,
    group: 'group-3',
    question: 'A relative passes away and the family expects funeral contributions.',
    options: [
      { text: 'I give the amount I have budgeted for emergency family contributions', points: { GEN: 2, PLN: 2 }, rpcValue: 0 },
      { text: 'I give a smaller realistic amount and explain my limits', points: { GEN: 1 }, rpcValue: 0 },
      { text: 'I give whatever amount is asked, even if it hurts my budget', points: { GEN: 3 }, rpcValue: 1 },
      { text: 'I borrow money so I can give the expected amount', points: { GEN: 3 }, flagDebt: true, rpcValue: 2 },
    ],
  },
  {
    id: 9,
    group: 'group-0',
    question: 'Where do you mostly keep money you want to save?',
    options: [
      { text: 'A formal bank account or Treasury bill', points: { SAV: 3 }, rpcValue: 0 },
      { text: 'A chilimba (rotating village banking group)', points: { SAV: 2, PLN: 1 }, rpcValue: 0 },
      { text: 'A mobile money wallet (MTN or Airtel Money)', points: { SAV: 1 }, rpcValue: 1 },
      { text: 'Cash at home', points: { SAV: 1 }, rpcValue: 2 },
      { text: "I don't save right now", points: { IMP: 1 }, rpcValue: 3 },
    ],
  },
  {
    id: 10,
    group: 'group-1',
    question: 'Have you ever borrowed from kaloba (informal high-interest lenders)?',
    options: [
      { text: 'Never', points: { PLN: 3 }, rpcValue: 0 },
      { text: 'Once, in a real emergency', points: { PLN: 2 }, rpcValue: 0 },
      { text: 'A few times when times were hard', points: { PLN: 1 }, flagDebt: true, rpcValue: 1 },
      { text: 'Often—it helps me bridge month-to-month', points: { IMP: 1 }, flagDebt: true, rpcValue: 2 },
    ],
  },
  {
    id: 11,
    group: 'group-1',
    question: 'How do you keep track of where your money goes each month?',
    options: [
      { text: 'I write down or record every significant expense', points: { PLN: 3 }, rpcValue: 0 },
      { text: 'I check my balance on my phone regularly', points: { PLN: 1 }, rpcValue: 0 },
      { text: 'Only when the money runs low', points: {}, rpcValue: 1 },
      { text: "I don't track it", points: { IMP: 1 }, rpcValue: 2 },
    ],
  },
  {
    id: 12,
    group: 'group-1',
    question: "It's the day before payday and you are completely out of money.",
    options: [
      { text: "This doesn't happen because I always maintain a reserve buffer", points: { PLN: 3, SAV: 3 }, rpcValue: 0 },
      { text: 'I freeze all spending and wait for payday', points: { PLN: 2 }, rpcValue: 0 },
      { text: 'I do a small quick side hustle or sell something', points: { PLN: 2, RSK: 1 }, rpcValue: 1 },
      { text: 'I borrow from friends or a lender to get through', points: {}, flagDebt: true, rpcValue: 2 },
    ],
  },
  {
    id: 13,
    group: 'group-2',
    question: 'Friends around you are spending heavily on things you cannot afford.',
    options: [
      { text: "It doesn't affect me—I stick to my own pace", points: {}, rpcValue: 0 },
      { text: 'I ask how they afford it and learn from their habits', points: { PLN: 1 }, rpcValue: 0 },
      { text: 'I feel the pressure strongly but hold back', points: { IMP: 1 }, rpcValue: 1 },
      { text: 'I try to match them so I do not feel left out', points: { IMP: 3 }, rpcValue: 2 },
    ],
  },
  {
    id: 14,
    group: 'group-4',
    question: 'Would you rather have K1,000 today, or K1,500 guaranteed in three months?',
    options: [
      { text: 'K1,500 in three months (50% return)', points: { PLN: 2, SAV: 1 }, rpcValue: 0 },
      { text: 'Depends strictly on whether I have an urgent bill right now', points: { PLN: 1 }, rpcValue: 1 },
      { text: 'K1,000 today—money today is always better', points: { IMP: 3 }, rpcValue: 2 },
    ],
  },
];

export const REALITY_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 15,
    group: 'group-2',
    question: 'In the last 30 days, did you actually put any money into savings?',
    options: [
      { text: 'Yes, I saved money', points: { SAV: 3, PLN: 1 }, rpcValue: 0 },
      { text: 'No, I did not save', points: {}, rpcValue: 1 },
    ],
  },
  {
    id: 16,
    group: 'group-3',
    question: "In the last 30 days, did you lend money you didn't expect back, or give money you couldn't really afford?",
    options: [
      { text: 'No, I stayed within my limits', points: {}, rpcValue: 0 },
      { text: 'Yes, I gave or lent beyond my comfort', points: { GEN: 3 }, rpcValue: 1 },
    ],
  },
  {
    id: 17,
    group: 'group-4',
    question: 'In the last 30 days, did you buy something over K200 that was completely unplanned?',
    options: [
      { text: 'No, all purchases over K200 were budgeted', points: { PLN: 1 }, rpcValue: 0 },
      { text: 'Yes, I made an unplanned purchase over K200', points: { IMP: 3 }, rpcValue: 1 },
    ],
  },
];

export type Scores = Record<GroupId, { c: number; t: number }>;
export type Placement = { scores: Scores; ts: number };

export const isStrong = (s?: { c: number; t: number }) => !!s && s.t > 0 && s.c / s.t >= PASS;

export function roadmap(scores: Scores) {
  let work = ORDER.filter((g) => !isStrong(scores[g]));
  const allStrong = work.length === 0;
  if (allStrong) work = ['group-4'];
  const strong = ORDER.filter((g) => !work.includes(g));
  return { work, strong, allStrong, order: [...work, ...strong], start: work[0] };
}

export function loadLocal(): Placement | null {
  try {
    const p = JSON.parse(localStorage.getItem(PLACEMENT_KEY) || 'null');
    return p && p.phases ? { scores: p.phases, ts: p.ts } : p && p.scores ? p : null;
  } catch { return null; }
}

export function saveLocal(p: Placement) {
  try { localStorage.setItem(PLACEMENT_KEY, JSON.stringify({ v: 2, ts: p.ts, phases: p.scores })); } catch { /* ignore */ }
}

export function freeSlug(scores: Scores | null | undefined): string {
  return scores ? GROUPS[roadmap(scores).start].slug : GROUPS['group-0'].slug;
}

export function normalizeZmPhone(input: string): string | null {
  const d = input.replace(/\D/g, '');
  const local = d.startsWith('260') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d;
  return /^[79]\d{8}$/.test(local) ? `260${local}` : null;
}

export interface CharacterResult {
  situation: Situation;
  startingCash: number;
  monthlyIncome: number;
  monthlyObligations: number;
  startingDebt: number;
  rawTraits: Record<TraitKey, number>;
  normalizedTraits: Record<TraitKey, number>;
  archetype: Archetype;
}

export function computeCharacterResult(
  situation: Situation,
  rawTraits: Record<TraitKey, number>,
  hasDebtFlag: boolean
): CharacterResult {
  const normalizedTraits: Record<TraitKey, number> = {
    IMP: Math.min(10, Math.round((rawTraits.IMP / TRAIT_DEFS.IMP.max) * 10)),
    GEN: Math.min(10, Math.round((rawTraits.GEN / TRAIT_DEFS.GEN.max) * 10)),
    SCM: Math.min(10, Math.round((rawTraits.SCM / TRAIT_DEFS.SCM.max) * 10)),
    RSK: Math.min(10, Math.round((rawTraits.RSK / TRAIT_DEFS.RSK.max) * 10)),
    PLN: Math.min(10, Math.round((rawTraits.PLN / TRAIT_DEFS.PLN.max) * 10)),
    SAV: Math.min(10, Math.round((rawTraits.SAV / TRAIT_DEFS.SAV.max) * 10)),
  };

  const traitPriority: TraitKey[] = ['IMP', 'GEN', 'SCM', 'RSK', 'PLN', 'SAV'];
  let topTrait: TraitKey | null = null;
  let topScore = 6; // Must be > 6 to be an archetype

  for (const t of traitPriority) {
    if (normalizedTraits[t] > topScore) {
      topScore = normalizedTraits[t];
      topTrait = t;
    }
  }

  let archetype: Archetype = ARCHETYPES.balanced;
  if (topTrait === 'IMP') archetype = ARCHETYPES.spender;
  else if (topTrait === 'GEN') archetype = ARCHETYPES.giver;
  else if (topTrait === 'SCM') archetype = ARCHETYPES.target;
  else if (topTrait === 'RSK') archetype = ARCHETYPES.hustler;
  else if (topTrait === 'PLN') archetype = ARCHETYPES.planner;
  else if (topTrait === 'SAV') archetype = ARCHETYPES.saver;

  return {
    situation,
    startingCash: situation.cash,
    monthlyIncome: situation.income,
    monthlyObligations: situation.obligations,
    startingDebt: hasDebtFlag ? 500 : 0,
    rawTraits,
    normalizedTraits,
    archetype,
  };
}

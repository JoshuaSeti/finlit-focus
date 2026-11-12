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

// o[0] is always correct; options are shuffled on screen.
export const QUESTIONS: { g: GroupId; q: string; o: string[] }[] = [
  { g: 'group-0', q: 'A message says: "You won K5,000! Send K50 to release it." What do you do?', o: ['Ignore it and report the number', 'Send the K50, it is a small amount', 'Reply and ask for proof first', 'Send it, then tell a friend'] },
  { g: 'group-0', q: 'Which of these is an informal way Zambians save?', o: ['A chilimba (rotating savings group)', 'A fixed deposit at a bank', 'Treasury bills', 'A NAPSA pension'] },
  { g: 'group-1', q: 'You earn K4,000 a month. Under the 50/30/20 rule, how much goes to savings?', o: ['K800', 'K400', 'K1,200', 'K2,000'] },
  { g: 'group-1', q: 'You save K1,000 at 10% a year, compounded. How much do you have after 2 years?', o: ['K1,210', 'K1,200', 'K1,100', 'K2,000'] },
  { g: 'group-1', q: 'A lender charges K300 for a K1,000 loan for one month. About what is that per year?', o: ['360%', '30%', '120%', '3.6%'] },
  { g: 'group-1', q: 'How big should an emergency fund be?', o: ['About 3 to 6 months of essential spending', 'About one week of spending', 'Exactly K1,000 for everyone', 'Two years of all spending'] },
  { g: 'group-1', q: 'Your savings group keeps its records in a notebook. Two members disagree on who paid what. What does a digital village banking app mainly fix?', o: ['The records. Everyone can see who paid what', 'It removes the need to trust each other', 'It pays interest from a bank', 'It lets you borrow with no group rules'] },
  { g: 'group-2', q: "Inflation is 10% and your savings account pays 4%. Over the year, what happens to your money's buying power?", o: ['It falls', 'It grows by 6%', 'It stays the same', 'It doubles'] },
  { g: 'group-2', q: 'Which is usually the lowest-risk place for your money?', o: ['Government Treasury bills', 'Shares on the LuSE', 'Cryptocurrency', "A friend's new business"] },
  { g: 'group-2', q: 'You choose a higher excess on your car insurance. What usually happens to your premium?', o: ['It goes down', 'It goes up', 'It stays the same', 'You lose your cover'] },
  { g: 'group-3', q: 'Your phone suddenly loses network, then you get bank alerts for transfers you did not make. What first?', o: ['Call your network provider and your bank straight away', 'Wait until morning', 'Post about it on WhatsApp', 'Buy a new SIM next week'] },
  { g: 'group-3', q: 'What is NAPSA mainly for?', o: ['Pension and social security contributions', 'Short-term business loans', 'Buying shares', 'Car insurance'] },
  { g: 'group-3', q: 'A shop sign says "No returns. No refunds. No exchanges." Is that sign allowed under Zambian law?', o: ['No. A shop cannot deny all responsibility for its goods', 'Yes. Shops can set any rule they like', 'Yes, but only for imported goods', 'Yes, if the sign is big enough to see'] },
  { g: 'group-4', q: 'A man dies without a will. His family says his widow gets nothing. Is that right?', o: ['No. The Intestate Succession Act gives a surviving spouse a share', 'Yes. His relatives inherit everything', 'Yes. The government keeps it', 'Only if she goes to court within a week'] },
  { g: 'group-4', q: 'Two people save the same K300 a month. One starts at 25, the other at 35. At 60, who has more?', o: ['The one who started at 25, thanks to compounding', 'The one who started at 35', 'Both have the same', 'It cannot be known'] },
];

export type Scores = Record<GroupId, { c: number; t: number }>;
export type Placement = { scores: Scores; ts: number };

export const isStrong = (s?: { c: number; t: number }) => !!s && s.t > 0 && s.c / s.t >= PASS;

/** Weak groups first (in course order), strong groups last as review. */
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
  try { localStorage.setItem(PLACEMENT_KEY, JSON.stringify({ v: 1, ts: p.ts, phases: p.scores })); } catch { /* ignore */ }
}

/** The one free lesson: the first lesson of the learner's recommended starting point. */
export function freeSlug(scores: Scores | null | undefined): string {
  return scores ? GROUPS[roadmap(scores).start].slug : GROUPS['group-0'].slug;
}

/** Accepts +260…, 260…, 0…, or 9…/7… with any spaces or dashes. Returns 260XXXXXXXXX or null. */
export function normalizeZmPhone(input: string): string | null {
  const d = input.replace(/\D/g, '');
  const local = d.startsWith('260') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d;
  return /^[79]\d{8}$/.test(local) ? `260${local}` : null;
}

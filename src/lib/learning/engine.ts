import type {
  AnsweredItem,
  Course,
  EngineSettings,
  PrerequisiteRule,
  Question,
} from './types';

export const DEFAULT_SETTINGS: Omit<EngineSettings, 'id'> = {
  core_levels: 3,
  tier_weights: { '1': 1, '2': 2, '3': 3 },
  check_length: 6,
  pass_threshold: 3.5,
  ceiling_tier3_correct: 1,
  min_reliability_questions: 4,
  rolling_window_unit: 'questions',
  rolling_window_size: 15,
  repeat_avoid_checks: 2,
  lessons_before_check: 3,
  diagnostic_questions_per_field: 3,
  refresher_questions_per_field: 3,
  refresher_blocking: false,
  lesson_checks_enabled: false,
  lesson_check_count: 2,
  lesson_checks_count_toward_mastery: false,
  retention_enabled: false,
  retention_interval_days: 30,
};

/** Course-level overrides win over the global defaults. */
export function resolveSettings(
  global: EngineSettings,
  override?: Partial<EngineSettings> | null,
): EngineSettings {
  const clean = Object.fromEntries(
    Object.entries(override ?? {}).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
  return { ...global, ...(clean as Partial<EngineSettings>) };
}

export function weightOf(tier: number, weights: Record<string, number>): number {
  const w = weights?.[String(tier)];
  return typeof w === 'number' ? w : tier;
}

export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export interface ScoreResult {
  rawStars: number;
  stars: number;
  answered: number;
  tier3Correct: number;
  correct: number;
}

/** star_rating = 5 x (sum weight correct) / (sum weight served) */
export function scoreAnswers(items: AnsweredItem[], weights: Record<string, number>): ScoreResult {
  let served = 0;
  let earned = 0;
  let tier3Correct = 0;
  let correct = 0;
  for (const it of items) {
    const w = weightOf(it.tier, weights);
    served += w;
    if (it.is_correct) {
      earned += w;
      correct += 1;
      if (it.tier >= 3) tier3Correct += 1;
    }
  }
  const rawStars = served > 0 ? 5 * (earned / served) : 0;
  return { rawStars, stars: roundToHalf(rawStars), answered: items.length, tier3Correct, correct };
}

export interface PassEvaluation extends ScoreResult {
  passed: boolean;
  reasons: string[];
}

/** Star bar + Ceiling Requirement + minimum-reliability gate. All must hold. */
export function evaluatePass(items: AnsweredItem[], s: EngineSettings): PassEvaluation {
  const score = scoreAnswers(items, s.tier_weights);
  const reasons: string[] = [];
  if (score.stars < s.pass_threshold) {
    reasons.push(`Needs ${s.pass_threshold} stars (currently ${score.stars})`);
  }
  if (score.tier3Correct < s.ceiling_tier3_correct) {
    reasons.push(
      `Needs ${s.ceiling_tier3_correct} correct Tier 3 answer(s) (has ${score.tier3Correct})`,
    );
  }
  if (score.answered < s.min_reliability_questions) {
    reasons.push(`Needs at least ${s.min_reliability_questions} answered questions`);
  }
  return { ...score, passed: reasons.length === 0, reasons };
}

/** Staircase: start at Tier 2, +1 on correct (cap 3), -1 on incorrect (floor 1). */
export const START_TIER = 2;
export function nextTier(currentTier: number, wasCorrect: boolean): number {
  return Math.min(3, Math.max(1, currentTier + (wasCorrect ? 1 : -1)));
}

/**
 * Pick a question at (field, tier), avoiding recently-seen ids where the pool allows.
 * Falls back to the same tier with repeats, then to the nearest tier with content.
 */
export function pickQuestion(
  pool: Question[],
  fieldId: string,
  tier: number,
  excludeIds: Set<string>,
  usedInThisCheck: Set<string>,
): Question | null {
  const byTier = (t: number) =>
    pool.filter((q) => q.field_id === fieldId && q.tier === t && !usedInThisCheck.has(q.id));
  const tierOrder = [tier, ...[1, 2, 3].filter((t) => t !== tier).sort((a, b) => Math.abs(a - tier) - Math.abs(b - tier))];
  for (const t of tierOrder) {
    const candidates = byTier(t);
    if (!candidates.length) continue;
    const fresh = candidates.filter((q) => !excludeIds.has(q.id));
    const chooseFrom = fresh.length ? fresh : candidates;
    return chooseFrom[Math.floor(Math.random() * chooseFrom.length)];
  }
  return null;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/* Prerequisites                                                       */
/* ------------------------------------------------------------------ */

export type CourseStanding = 'none' | 'in_progress' | 'passed';

/**
 * Default rule template:
 *  - Core level N  -> Core level N-1 passed
 *  - Elective lvl N -> Core level N-1 passed AND Core level N in progress or passed
 */
export function autoPrerequisites(course: Course, allCourses: Course[]): PrerequisiteRule {
  const coreAt = (lvl: number) =>
    allCourses.find((c) => c.course_type === 'core' && c.level === lvl);
  const conditions: PrerequisiteRule['conditions'] = [];
  const prev = coreAt(course.level - 1);
  if (prev) conditions.push({ course_id: prev.id, requirement: 'passed' });
  if (course.course_type === 'elective') {
    const same = coreAt(course.level);
    if (same) conditions.push({ course_id: same.id, requirement: 'in_progress_or_passed' });
  }
  return { mode: 'auto', conditions };
}

export function effectiveRule(course: Course, allCourses: Course[]): PrerequisiteRule {
  const rule = course.prerequisite_rule;
  if (rule && rule.mode === 'custom') return rule;
  return autoPrerequisites(course, allCourses);
}

export interface UnlockResult {
  unlocked: boolean;
  missing: string[];
}

export function evaluateUnlock(
  course: Course,
  allCourses: Course[],
  standing: Record<string, CourseStanding>,
  manualUnlocks: Set<string> = new Set(),
): UnlockResult {
  if (manualUnlocks.has(course.id)) return { unlocked: true, missing: [] };
  const rule = effectiveRule(course, allCourses);
  const missing: string[] = [];
  for (const cond of rule.conditions ?? []) {
    const target = allCourses.find((c) => c.id === cond.course_id);
    const state = standing[cond.course_id] ?? 'none';
    const name = target?.title ?? 'a required course';
    if (cond.requirement === 'passed' && state !== 'passed') {
      missing.push(`Complete ${name} first`);
    }
    if (cond.requirement === 'in_progress_or_passed' && state === 'none') {
      missing.push(`Start ${name} first`);
    }
  }
  return { unlocked: missing.length === 0, missing };
}

/** Fields queued weakest-first from diagnostic star ratings. */
export function orderFieldsWeakestFirst<T extends { field_id: string }>(
  entries: T[],
  stars: Record<string, number>,
): T[] {
  return [...entries].sort((a, b) => (stars[a.field_id] ?? 0) - (stars[b.field_id] ?? 0));
}

export function starsLabel(stars: number): string {
  return `${stars.toFixed(1)} / 5`;
}

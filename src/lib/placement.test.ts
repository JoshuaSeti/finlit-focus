// @ts-expect-error bun test runtime module
import { describe, it, expect } from 'bun:test';
import { roadmap, isStrong, type Scores } from './placement';

const s = (pairs: [number, number][]): Scores => ({
  'group-0': { c: pairs[0][0], t: pairs[0][1] }, 'group-1': { c: pairs[1][0], t: pairs[1][1] },
  'group-2': { c: pairs[2][0], t: pairs[2][1] }, 'group-3': { c: pairs[3][0], t: pairs[3][1] },
  'group-4': { c: pairs[4][0], t: pairs[4][1] },
});

describe('placement roadmap', () => {
  it('2 of 3 counts as strong (66% pass mark)', () => {
    expect(isStrong({ c: 2, t: 3 })).toBe(true);
    expect(isStrong({ c: 1, t: 2 })).toBe(false);
  });
  it('puts weak groups first and strong groups last', () => {
    const r = roadmap(s([[2, 2], [1, 5], [3, 3], [0, 3], [2, 2]]));
    expect(r.order).toEqual(['group-1', 'group-3', 'group-0', 'group-2', 'group-4']);
    expect(r.start).toBe('group-1');
  });
  it('all strong starts at the last phase', () => {
    const r = roadmap(s([[2, 2], [5, 5], [3, 3], [3, 3], [2, 2]]));
    expect(r.allStrong).toBe(true);
    expect(r.start).toBe('group-4');
  });
});

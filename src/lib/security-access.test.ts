// @ts-expect-error bun test runtime module
import { describe, expect, it } from 'bun:test';
declare const process: { env: Record<string, string | undefined> };

// Opt-in live regression tests: credentials belong to a disposable learner.
const url = process.env.SECURITY_TEST_URL;
const key = process.env.SECURITY_TEST_KEY;
const token = process.env.SECURITY_TEST_TOKEN;
const user = process.env.SECURITY_TEST_USER;
const live = url && key && token && user ? describe : describe.skip;

async function request(path: string, body: unknown) {
  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: { apikey: key ?? '', Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

live('selected security access rules', () => {
  it('denies direct placement score insertion', async () => {
    const r = await request('/rest/v1/placement_results', { user_id: user, scores: {}, start_group: 'group-4', correct: 15, total: 15, server_scored: true });
    expect(r.status).toBe(403);
  });
  it('denies direct simulator flag insertion', async () => {
    const r = await request('/rest/v1/learner_flags', { profile_id: user, flag_key: 'learned_investing_fundamentals' });
    expect(r.status).toBe(403);
  });
  it('denies another learners practice progress', async () => {
    const r = await request('/rest/v1/rpc/practice_progress', { p: '11111111-1111-4111-8111-111111111111', p_lesson: '1-0', p_session: 1 });
    expect(r.data.error).toBe('not_authorized');
  });
  it('denies mismatched practice sessions', async () => {
    const r = await request('/rest/v1/rpc/practice_progress', { p: user, p_lesson: '1-0', p_session: -1 });
    expect(r.data.error).toBe('invalid_session');
  });
  it('rejects malformed placement answers', async () => {
    const r = await request('/rest/v1/rpc/submit_placement', { p_answers: [0] });
    expect(r.status).toBe(400);
  });
  it('denies unpaid retakes after the initial placement', async () => {
    const r = await request('/rest/v1/rpc/submit_placement', { p_answers: Array(15).fill(0) });
    expect(r.status).toBe(403);
  });
  it('denies an unassigned starter lesson', async () => {
    const r = await request('/functions/v1/module-content', { slug: 'module-4-0' });
    expect(r.status).toBe(403);
  });
});
// @ts-expect-error bun test runtime module
import { describe, expect, it } from 'bun:test';
declare const process: { env: Record<string, string | undefined> };

const url = process.env.SECURITY_TEST_URL;
const key = process.env.SECURITY_TEST_KEY;
const token = process.env.SECURITY_TEST_TOKEN;
const user = process.env.SECURITY_TEST_USER;
const live = url && key && token && user ? describe : describe.skip;

async function api(path: string, body?: unknown, method = 'POST', anonymous = false) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { apikey: key ?? '', Authorization: `Bearer ${anonymous ? key : token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

live('selected security protections with a disposable learner', () => {
  it('rejects learner-written assessment outcomes', async () => {
    expect((await api('assessment_checks', { user_id: user, passed: true, completed: true, star_rating: 5 })).status).toBe(403);
  });
  it('rejects debt balance rewriting', async () => {
    expect((await api(`debts?profile_id=eq.${user}`, { outstanding_balance: 0 }, 'PATCH')).status).toBe(403);
  });
  it('rejects fabricated feature unlocks', async () => {
    expect((await api('learner_feature_unlocks', { profile_id: user, feature_key: 'debts', unlocked_at: new Date().toISOString() })).status).toBe(403);
  });
  it('rejects learner-created daily event markers', async () => {
    expect((await api('learner_daily_check', { profile_id: user, check_date: '2026-11-25', rolled: true })).status).toBe(403);
  });
  it('rejects fabricated retained venture profits', async () => {
    expect((await api('ventures', { profile_id: user, name: 'Fabricated', category: 'trading', starting_capital: 1, retained: 999999 })).status).toBe(403);
  });
  it('rejects direct simulator cash updates', async () => {
    expect((await api(`sim_profiles?id=eq.${user}`, { cash_balance: 999999 }, 'PATCH')).status).toBe(403);
  });
  it('rejects replacement simulator profiles with arbitrary money', async () => {
    expect((await api('sim_profiles', { id: user, cash_balance: 999999 })).status).toBe(403);
  });
  it('rejects reading another learners saved advice', async () => {
    expect((await api('rpc/mirror_advice', { p: '11111111-1111-4111-8111-111111111111', p_lesson: '1-0' })).status).toBe(403);
  });
  it('keeps own advice accessible', async () => {
    expect((await api('rpc/mirror_advice', { p: user, p_lesson: '1-0' })).status).toBe(200);
  });
  it('rejects pre-approved anonymous wall notes', async () => {
    const members = await api('team_members?select=id&is_active=eq.true&limit=1', undefined, 'GET', true);
    expect(members.data.length).toBeGreaterThan(0);
    const denied = await api('wall_notes', { member_id: members.data[0].id, author: 'Security regression', message: 'Unauthorized approval', is_approved: true }, 'POST', true);
    expect([401, 403]).toContain(denied.status);
    expect(denied.data.code).toBe('42501');
  });
  it('rejects pre-approved program applications', async () => {
    const program = process.env.SECURITY_TEST_PROGRAM;
    expect(Boolean(program)).toBe(true);
    const body = { program_id: program, applicant_name: 'Security regression', applicant_email: 'regression@example.com', status: 'approved' };
    expect((await api('program_applications', body)).status).toBe(403);
    const guest = await api('program_applications', body, 'POST', true);
    expect([401, 403]).toContain(guest.status);
    expect(guest.data.code).toBe('42501');
  });
  it('assigns student cash once and preserves it on a repeated setup', async () => {
    expect((await api('rpc/submit_placement', { p_answers: Array(15).fill(0) })).status).toBe(200);
    const first = await api('rpc/initialize_simulator', { p_situation: 'student', p_backstory: 'Student' });
    expect(first.status).toBe(200);
    expect(first.data.initialized).toBe(true);
    const repeat = await api('rpc/initialize_simulator', { p_situation: 'trader', p_backstory: 'Trader' });
    expect(repeat.data.initialized).toBe(false);
    const player = await api(`sim_profiles?id=eq.${user}&select=cash_balance,initial_situation`, undefined, 'GET');
    expect(player.data[0].cash_balance).toBe(300);
    expect(player.data[0].initial_situation).toBe('student');
  });
  it('rejects arbitrary starting situations', async () => {
    expect((await api('rpc/initialize_simulator', { p_situation: 'millionaire' })).status).toBe(400);
  });
});
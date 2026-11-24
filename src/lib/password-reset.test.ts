// @ts-expect-error bun test runtime module
import { describe, expect, it } from 'bun:test';
import { isRecoveryLink, resetLoginPath } from './password-reset';

describe('password recovery', () => {
  it('recognizes recovery links but not ordinary sign-in links', () => {
    expect(isRecoveryLink('#type=recovery&access_token=test-token')).toBe(true);
    expect(isRecoveryLink('#type=signup&access_token=test-token')).toBe(false);
    expect(isRecoveryLink('#type=recovery')).toBe(false);
    expect(isRecoveryLink('#type=recovery&access_token=test-token&error=expired')).toBe(false);
    expect(isRecoveryLink('')).toBe(false);
  });
  it('only returns to the four supported login pages', () => {
    for (const path of ['/login?mode=signin', '/admin/login', '/facilitator/login', '/sim/login.html']) {
      expect(resetLoginPath(path)).toBe(path);
    }
    expect(resetLoginPath('https://example.com')).toBe('/login?mode=signin');
    expect(resetLoginPath('//example.com')).toBe('/login?mode=signin');
    expect(resetLoginPath(null)).toBe('/login?mode=signin');
  });
});
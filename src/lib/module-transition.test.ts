// @ts-expect-error bun test runtime module
import { describe, expect, it } from 'bun:test';
// @ts-expect-error node runtime in bun tests
import { readFileSync } from 'node:fs';

describe('Module end-of-lesson transition bridge', () => {
  const bridge = readFileSync('public/finlit-bridge.js', 'utf8');
  const player = readFileSync('src/pages/modules/ModulePlayer.tsx', 'utf8');

  it('hides the Back to path button (#fin-back) inside lesson modules', () => {
    expect(bridge).toContain('#fin-next,#fin-back{display:none!important}');
  });

  it('replaces the end-of-module Back to path bar label with a Protégé handoff', () => {
    expect(bridge).toMatch(/\/back to path\/i/);
    expect(bridge).toContain("post('enter-protege')");
  });

  it('handles enter-protege in ModulePlayer to smoothly open the Protégé stage', () => {
    expect(player).toContain("d.type === 'enter-protege'");
    expect(player).toContain("setSimulationStep('protege')");
  });
});
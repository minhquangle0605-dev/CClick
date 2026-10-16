import { describe, expect, it } from 'vitest';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture } from '../helpers/game-fixture';

describe('Offline settlement', () => {
  it('activates the migrated click baseline even when opened at the exact checkpoint', () => {
    const { state, catalog, clock } = gameFixture();
    state.offlineClickPower = '0';
    const first = settleOffline(state, catalog, clock.nowUtc());
    expect(first.summary.coin).toBe('0');
    expect(first.state.offlineClickPower).toBe('1');
    clock.advance(1000);
    expect(settleOffline(first.state, catalog, clock.nowUtc()).summary.coin).toBe('5');
  });
  it.each([
    [0, '0'],
    [600, '6000'],
    [28800, '288000'],
    [86400, '864000'],
    [172800, '864000'],
  ])('settles %s seconds at 10 saved CPS plus auto clicks at 50 percent', (seconds, expected) => {
    const { state, catalog, clock } = gameFixture();
    state.offlineCps = '10';
    state.generators['generator.auto-press'] = 10;
    clock.advance(Number(seconds) * 1000);
    const result = settleOffline(state, catalog, clock.nowUtc());
    expect(result.state.wallet.coin).toBe(expected);
    expect(result.state.lastSimulatedAtUtc).toBe(clock.nowUtc());
    expect(result.summary.capped).toBe(Number(seconds) > 86400);
    expect(settleOffline(result.state, catalog, clock.nowUtc()).state.wallet.coin).toBe(expected);
    clock.advance(1000);
    expect(settleOffline(result.state, catalog, clock.nowUtc()).summary.coin).toBe('10');
  });
  it('preserves a future watermark on a clock rollback', () => {
    const { state, catalog, clock } = gameFixture();
    state.offlineCps = '10';
    clock.advance(-60000);
    const result = settleOffline(state, catalog, clock.nowUtc());
    expect(result.summary.clockRollback).toBe(true);
    expect(result.state).toBe(state);
    expect(result.summary.coin).toBe('0');
  });
  it('uses saved CPS during a catalog change, then stores the new baseline', () => {
    const { state, catalog, clock } = gameFixture();
    state.offlineCps = '10';
    state.generators['generator.auto-press'] = 10;
    catalog.generators[1]!.baseCps = '100';
    clock.advance(1000);
    const result = settleOffline(state, catalog, clock.nowUtc());
    expect(result.summary.coin).toBe('10');
    expect(result.state.offlineCps).toBe('1000');
  });
  it('caps at numeric capacity while consuming the full elapsed interval', () => {
    const { state, catalog, clock } = gameFixture();
    state.offlineCps = '1e100';
    clock.advance(86400000);
    const result = settleOffline(state, catalog, clock.nowUtc());
    expect(result.state.wallet.coin).toBe('1' + '0'.repeat(100));
    expect(result.state.lastSimulatedAtUtc).toBe(clock.nowUtc());
    expect(settleOffline(result.state, catalog, clock.nowUtc()).summary.coin).toBe('0');
  });
});

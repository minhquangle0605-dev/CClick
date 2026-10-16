import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { activeClickPower, activeProductionPerSecond } from '@core/economy/selectors';
import { applyModifiers, temporaryMultiplier } from '@core/effects/pipeline';
import type { ActiveEffect } from '@core/effects/effect.types';
import { previewBooster } from '@core/boosters/use-booster';
import { settleOffline } from '@core/offline/settle-offline';
import { gameFixture } from '../helpers/game-fixture';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { createItemHistory } from '@core/statistics/item-history';

function boostedFixture() {
  const fixture = gameFixture();
  fixture.state.generators['generator.auto-press'] = 10;
  fixture.state.offlineCps = '10';
  fixture.state.inventory = {
    'booster.turbo-mint': 3,
    'booster.power-tap': 1,
    'booster.time-warp': 1,
  };
  fixture.state.events.rainbowUnlocked = true;
  fixture.state.events.nextRainbowAt = 900000;
  fixture.state.events.objects = [
    { id: 'test-rainbow', kind: 'rainbow', x: 50, lane: 2, spawnsAt: 0, expiresAt: 8000 },
  ];
  return fixture;
}
describe('Effect pipeline and booster consumption', () => {
  it('wall-clock jumps expire effects without creating active production for the skipped hours', () => {
    const { state, catalog, clock } = boostedFixture();
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.turbo-mint' });
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('30');
    clock.wallMilliseconds += 3600000;
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('50');
    expect(engine.getSnapshot().effects).toEqual([]);
    expect(engine.getSnapshot().events.activeMs).toBe(2000);
  });
  it('adds flat bonuses first, adds percentages within a group, then multiplies groups', () => {
    expect(
      applyModifiers('10', 'click', [
        { target: 'click', operation: 'multiply', value: '2', stackGroup: 'permanent' },
        { target: 'click', operation: 'percent', value: '20', stackGroup: 'cards' },
        { target: 'click', operation: 'add', value: '5', stackGroup: 'upgrade' },
        { target: 'click', operation: 'percent', value: '30', stackGroup: 'cards' },
      ]),
    ).toBe('45');
  });
  it('takes the strongest same-group effect and caps independent groups at x20', () => {
    const base: ActiveEffect = {
      sourceId: 'a',
      target: 'production',
      operation: 'multiply',
      value: '4',
      stackGroup: 'booster',
      startsAt: 0,
      expiresAt: 1000,
      stackPolicy: 'extend',
    };
    const effects = [
      base,
      { ...base, sourceId: 'b', value: '2' },
      { ...base, sourceId: 'c', stackGroup: 'frenzy', value: '6' },
    ];
    expect(temporaryMultiplier(effects, 'production', 500, '20')).toEqual({
      value: '20',
      capped: true,
    });
    expect(temporaryMultiplier(effects, 'click', 500, '20').value).toBe('1');
    expect(temporaryMultiplier(effects, 'production', 1000, '20').value).toBe('1');
  });
  it.each([1, 10, 60])(
    'integrates Frenzy and Turbo expiry exactly at %s callbacks/second',
    (fps) => {
      const { state, catalog, clock } = boostedFixture();
      const engine = createEngine(state, catalog, clock);
      expect(engine.dispatch({ type: 'UseBooster', itemId: 'booster.turbo-mint' }).ok).toBe(true);
      expect(engine.dispatch({ type: 'UseBooster', itemId: 'booster.power-tap' }).ok).toBe(true);
      expect(engine.dispatch({ type: 'CollectEvent', objectId: 'test-rainbow' }).ok).toBe(true);
      expect(activeProductionPerSecond(engine.getSnapshot(), catalog)).toBe('60');
      expect(activeClickPower(engine.getSnapshot(), catalog)).toBe('9');
      const origin = clock.wallMilliseconds;
      for (let i = 1; i <= 90 * fps; i++) {
        clock.milliseconds = (i * 1000) / fps;
        clock.wallMilliseconds = origin + clock.milliseconds;
        expect(engine.tick().ok).toBe(true);
      }
      expect(engine.getSnapshot().wallet.coin).toBe('4992');
      expect(engine.getSnapshot().effects).toHaveLength(0);
      expect(engine.getSnapshot().offlineCps).toBe('10');
    },
  );
  it.each(['booster.turbo-mint', 'booster.power-tap', 'booster.golden-magnet'])(
    '%s extends beyond the old limit, caps at 24h without spending at cap, and survives save/offline',
    async (id) => {
      const { state, catalog, clock } = boostedFixture();
      state.inventory[id] = 4;
      const engine = createEngine(state, catalog, clock);
      for (let count = 0; count < 3; count++)
        expect(engine.dispatch({ type: 'UseBooster', itemId: id }).ok).toBe(true);
      const item = catalog.boosters.find((item) => item.id === id)!;
      expect(engine.getSnapshot().effects).toHaveLength(1);
      expect(engine.getSnapshot().effects[0]!.value).toBe(item.effects[0]!.value);
      expect(engine.getSnapshot().effects[0]!.expiresAt - state.effectsAtMs).toBe(
        item.durationSeconds * 3000,
      );
      const nearCap = { ...structuredClone(engine.getSnapshot()) };
      nearCap.inventory[id] = 2;
      nearCap.itemHistory = createItemHistory(clock.nowUtc(), nearCap);
      nearCap.effects[0]!.expiresAt = state.effectsAtMs + 86400000 - 1000;
      const cappedEngine = createEngine(nearCap, catalog, clock);
      expect(previewBooster(nearCap, catalog, id).remainingSeconds).toBe(86400);
      expect(cappedEngine.dispatch({ type: 'UseBooster', itemId: id }).ok).toBe(true);
      const capped = cappedEngine.getSnapshot();
      expect(capped.effects[0]!.expiresAt - capped.effectsAtMs).toBe(86400000);
      expect(cappedEngine.dispatch({ type: 'UseBooster', itemId: id })).toEqual({
        ok: false,
        error: 'effect-cap',
      });
      expect(cappedEngine.getSnapshot().inventory[id]).toBe(1);
      const restored = (
        await decodeSave(await createSave(capped, catalog, clock.nowUtc()), catalog)
      ).payload;
      expect(restored.effects).toEqual(capped.effects);
      clock.advance(3600000);
      const afterHour = settleOffline(restored, catalog, clock.nowUtc());
      expect(afterHour.state.effects[0]!.expiresAt - afterHour.state.effectsAtMs).toBe(
        23 * 3600000,
      );
      expect(afterHour.summary.coin).toBe(
        id === 'booster.power-tap' ? '72000' : id === 'booster.turbo-mint' ? '54000' : '36000',
      );
      clock.advance(23 * 3600000);
      const expired = settleOffline(afterHour.state, catalog, clock.nowUtc());
      expect(expired.state.effects).toEqual([]);
      expect(expired.state.inventory[id]).toBe(1);
    },
  );
  it('Time Warp previews permanent CPS and changes neither active clocks nor effect expiry', () => {
    const { state, catalog, clock } = boostedFixture();
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.turbo-mint' });
    engine.dispatch({ type: 'CollectEvent', objectId: 'test-rainbow' });
    const before = engine.getSnapshot();
    expect(previewBooster(before, catalog, 'booster.time-warp').reward).toBe('36000');
    expect(engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' }).ok).toBe(true);
    const next = engine.getSnapshot();
    expect(next.wallet.coin).toBe('36000');
    expect(next.statistics.totalProducedCoin).toBe('36000');
    expect(next.events).toEqual(before.events);
    expect(next.effects).toEqual(before.effects);
    expect(next.lastSimulatedAtUtc).toBe(before.lastSimulatedAtUtc);
    expect(engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' })).toEqual({
      ok: false,
      error: 'missing-item',
    });
  });
  it('rejects Time Warp without production and at the numeric ceiling without consuming it', () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['booster.time-warp'] = 1;
    expect(
      createEngine(state, catalog, clock).dispatch({
        type: 'UseBooster',
        itemId: 'booster.time-warp',
      }),
    ).toEqual({ ok: false, error: 'no-production' });
    state.generators['generator.auto-press'] = 1;
    state.wallet.coin = state.statistics.totalProducedCoin = '1e100';
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' })).toEqual({
      ok: false,
      error: 'numeric-limit',
    });
    expect(engine.getSnapshot().inventory['booster.time-warp']).toBe(1);
  });
  it('honors temporary expiry offline and advances the automatic Gold clock', () => {
    const { state, catalog, clock } = boostedFixture();
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.turbo-mint' });
    clock.advance(120000);
    const result = settleOffline(engine.getSnapshot(), catalog, clock.nowUtc());
    expect(result.summary.coin).toBe('1500');
    expect(result.state.effects).toEqual([]);
    expect(result.state.events.objects).toEqual([]);
    expect(result.state.events.activeMs).toBe(120000);
    expect(result.state.events.rng).toBe(state.events.rng);
  });
});

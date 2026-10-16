import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { clickPower, productionPerSecond } from '@core/economy/selectors';
import { gameFixture } from '../helpers/game-fixture';

describe('Engine with injected monotonic clock', () => {
  it('credits exactly 100 coins for 100 accepted clicks', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    for (let i = 0; i < 100; i++) expect(engine.dispatch({ type: 'ClickCoin' }).ok).toBe(true);
    expect(engine.getSnapshot().wallet.coin).toBe('100');
    expect(engine.getSnapshot().statistics).toEqual({
      clicks: 100,
      totalProducedCoin: '100',
      totalSpentCoin: '0',
      totalGiftCoin: '0',
    });
    expect(engine.getSnapshot().revision).toBe(100);
    expect(state.wallet.coin).toBe('0');
  });
  it.each([1, 30, 60, 144])(
    'earns exactly 1200 in 60s at 10 CPS plus 10 automatic clicks/s, %s callbacks per second',
    (fps) => {
      const { state, catalog, clock } = gameFixture();
      state.generators['generator.auto-press'] = 10;
      const engine = createEngine(state, catalog, clock);
      for (let i = 1; i <= 60 * fps; i++) {
        clock.milliseconds = (i * 1000) / fps;
        engine.tick();
      }
      expect(engine.getSnapshot().wallet.coin).toBe('1200');
      engine.tick();
      expect(engine.getSnapshot().wallet.coin).toBe('1200');
    },
    10000,
  );
  it('settles production before a click and preserves tiny elapsed fractions', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.hand-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    clock.advance(0.6);
    engine.tick();
    clock.advance(0.6);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('0.0001');
    clock.milliseconds = 1000;
    const result = engine.dispatch({ type: 'ClickCoin' });
    expect(result.ok && result.value.events.map((event) => event.type)).toEqual([
      'CoinEarned',
      'CoinEarned',
      'CoinEarned',
    ]);
    expect(engine.getSnapshot().wallet.coin).toBe('11.1');
  });
  it('ignores wall-clock changes and does not double-pay when monotonic time goes backward', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    engine.tick();
    clock.wallMilliseconds += 86400000;
    clock.milliseconds = 500;
    engine.tick();
    clock.milliseconds = 1000;
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('11');
    clock.milliseconds = 2000;
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('22');
  });
  it('keeps engine pause free of wall-clock rewards; the session settles offline separately', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    engine.pause();
    clock.advance(86400000);
    engine.tick();
    expect(engine.dispatch({ type: 'ClickCoin' })).toEqual({ ok: false, error: 'paused' });
    engine.resume();
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('22');
    clock.advance(86400000);
    const reloaded = createEngine(structuredClone(engine.getSnapshot()), catalog, clock);
    reloaded.tick();
    expect(reloaded.getSnapshot().wallet.coin).toBe('22');
  });
  it('returns stable frozen snapshots and notifies only on changes', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    const first = engine.getSnapshot();
    let notifications = 0;
    const unsubscribe = engine.subscribe(() => notifications++);
    engine.tick();
    expect(engine.getSnapshot()).toBe(first);
    expect(() => {
      engine.getSnapshot().wallet.coin = '500';
    }).toThrow();
    engine.dispatch({ type: 'ClickCoin' });
    expect(notifications).toBe(1);
    unsubscribe();
    engine.dispatch({ type: 'ClickCoin' });
    expect(notifications).toBe(1);
  });
  it('rejects a locked shop command without spending money', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    expect(
      engine.dispatch({
        type: 'PurchaseGenerator',
        generatorId: 'generator.auto-press',
        quantity: 1,
      }),
    ).toEqual({ ok: false, error: 'locked' });
    expect(engine.getSnapshot()).toEqual(state);
  });
  it('does not partly mutate wallet or stats when an amount overflows', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1e100';
    state.generators['generator.auto-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'ClickCoin' })).toEqual({ ok: false, error: 'numeric-limit' });
    clock.advance(1000);
    expect(engine.tick().ok).toBe(true);
    expect(engine.getSnapshot().wallet.coin).toBe('1' + '0'.repeat(100));
    expect(engine.getSnapshot().statistics.totalProducedCoin).toBe('1' + '0'.repeat(100));
    expect(engine.getSnapshot().tracking.coin.production).toBe('0');
    expect(engine.getSnapshot().tracking.coin.click).toBe('0');
  });
  it('applies additive upgrades before multipliers regardless of catalog order', () => {
    const { state, catalog } = gameFixture();
    const flat = catalog.upgrades[0]!;
    catalog.upgrades.push({
      ...flat,
      id: 'upgrade.double',
      effect: { target: 'click', operation: 'multiply', value: '2' },
    });
    state.purchasedUpgradeIds = [flat.id, 'upgrade.double'];
    expect(clickPower(state, catalog)).toBe('4');
    catalog.upgrades.reverse();
    expect(clickPower(state, catalog)).toBe('4');
    expect(productionPerSecond(state, catalog)).toBe('0');
  });
});

import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { bulkPrice, maxAffordable } from '@core/shop/calculate-price';
import { quoteGenerator, quoteUpgrade } from '@core/shop/quotes';
import { productionPerSecond, clickPower } from '@core/economy/selectors';
import { amount } from '@shared/amount';
import { gameFixture } from '../helpers/game-fixture';

describe('Exact shop transactions', () => {
  it('rounds each unit before summing and matches 100 separate purchases', () => {
    const { state, catalog, clock } = gameFixture();
    const item = catalog.generators[0]!;
    expect(bulkPrice(item, 0, 10)).toBe('308');
    expect(bulkPrice(item, 0, 2)).toBe('33');
    state.wallet.coin = state.statistics.totalProducedCoin = '10000000000';
    const bulk = createEngine(state, catalog, clock);
    const singles = createEngine(state, catalog, clock);
    expect(
      bulk.dispatch({ type: 'PurchaseGenerator', generatorId: item.id, quantity: 100 }).ok,
    ).toBe(true);
    for (let n = 0; n < 100; n++)
      expect(
        singles.dispatch({ type: 'PurchaseGenerator', generatorId: item.id, quantity: 1 }).ok,
      ).toBe(true);
    expect(bulk.getSnapshot().wallet).toEqual(singles.getSnapshot().wallet);
    expect(bulk.getSnapshot().statistics).toEqual(singles.getSnapshot().statistics);
    expect(bulk.getSnapshot().generators).toEqual(singles.getSnapshot().generators);
  });
  it.each([
    ['0', 0],
    ['14.999', 0],
    ['15', 1],
    ['32.999', 1],
    ['33', 2],
    ['308', 10],
    ['1e30', null],
  ] as const)('finds exact Max for a wallet of %s', (balance, expected) => {
    const { catalog } = gameFixture();
    const item = catalog.generators[0]!;
    const q = maxAffordable(item, 0, balance);
    if (expected !== null) expect(q).toBe(expected);
    if (q) expect(amount.compare(bulkPrice(item, 0, q)!, balance)).toBeLessThanOrEqual(0);
    expect(amount.compare(bulkPrice(item, 0, q + 1)!, balance)).toBe(1);
  });
  it('rejects insufficient funds and invalid quantities without partial purchases', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '32';
    const engine = createEngine(state, catalog, clock);
    for (const quantity of [0, -1, 1.5, NaN, Infinity, 5001])
      expect(
        engine.dispatch({
          type: 'PurchaseGenerator',
          generatorId: 'generator.hand-press',
          quantity,
        }),
      ).toEqual({ ok: false, error: 'invalid-quantity' });
    expect(
      engine.dispatch({
        type: 'PurchaseGenerator',
        generatorId: 'generator.hand-press',
        quantity: 10,
      }),
    ).toEqual({ ok: false, error: 'insufficient-funds' });
    expect(engine.getSnapshot()).toEqual(state);
    expect(
      engine.dispatch({
        type: 'PurchaseGenerator',
        generatorId: 'generator.hand-press',
        quantity: 'max',
      }).ok,
    ).toBe(true);
    expect(engine.getSnapshot().wallet.coin).toBe('17');
    expect(engine.getSnapshot().generators['generator.hand-press']).toBe(1);
  });
  it('settles old CPS before buying and uses new CPS afterward', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000';
    state.generators['generator.auto-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    clock.advance(1000);
    expect(
      engine.dispatch({
        type: 'PurchaseGenerator',
        generatorId: 'generator.auto-press',
        quantity: 1,
      }).ok,
    ).toBe(true);
    expect(engine.getSnapshot().wallet.coin).toBe('896');
    expect(engine.getSnapshot().offlineCps).toBe('2');
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('908');
  });
  it('enforces unlocks and unique upgrades; shows truthful click/production payback', () => {
    const { state, catalog, clock } = gameFixture();
    expect(quoteGenerator(state, catalog, 'generator.auto-press', 1).error).toBe('locked');
    state.wallet.coin = state.statistics.totalProducedCoin = '10000';
    const engine = createEngine(state, catalog, clock);
    expect(
      engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: 'upgrade.precision-drive' }),
    ).toEqual({ ok: false, error: 'locked' });
    const clickQuote = quoteUpgrade(state, catalog, 'upgrade.polished-die');
    expect(clickQuote.deltaClick).toBe('1');
    expect(clickQuote.paybackSeconds).toBe('5');
    expect(engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: 'upgrade.polished-die' }).ok).toBe(
      true,
    );
    const after = engine.getSnapshot();
    expect(engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: 'upgrade.polished-die' })).toEqual(
      { ok: false, error: 'already-owned' },
    );
    expect(engine.getSnapshot()).toBe(after);
    expect(clickPower(after, catalog)).toBe('2');
    engine.dispatch({
      type: 'PurchaseGenerator',
      generatorId: 'generator.auto-press',
      quantity: 1,
    });
    const production = quoteUpgrade(engine.getSnapshot(), catalog, 'upgrade.precision-drive');
    expect(production.deltaCps).toBe('1');
    expect(production.paybackSeconds).toBe('750');
    engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: 'upgrade.precision-drive' });
    expect(productionPerSecond(engine.getSnapshot(), catalog)).toBe('2');
  });
  it('keeps balances and stats consistent through a simulated 30-minute buying session', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    for (let second = 0; second < 1800; second++) {
      clock.advance(1000);
      engine.tick();
      for (let click = 0; click < 3; click++) engine.dispatch({ type: 'ClickCoin' });
      if (second % 10 === 0) {
        for (const item of [...catalog.generators].reverse())
          engine.dispatch({ type: 'PurchaseGenerator', generatorId: item.id, quantity: 'max' });
        for (const item of catalog.upgrades)
          engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: item.id });
      }
    }
    const result = engine.getSnapshot();
    expect(amount.add(result.wallet.coin, result.statistics.totalSpentCoin)).toBe(
      result.statistics.totalProducedCoin,
    );
    expect(amount.compare(productionPerSecond(result, catalog), '0')).toBe(1);
    expect(result.statistics.clicks).toBe(23400);
  });
});

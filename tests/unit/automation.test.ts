import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { settleOffline } from '@core/offline/settle-offline';
import { createTimeSimulation } from '@core/automation/advance-game';
import { createUpgradePlanner, snapshotRates } from '@core/automation/upgrade-planner';
import { createLoadoutOptimizer, permanentIncome } from '@core/automation/loadout';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { amount } from '@shared/amount';
import { gameFixture } from '../helpers/game-fixture';
import { selectAutoInvestment } from '@core/automation/investment';

describe('Always-on automatic income', () => {
  it('clicks at 100 ms, carries partial time through a save and allows extra manual clicks', async () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    expect(state.automation.upgradeEnabled).toBe(false);
    clock.advance(99);
    engine.tick();
    expect(engine.getSnapshot().wallet.coin).toBe('0');
    const saved = await decodeSave(
      await createSave(engine.getSnapshot(), catalog, clock.nowUtc()),
      catalog,
    );
    const reload = createEngine(saved.payload, catalog, clock);
    clock.advance(1);
    reload.tick();
    expect(reload.getSnapshot().wallet.coin).toBe('1');
    expect(reload.getSnapshot().automation.clickRemainderMs).toBe(0);
    reload.dispatch({ type: 'ClickCoin' });
    clock.advance(900);
    reload.tick();
    expect(reload.getSnapshot().wallet.coin).toBe('11');
    expect(reload.getSnapshot().statistics.clicks).toBe(11);
    expect(reload.getSnapshot().automation.automaticClicks).toBe(10);
  });

  it('expires a click boost before the click at the exact expiry boundary', () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['booster.power-tap'] = 1;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.power-tap' });
    clock.advance(30000);
    engine.tick();
    // 299 boosted clicks, followed by one normal click at 30 seconds.
    expect(engine.getSnapshot().wallet.coin).toBe('898');
    expect(engine.getSnapshot().automation.automaticClicks).toBe(300);
    expect(engine.getSnapshot().effects).toEqual([]);
  });

  it('collects every Gold without a booster while leaving Rainbow manual', () => {
    const { state, catalog, clock } = gameFixture();
    state.events.nextRainAt = 1000;
    state.events.rainbowUnlocked = true;
    state.events.nextRainbowAt = 5000;
    const engine = createEngine(state, catalog, clock);
    clock.advance(10000);
    engine.tick();
    expect(engine.getSnapshot().wallet.goldCoin).toBe('10');
    expect(engine.getSnapshot().events.objects.some((x) => x.kind === 'rainbow')).toBe(true);
    expect(engine.getSnapshot().effects).toEqual([]);
    engine.tick();
    expect(engine.getSnapshot().wallet.goldCoin).toBe('10');
    expect(engine.getSnapshot().inventory).toEqual({});
  });
});

describe('Coin-only investment policy', () => {
  it('buys an affordable machine instead of silently waiting for a more expensive upgrade', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '15';
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'SetAutoUpgrade', enabled: true });
    clock.advance(100);
    expect(engine.tick().ok).toBe(true);
    expect(engine.getSnapshot().generators['generator.hand-press']).toBe(1);
    expect(engine.getSnapshot().statistics.totalSpentCoin).toBe('15');
  });

  it('ranks affordable improvements by payback and gives the same pending target to the UI', () => {
    const { state, catalog } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '50';
    expect(selectAutoInvestment(state, catalog).target?.command).toEqual({
      type: 'PurchaseUpgrade',
      upgradeId: 'upgrade.polished-die',
    });
    state.wallet.coin = state.statistics.totalProducedCoin = '14';
    const plan = selectAutoInvestment(state, catalog);
    expect(plan.target?.command).toEqual({
      type: 'PurchaseGenerator',
      generatorId: 'generator.hand-press',
      quantity: 1,
    });
    expect(plan.waitMs).toBe('100');
    state.automation.upgradeEnabled = true;
    const next = createTimeSimulation(catalog).advance(state, state.effectsAtMs, 100).state;
    expect(next.generators['generator.hand-press']).toBe(1);
  });
  it('calculates waits without saturating intermediate values near the amount limit', () => {
    expect(amount.scaledDivideCeil('1e100', '1e98', '1000')).toBe('100000');
  });
  it('includes 10 clicks/s when comparing upgrades and does not grant production before purchase', () => {
    const { state, catalog } = gameFixture();
    catalog.generators = [
      { ...catalog.generators[0]!, basePrice: '100', baseCps: '1', unlockAt: '0' },
    ];
    catalog.upgrades = [
      {
        ...catalog.upgrades[0]!,
        price: '100',
        requires: [],
        effect: { target: 'click', operation: 'add', value: '1' },
      },
    ];
    state.automation.upgradeEnabled = true;
    const simulation = createTimeSimulation(catalog);
    const result = simulation.advance(state, state.effectsAtMs, 10000).state;
    expect(result.purchasedUpgradeIds).toEqual([catalog.upgrades[0]!.id]);
    expect(result.generators).toEqual({});
    expect(result.wallet.coin).toBe('0');
    expect(result.statistics.totalProducedCoin).toBe('100');
    const next = simulation.advance(result, result.effectsAtMs, 1000).state;
    expect(next.wallet.coin).toBe('20');
  });

  it('stops purchases when switched off while clicks and Gold keep running', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '100000';
    state.events.nextRainAt = 1000;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'SetAutoUpgrade', enabled: true });
    clock.advance(100);
    engine.tick();
    expect(engine.getSnapshot().automation.actions).toBeGreaterThan(0);
    engine.dispatch({ type: 'SetAutoUpgrade', enabled: false });
    const before = engine.getSnapshot();
    clock.advance(20000);
    engine.tick();
    expect(engine.getSnapshot().statistics.totalSpentCoin).toBe(before.statistics.totalSpentCoin);
    expect(engine.getSnapshot().automation.automaticClicks).toBe(
      before.automation.automaticClicks + 200,
    );
    expect(engine.getSnapshot().wallet.goldCoin).toBe('10');
  });

  it('uses exact loadout income including synergies and the third-slot unlock', () => {
    const { state, catalog } = gameFixture();
    state.generators['generator.auto-press'] = 100;
    state.statistics.totalProducedCoin = catalog.unlocks.thirdCardSlotAt;
    for (const card of catalog.cards)
      state.cards.owned[card.id] = { level: 5, duplicates: 0, convertedGold: '0' };
    for (const offline of [false, true]) {
      const result = createLoadoutOptimizer(catalog)(state, offline);
      expect(result.equipped).toHaveLength(3);
      const ids = Object.keys(state.cards.owned);
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++)
          for (let k = j + 1; k < ids.length; k++) {
            const candidate = {
              ...state,
              cards: { ...state.cards, equipped: [ids[i]!, ids[j]!, ids[k]!] },
            };
            expect(
              amount.compare(permanentIncome(candidate, catalog, offline), result.income),
            ).toBeLessThanOrEqual(0);
          }
    }
  });

  it('equips owned cards while preserving their levels, duplicates, Gold and inventory', () => {
    const { state, catalog } = gameFixture();
    catalog.generators = [];
    catalog.upgrades = [];
    state.wallet.coin = state.statistics.totalProducedCoin = '100000';
    state.wallet.goldCoin = '123';
    state.inventory = { 'key.star': 2, 'chest.gold': 1, 'booster.power-tap': 3 };
    state.cards.owned['card.steady-hand'] = { level: 1, duplicates: 1, convertedGold: '0' };
    state.automation.upgradeEnabled = true;
    const result = createUpgradePlanner(catalog, false).run(state, state.effectsAtMs).state;
    expect(result.cards.owned).toEqual(state.cards.owned);
    expect(result.cards.equipped).toEqual(['card.steady-hand']);
    expect(result.wallet.goldCoin).toBe('123');
    expect(result.inventory).toEqual(state.inventory);
    expect(result.chests).toEqual(state.chests);
    expect(result.daily).toEqual(state.daily);
    expect(result.achievements.claimedIds).toEqual([]);
  });

  it('produces identical economy and event RNG regardless of callback grouping', () => {
    const { state, catalog } = gameFixture();
    state.automation.upgradeEnabled = true;
    const start = state.effectsAtMs;
    const large = createTimeSimulation(catalog).advance(state, start, 600000).state;
    const simulation = createTimeSimulation(catalog);
    let small = state;
    for (let offset = 0; offset < 600000; offset += 1000)
      small = simulation.advance(small, start + offset, 1000).state;
    expect(small.wallet).toEqual(large.wallet);
    expect(small.statistics).toEqual(large.statistics);
    expect(small.generators).toEqual(large.generators);
    expect(small.automation).toEqual(large.automation);
    expect(small.events).toEqual(large.events);
  });
});

describe('24-hour offline automation', () => {
  it('caps a 48-hour absence at 24 hours, preserves reserved resources and settles only once', async () => {
    const { state, catalog, clock } = gameFixture();
    state.automation.upgradeEnabled = true;
    state.wallet.goldCoin = '100';
    state.inventory = { 'chest.silver': 3, 'key.star': 2, 'booster.time-warp': 1 };
    const baseline = snapshotRates(state, catalog);
    clock.advance(86400000);
    const day = settleOffline(baseline, catalog, clock.nowUtc());
    clock.advance(86400000);
    const capped = settleOffline(baseline, catalog, clock.nowUtc());
    expect(capped.summary.seconds).toBe(86400);
    expect(capped.summary.capped).toBe(true);
    expect(capped.state.wallet).toEqual(day.state.wallet);
    expect(capped.state.statistics).toEqual(day.state.statistics);
    expect(capped.state.generators).toEqual(day.state.generators);
    expect(capped.state.inventory).toEqual(state.inventory);
    expect(capped.state.chests).toEqual(state.chests);
    expect(capped.state.daily.claimCount).toBe(0);
    expect(capped.state.achievements.claimedIds).toEqual([]);
    expect(capped.state.automation.automaticClicks).toBe(864000);
    expect(capped.summary.upgrades).toBeGreaterThan(0);
    expect(amount.compare(capped.state.wallet.goldCoin, '100')).toBe(1);
    expect(amount.add(capped.state.wallet.coin, capped.state.statistics.totalSpentCoin)).toBe(
      capped.state.statistics.totalProducedCoin,
    );
    const saved = await decodeSave(
      await createSave(capped.state, catalog, clock.nowUtc()),
      catalog,
    );
    expect(settleOffline(saved.payload, catalog, clock.nowUtc()).summary.coin).toBe('0');
    clock.advance(-1000);
    expect(settleOffline(saved.payload, catalog, clock.nowUtc()).summary.clockRollback).toBe(true);
  }, 20000);
});

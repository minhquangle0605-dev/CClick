import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import {
  cardBonuses,
  cardSlots,
  eventCatalog,
  offlineEfficiency,
  activeSynergies,
} from '@core/cards/selectors';
import { previewCardUpgrade } from '@core/cards/commands';
import { productionPerSecond, clickPower } from '@core/economy/selectors';
import { grantRewards } from '@core/rewards/grant-rewards';
import { drawLoot, lootOdds, selectLoot } from '@core/chests/loot';
import { settleOffline } from '@core/offline/settle-offline';
import { amount } from '@shared/amount';
import { gameFixture } from '../helpers/game-fixture';

const owned = (level = 1, duplicates = 0) => ({ level, duplicates, convertedGold: '0' });

describe('Equipped cards and permanent/event benefits', () => {
  it('uses equipped cards only, activates a pair, and removes its bonus on unequip', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    state.cards.owned = { 'card.mint-gear': owned(2), 'card.clockwork': owned(3) };
    expect(productionPerSecond(state, catalog)).toBe('1');
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'EquipCard', cardId: 'card.mint-gear' }).ok).toBe(true);
    expect(engine.dispatch({ type: 'EquipCard', cardId: 'card.clockwork' }).ok).toBe(true);
    expect(productionPerSecond(engine.getSnapshot(), catalog)).toBe('1.57');
    expect(activeSynergies(engine.getSnapshot(), catalog).map((x) => x.id)).toEqual([
      'synergy.workshop',
    ]);
    expect(engine.getSnapshot().offlineCps).toBe('1.57');
    engine.dispatch({ type: 'UnequipCard', cardId: 'card.mint-gear' });
    expect(productionPerSecond(engine.getSnapshot(), catalog)).toBe('1.24');
    expect(engine.getSnapshot().cards.owned).toEqual(state.cards.owned);
  });
  it('rejects unowned, repeated and excess equipment, then unlocks a third slot', () => {
    const { state, catalog, clock } = gameFixture();
    const ids = ['card.silver-touch', 'card.steady-hand', 'card.star-forge'];
    for (const id of ids) state.cards.owned[id] = owned();
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'EquipCard', cardId: 'card.mint-gear' })).toEqual({
      ok: false,
      error: 'card-not-owned',
    });
    engine.dispatch({ type: 'EquipCard', cardId: ids[0]! });
    expect(engine.dispatch({ type: 'EquipCard', cardId: ids[0]! })).toEqual({
      ok: false,
      error: 'already-owned',
    });
    engine.dispatch({ type: 'EquipCard', cardId: ids[1]! });
    expect(clickPower(engine.getSnapshot(), catalog)).toBe('2.1');
    expect(engine.dispatch({ type: 'EquipCard', cardId: ids[2]! })).toEqual({
      ok: false,
      error: 'slots-full',
    });
    const next = structuredClone(engine.getSnapshot());
    next.statistics.totalProducedCoin = next.wallet.coin = catalog.unlocks.thirdCardSlotAt;
    engine.replaceState(next);
    expect(cardSlots(engine.getSnapshot(), catalog)).toBe(3);
    expect(engine.dispatch({ type: 'EquipCard', cardId: ids[2]! }).ok).toBe(true);
    expect(clickPower(engine.getSnapshot(), catalog)).toBe('2.26');
  });
  it('previews and charges Coin/copies exactly once, with no partial upgrade on shortage', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '199';
    state.cards.owned['card.clockwork'] = owned(1, 1);
    const engine = createEngine(state, catalog, clock);
    expect(previewCardUpgrade(state, catalog, 'card.clockwork')).toMatchObject({
      coin: '200',
      duplicates: 1,
      error: 'insufficient-funds',
    });
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.clockwork' }).ok).toBe(false);
    expect(engine.getSnapshot().cards).toEqual(state.cards);
    engine.dispatch({ type: 'ClickCoin' });
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.clockwork' }).ok).toBe(true);
    expect(engine.getSnapshot().wallet.coin).toBe('0');
    expect(engine.getSnapshot().statistics.totalSpentCoin).toBe('200');
    expect(engine.getSnapshot().cards.owned['card.clockwork']).toEqual(owned(2, 0));
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.clockwork' })).toEqual({
      ok: false,
      error: 'missing-duplicates',
    });
  });
  it('converts leftover copies at level ten and all subsequent copies to rarity Gold', () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000000000';
    state.cards.owned['card.prism-heart'] = owned(9, 14);
    const engine = createEngine(state, catalog, clock);
    expect(previewCardUpgrade(state, catalog, 'card.prism-heart').convertedGold).toBe('12');
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.prism-heart' }).ok).toBe(true);
    const granted = grantRewards(engine.getSnapshot(), catalog, [
      { kind: 'card', cardId: 'card.prism-heart', quantity: 2 },
    ]);
    expect(granted.state.wallet.goldCoin).toBe('24');
    expect(granted.state.cards.owned['card.prism-heart']).toEqual({
      level: 10,
      duplicates: 0,
      convertedGold: '24',
    });
    expect(granted.applied).toHaveLength(2);
    expect(granted.applied[0]).toMatchObject({
      kind: 'currency',
      amount: '6',
      sourceCardId: 'card.prism-heart',
      note: 'converted',
    });
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.prism-heart' })).toEqual({
      ok: false,
      error: 'max-level',
    });
  });
  it('uses saved card CPS/efficiency for offline and permanent card CPS for Time Warp', () => {
    const { state, catalog, clock } = gameFixture();
    state.generators['generator.auto-press'] = 1;
    state.cards.owned = { 'card.dusk-battery': owned(5), 'card.mint-gear': owned() };
    state.inventory['booster.time-warp'] = 1;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'EquipCard', cardId: 'card.dusk-battery' });
    engine.dispatch({ type: 'EquipCard', cardId: 'card.mint-gear' });
    expect(offlineEfficiency(engine.getSnapshot(), catalog)).toBe('0.6');
    clock.advance(60000);
    const changed = structuredClone(catalog);
    changed.balance.offlineEfficiency = '0.2';
    expect(settleOffline(engine.getSnapshot(), changed, clock.nowUtc()).summary.coin).toBe(
      '397.44',
    );
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.time-warp' });
    expect(engine.getSnapshot().wallet.coin).toBe('4406.4'); // 62.4 production + 600 auto clicks + 3744 warp
  });
  it('applies the Rainbow/Frenzy pair to future activations without rewriting existing timers', () => {
    const { state, catalog, clock } = gameFixture();
    state.cards.owned = { 'card.rainbow-finder': owned(10), 'card.frenzy-core': owned(10) };
    state.events.rainbowUnlocked = true;
    state.events.nextRainbowAt = 800000;
    state.events.objects = [
      { id: 'rainbow-test', kind: 'rainbow', x: 50, lane: 2, spawnsAt: 0, expiresAt: 8000 },
    ];
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'EquipCard', cardId: 'card.rainbow-finder' });
    engine.dispatch({ type: 'EquipCard', cardId: 'card.frenzy-core' });
    const rules = eventCatalog(engine.getSnapshot(), catalog).events.rainbow;
    expect(rules).toMatchObject({
      waitMinSeconds: 480,
      waitMaxSeconds: 720,
      frenzySeconds: 35,
      maxFrenzySeconds: 55,
    });
    expect(engine.getSnapshot().events.nextRainbowAt).toBe(800000);
    engine.dispatch({ type: 'CollectEvent', objectId: 'rainbow-test' });
    expect(engine.getSnapshot().effects[0]!.expiresAt - state.effectsAtMs).toBe(35000);
    engine.dispatch({ type: 'UnequipCard', cardId: 'card.frenzy-core' });
    expect(engine.getSnapshot().effects[0]!.expiresAt - state.effectsAtMs).toBe(35000);
  });
  it('applies the rain pair to Gold including Magnet, but leaves chest Gold unmultiplied', () => {
    const { state, catalog, clock } = gameFixture();
    state.cards.owned = { 'card.gold-chip': owned(2), 'card.rain-cloud': owned(2) };
    state.cards.equipped = Object.keys(state.cards.owned);
    expect(cardBonuses(state, catalog).goldFlat).toBe('3');
    state.events.nextRainAt = 1000;
    state.inventory['booster.golden-magnet'] = 1;
    const engine = createEngine(state, catalog, clock);
    engine.dispatch({ type: 'UseBooster', itemId: 'booster.golden-magnet' });
    clock.advance(1000);
    engine.tick();
    expect(engine.getSnapshot().wallet.goldCoin).toBe('4');
    expect(
      grantRewards(engine.getSnapshot(), catalog, [
        { kind: 'currency', currency: 'goldCoin', amount: '3' },
      ]).state.wallet.goldCoin,
    ).toBe('7');
  });
  it('keeps all card-modified rain timestamps integral and retains live objects on equipment changes', () => {
    const { state, catalog, clock } = gameFixture();
    for (let level = 1; level <= 10; level++) {
      state.cards.owned = { 'card.rain-lens': owned(level), 'card.rain-cloud': owned(level) };
      state.cards.equipped = Object.keys(state.cards.owned);
      state.events.nextRainAt = 1;
      const engine = createEngine(state, catalog, clock);
      clock.advance(1);
      engine.tick();
      const objects = engine.getSnapshot().events.objects;
      expect(objects.every((item) => Number.isSafeInteger(item.expiresAt))).toBe(true);
      engine.dispatch({ type: 'UnequipCard', cardId: 'card.rain-cloud' });
      expect(engine.getSnapshot().events.objects).toEqual(objects);
    }
  });
});

describe('Chest rewards and weighted loot', () => {
  it('grants the starter chest only at the production milestone and only once', () => {
    const { state, catalog, clock } = gameFixture();
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'ClaimStarterChest' })).toEqual({ ok: false, error: 'locked' });
    const next = grantRewards(state, catalog, [
      { kind: 'currency', currency: 'coin', amount: '1000' },
    ]).state;
    engine.replaceState(next);
    expect(engine.dispatch({ type: 'ClaimStarterChest' }).ok).toBe(false);
    next.statistics.totalProducedCoin = '1000';
    next.statistics.totalGiftCoin = '0';
    engine.replaceState(next);
    expect(engine.dispatch({ type: 'ClaimStarterChest' }).ok).toBe(true);
    expect(engine.dispatch({ type: 'ClaimStarterChest' })).toEqual({
      ok: false,
      error: 'already-owned',
    });
    expect(engine.getSnapshot().inventory['chest.silver']).toBe(1);
  });
  it('consumes a gold chest/key together, gives two card draws and locks opening until acknowledgement', () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['chest.gold'] = 2;
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.gold' })).toEqual({
      ok: false,
      error: 'missing-key',
    });
    expect(engine.getSnapshot()).toEqual(state);
    state.inventory['key.star'] = 2;
    engine.replaceState(state);
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.gold' }).ok).toBe(true);
    const snapshot = engine.getSnapshot();
    expect(snapshot.inventory['chest.gold']).toBe(1);
    expect(snapshot.inventory['key.star']).toBe(1);
    expect(snapshot.statistics).toMatchObject({ totalGiftCoin: '5000', totalProducedCoin: '0' });
    expect(snapshot.chests.lastResult!.rewards.filter((item) => item.kind === 'card')).toHaveLength(
      2,
    );
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.gold' })).toEqual({
      ok: false,
      error: 'unread-result',
    });
    expect(engine.dispatch({ type: 'AcknowledgeChest', receiptId: 99 })).toEqual({
      ok: false,
      error: 'stale-result',
    });
    engine.dispatch({ type: 'AcknowledgeChest', receiptId: 1 });
    expect(engine.getSnapshot().chests.lastResult).toEqual(snapshot.chests.lastResult);
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.gold' }).ok).toBe(true);
    expect(engine.getSnapshot().chests.opened).toBe(2);
  });
  it('rolls back the whole command and RNG when a reward overflows', () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['chest.silver'] = 1;
    state.wallet.coin = state.statistics.totalProducedCoin = '1e100';
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.silver' })).toEqual({
      ok: false,
      error: 'numeric-limit',
    });
    expect(engine.getSnapshot()).toEqual(state);
  });
  it('turns a repeated card into a copy without activating it', () => {
    const { state, catalog } = gameFixture();
    const result = grantRewards(state, catalog, [
      { kind: 'card', cardId: 'card.silver-touch', quantity: 3 },
    ]);
    expect(result.state.cards.owned['card.silver-touch']).toEqual(owned(1, 2));
    expect(result.applied.map((item) => item.note)).toEqual(['new', 'duplicate', 'duplicate']);
    expect(clickPower(result.state, catalog)).toBe('1');
    expect(state.cards.owned).toEqual({});
  });
  it('uses the exact displayed weights for every integer roll boundary', () => {
    const { catalog } = gameFixture();
    for (const table of catalog.lootTables) {
      let offset = 0;
      expect(lootOdds(table).reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 12);
      for (const entry of table.entries) {
        expect(selectLoot(table, offset)).toEqual(entry.reward);
        expect(selectLoot(table, offset + entry.weight - 1)).toEqual(entry.reward);
        offset += entry.weight;
      }
      expect(() => selectLoot(table, -1)).toThrow();
      expect(() => selectLoot(table, offset)).toThrow();
    }
  });
  it('matches each loot distribution with fixed seeds and a predeclared max(6 sigma, 1 percent) tolerance', () => {
    const { catalog } = gameFixture();
    const trials = 20000;
    for (const table of catalog.lootTables) {
      let seed = 0x12345678;
      const counts = new Map<string, number>();
      for (let i = 0; i < trials; i++) {
        const result = drawLoot(table, seed);
        seed = result.seed;
        const key = JSON.stringify(result.reward);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      for (const entry of lootOdds(table)) {
        const expected = trials * entry.probability;
        const tolerance = Math.max(
          6 * Math.sqrt(trials * entry.probability * (1 - entry.probability)),
          trials * 0.01,
        );
        expect(Math.abs((counts.get(JSON.stringify(entry.reward)) ?? 0) - expected)).toBeLessThan(
          tolerance,
        );
      }
    }
  });
  it('cannot fund its next purchase with direct Gold cashback even when every card is max level', () => {
    const { catalog } = gameFixture();
    function cashback(reward: ReturnType<typeof selectLoot>) {
      if (reward.kind === 'currency')
        return reward.currency === 'goldCoin' ? Number(reward.amount) : 0;
      if (reward.kind === 'item') return 0;
      return (
        Number(
          catalog.cardProgression.maxDuplicateGold[
            catalog.cards.find((card) => card.id === reward.cardId)!.rarity
          ],
        ) * reward.quantity
      );
    }
    for (const chest of catalog.chests) {
      const cost =
        Number(catalog.itemOffers.find((offer) => offer.itemId === chest.id)!.goldPrice) +
        (chest.keyId
          ? Number(catalog.itemOffers.find((offer) => offer.itemId === chest.keyId)!.goldPrice)
          : 0);
      const maximum =
        chest.guaranteed.reduce((sum, reward) => sum + cashback(reward), 0) +
        chest.draws.reduce(
          (sum, draw) =>
            sum +
            draw.count *
              Math.max(
                ...catalog.lootTables
                  .find((table) => table.id === draw.tableId)!
                  .entries.map((entry) => cashback(entry.reward)),
              ),
          0,
        );
      expect(maximum).toBeLessThan(cost);
    }
  });
  it('compares a valid ledger whose summed sides exceed the per-field amount cap', () => {
    expect(amount.sumsEqual(['1e100', '1e100'], ['1e100', '1e100', '0'])).toBe(true);
    expect(amount.sumsEqual(['1e100', '1'], ['1e100', '0'])).toBe(false);
  });
});

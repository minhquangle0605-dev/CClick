import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@core/engine/create-engine';
import { grantRewards } from '@core/rewards/grant-rewards';
import { itemTotals, createItemHistory } from '@core/statistics/item-history';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { gameFixture } from '../helpers/game-fixture';
import { settleOffline } from '@core/offline/settle-offline';

describe('Lifetime item accounting', () => {
  it('keeps earned/spent item history unchanged through offline auto purchases', () => {
    const { state, catalog, clock } = gameFixture();
    const stocked = grantRewards(
      state,
      catalog,
      [{ kind: 'item', itemId: 'key.star', quantity: 3 }],
      'daily',
    ).state;
    stocked.automation.upgradeEnabled = true;
    clock.advance(600000);
    expect(settleOffline(stocked, catalog, clock.nowUtc()).state.itemHistory).toEqual(
      stocked.itemHistory,
    );
  });
  it.each(['shop', 'chest', 'daily', 'achievement', 'starter'] as const)(
    'records actual received items by source %s',
    (source) => {
      const { state, catalog } = gameFixture();
      const next = grantRewards(
        state,
        catalog,
        [{ kind: 'item', itemId: 'key.star', quantity: 2 }],
        'chest',
        source,
      ).state;
      expect(itemTotals(next, 'key.star')).toMatchObject({
        earnedTotal: 2,
        spentTotal: 0,
        remaining: 2,
        earned: { [source]: 2 },
      });
      expect(state.itemHistory.entries).toEqual({});
    },
  );
  it.each([
    'booster.turbo-mint',
    'booster.power-tap',
    'booster.golden-magnet',
    'booster.time-warp',
  ])('counts %s purchase and activation once; rejected reuse changes nothing', async (id) => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.goldCoin = '1000';
    state.generators['generator.auto-press'] = 1;
    const engine = createEngine(state, catalog, clock);
    const offer = catalog.itemOffers.find((item) => item.itemId === id)!;
    expect(engine.dispatch({ type: 'PurchaseItem', offerId: offer.id }).ok).toBe(true);
    expect(engine.dispatch({ type: 'UseBooster', itemId: id }).ok).toBe(true);
    expect(itemTotals(engine.getSnapshot(), id)).toMatchObject({
      earnedTotal: 1,
      spentTotal: 1,
      remaining: 0,
      earned: { shop: 1 },
      spent: { activated: 1 },
    });
    const before = engine.getSnapshot().itemHistory;
    expect(engine.dispatch({ type: 'UseBooster', itemId: id }).ok).toBe(false);
    expect(engine.getSnapshot().itemHistory).toBe(before);
    const reloaded = await decodeSave(
      await createSave(engine.getSnapshot(), catalog, clock.nowUtc()),
      catalog,
    );
    expect(reloaded.payload.itemHistory).toEqual(before);
  });
  it('counts the starter gift, each opened chest and its key without replaying an unread receipt', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000';
    const engine = createEngine(state, catalog, clock);
    expect(engine.dispatch({ type: 'ClaimStarterChest' }).ok).toBe(true);
    expect(engine.dispatch({ type: 'ClaimStarterChest' }).ok).toBe(false);
    expect(itemTotals(engine.getSnapshot(), 'chest.silver')).toMatchObject({
      earnedTotal: 1,
      earned: { starter: 1 },
    });
    const endowed = grantRewards(
      engine.getSnapshot(),
      catalog,
      [
        { kind: 'item', itemId: 'chest.gold', quantity: 1 },
        { kind: 'item', itemId: 'key.star', quantity: 1 },
      ],
      'achievement',
    ).state;
    engine.replaceState(endowed);
    expect(engine.dispatch({ type: 'OpenChest', chestId: 'chest.gold' }).ok).toBe(true);
    expect(itemTotals(engine.getSnapshot(), 'chest.gold').spent).toEqual({ opened: 1 });
    expect(itemTotals(engine.getSnapshot(), 'key.star').spent).toEqual({ key: 1 });
    const saved = await decodeSave(
      await createSave(engine.getSnapshot(), catalog, clock.nowUtc()),
      catalog,
    );
    const reload = createEngine(saved.payload, catalog, clock);
    expect(reload.dispatch({ type: 'OpenChest', chestId: 'chest.gold' })).toMatchObject({
      ok: false,
      error: 'unread-result',
    });
    expect(reload.getSnapshot().itemHistory).toEqual(saved.payload.itemHistory);
  });
  it('tracks card copies separately from upgrades and conversions; equipment consumes none', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000000000';
    const granted = grantRewards(state, catalog, [
      { kind: 'card', cardId: 'card.prism-heart', quantity: 15 },
    ]).state;
    // Fixture represents a card at level 9; only the last upgrade is exercised here.
    granted.cards.owned['card.prism-heart']!.level = 9;
    const engine = createEngine(granted, catalog, clock);
    engine.dispatch({ type: 'EquipCard', cardId: 'card.prism-heart' });
    expect(engine.dispatch({ type: 'UpgradeCard', cardId: 'card.prism-heart' }).ok).toBe(true);
    expect(itemTotals(engine.getSnapshot(), 'card.prism-heart')).toMatchObject({
      earnedTotal: 15,
      spentTotal: 14,
      remaining: 1,
      spent: { upgrade: 12, converted: 2 },
    });
    const more = grantRewards(engine.getSnapshot(), catalog, [
      { kind: 'card', cardId: 'card.prism-heart', quantity: 2 },
    ]).state;
    expect(itemTotals(more, 'card.prism-heart')).toMatchObject({
      earnedTotal: 17,
      spentTotal: 16,
      remaining: 1,
      spent: { upgrade: 12, converted: 4 },
    });
    expect(
      (await decodeSave(await createSave(more, catalog, clock.nowUtc()), catalog)).payload
        .itemHistory,
    ).toEqual(more.itemHistory);
  });
  it.each([1, 2, 3, 4, 5, 6])(
    'migrates schema %i with unknown previous history, unchanged holdings, and no invented totals',
    async (version) => {
      const { catalog } = gameFixture();
      const raw = JSON.parse(
        readFileSync(new URL(`../fixtures/saves/v${version}.json`, import.meta.url), 'utf8'),
      );
      const save = await decodeSave(raw, catalog);
      expect(save.schemaVersion).toBe(7);
      expect(save.payload.itemHistory.complete).toBe(false);
      expect(save.payload.wallet).toEqual(raw.payload.wallet);
      expect(save.payload.inventory).toEqual(raw.payload.inventory ?? {});
      for (const entry of Object.values(save.payload.itemHistory.entries)) {
        expect(entry.earned).toEqual({});
        expect(entry.spent).toEqual({});
      }
      expect(await decodeSave(save, catalog)).toEqual(save);
    },
  );
  it.each(['negative', 'unknown', 'imbalance', 'usage', 'overflow'] as const)(
    'rejects %s item history with a valid checksum',
    async (kind) => {
      const { state, catalog, clock } = gameFixture();
      state.inventory['key.star'] = 2;
      state.itemHistory = createItemHistory(clock.nowUtc(), state);
      const entry = state.itemHistory.entries['key.star']!;
      if (kind === 'negative') entry.opening = -1;
      if (kind === 'unknown') state.itemHistory.entries['unknown.item'] = entry;
      if (kind === 'imbalance') entry.spent.key = 1;
      if (kind === 'usage') entry.spent.opened = 0;
      if (kind === 'overflow') {
        entry.opening = Number.MAX_SAFE_INTEGER;
        entry.earned.chest = 1;
      }
      await expect(
        decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
      ).rejects.toMatchObject({ code: 'invalid' });
    },
  );
});

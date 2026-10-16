import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gameFixture } from '../helpers/game-fixture';
import { createEngine } from '@core/engine/create-engine';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { productionPerSecond } from '@core/economy/selectors';
import { settleOffline } from '@core/offline/settle-offline';
import { auditEconomy } from '../../scripts/simulation/audit';
import { simulate } from '../../scripts/simulation/simulate';
import { profiles } from '../../scripts/simulation/profiles';

describe('Final content, migration and reproducible balance checks', () => {
  it('preserves the entire v5 claim/inventory history and its saved offline rate across the catalog update', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v5.json', import.meta.url), 'utf8'),
    );
    const migrated = await decodeSave(raw, catalog);
    expect(migrated.payload).toMatchObject(raw.payload);
    expect(migrated.contentVersion).toBe('0.7.0');
    expect(migrated.checksum).not.toBe(raw.checksum);
    expect(await decodeSave(migrated, catalog)).toEqual(migrated);
    const result = settleOffline(
      migrated.payload,
      catalog,
      new Date(Date.parse(raw.payload.lastSimulatedAtUtc) + 1000).toISOString(),
    );
    expect(result.summary.seconds).toBe(1);
  });
  it('purchases every new tier, survives fractional milliseconds, and persists full late-game ownership', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1e30';
    const engine = createEngine(state, catalog, clock);
    expect(catalog.generators).toHaveLength(12);
    expect(catalog.upgrades).toHaveLength(30);
    for (const item of catalog.generators)
      expect(
        engine.dispatch({ type: 'PurchaseGenerator', generatorId: item.id, quantity: 3 }).ok,
      ).toBe(true);
    for (const item of catalog.upgrades)
      expect(engine.dispatch({ type: 'PurchaseUpgrade', upgradeId: item.id }).ok).toBe(true);
    for (const ms of [1, 17, 83, 101, 999]) {
      clock.advance(ms);
      expect(engine.tick().ok).toBe(true);
    }
    const save = await createSave(engine.getSnapshot(), catalog, clock.nowUtc());
    expect((await decodeSave(save, catalog)).payload).toEqual(engine.getSnapshot());
    expect(productionPerSecond(save.payload, catalog)).not.toBe('0');
  });
  it('bounds max-card Gold cashback and rejects a self-funding chest or recursive reward', () => {
    const { catalog } = gameFixture();
    expect(auditEconomy(catalog).chests).toHaveLength(2);
    const cheap = structuredClone(catalog);
    cheap.itemOffers.find((o) => o.itemId === 'chest.silver')!.goldPrice = '1';
    expect(() => auditEconomy(cheap)).toThrow('Self-funding');
    const recursive = structuredClone(catalog);
    recursive.chests[0]!.guaranteed.push({ kind: 'item', itemId: 'chest.silver', quantity: 1 });
    expect(() => auditEconomy(recursive)).toThrow('Recursive');
  });
  it('replays a short policy with identical seed, ledger and results', async () => {
    const { catalog } = gameFixture();
    const a = await simulate(catalog, profiles[2]!, 17, 600);
    const b = await simulate(catalog, profiles[2]!, 17, 600);
    expect(a).toEqual(b);
    expect(a.samples.at(-1)!.daily).toBe(1);
  });
});

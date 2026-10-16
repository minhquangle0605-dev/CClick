import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

describe('Durable collection and schema 4', () => {
  it('round-trips the frozen schema 4 receipt, equipped cards and independent RNG', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v4.json', import.meta.url), 'utf8'),
    );
    const save = await decodeSave(raw, catalog);
    expect(save.schemaVersion).toBe(7);
    for (const key of ['wallet', 'cards', 'chests', 'events'] as const)
      expect(save.payload[key]).toEqual(raw.payload[key]);
    expect(save.payload.chests).toMatchObject({ opened: 1, acknowledged: false });
    expect(save.payload.cards.equipped).toEqual(['card.mint-gear', 'card.clockwork']);
    expect(save.payload.offlineCps).toBe('1.57');
    expect(save.payload.statistics.totalGiftCoin).toBe('5000');
    expect(save.payload.inventory['key.star']).toBe(1);
  });
  it('publishes neither the draw nor consumption before the write finishes, and blocks overlapping actions', async () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['chest.silver'] = 2;
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const save = repository.save.bind(repository);
    vi.spyOn(repository, 'save').mockImplementation(async (envelope) => {
      await gate;
      await save(envelope);
    });
    const pending = session.commitCommand({ type: 'OpenChest', chestId: 'chest.silver' });
    try {
      expect(session.engine.getSnapshot()).toEqual(state);
      expect(
        await session.commitCommand({ type: 'EquipCard', cardId: 'card.silver-touch' }),
      ).toEqual({ ok: false, error: 'paused' });
      expect(await session.commitCommand({ type: 'OpenChest', chestId: 'chest.silver' })).toEqual({
        ok: false,
        error: 'paused',
      });
    } finally {
      release();
    }
    expect((await pending).ok).toBe(true);
    expect(session.engine.getSnapshot().chests.opened).toBe(1);
    expect(session.engine.getSnapshot().inventory['chest.silver']).toBe(1);
    expect((await decodeSave(repository.stored, catalog)).payload).toEqual(
      session.engine.getSnapshot(),
    );
    session.dispose();
  });
  it('keeps the chest, key and RNG after write failure and gets exactly the same draw on retry', async () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory = { 'chest.gold': 1, 'key.star': 1 };
    const reference = createEngine(state, catalog, clock);
    reference.dispatch({ type: 'OpenChest', chestId: 'chest.gold' });
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    repository.failWrites = true;
    expect(await session.commitCommand({ type: 'OpenChest', chestId: 'chest.gold' })).toEqual({
      ok: false,
      error: 'save-failed',
    });
    expect(session.engine.getSnapshot()).toEqual(state);
    expect(repository.stored!.payload).toEqual(state);
    repository.failWrites = false;
    expect((await session.commitCommand({ type: 'OpenChest', chestId: 'chest.gold' })).ok).toBe(
      true,
    );
    expect(session.engine.getSnapshot()).toEqual(reference.getSnapshot());
    expect(session.dispatch({ type: 'EquipCard', cardId: 'card.silver-touch' })).toEqual({
      ok: false,
      error: 'requires-commit',
    });
    session.dispose();
  });
  it('survives 100 reopened database/engine cycles around opening, acknowledgement and the next draw', async () => {
    const { state, catalog, clock } = gameFixture();
    state.inventory['chest.silver'] = 3;
    const factory = new IDBFactory();
    let repository = await openSaveRepository(catalog, factory);
    await repository.save(await createSave(state, catalog, clock.nowUtc()));
    let expected = structuredClone(state);
    for (let cycle = 0; cycle < 100; cycle++) {
      repository.close();
      repository = await openSaveRepository(catalog, factory);
      const saved = (await repository.load())!;
      expect(saved.payload).toEqual(expected);
      const session = createGameSession(
        createEngine(saved.payload, catalog, clock),
        catalog,
        repository,
        clock,
      );
      if (cycle === 20 || cycle === 80) {
        expect(
          (await session.commitCommand({ type: 'OpenChest', chestId: 'chest.silver' })).ok,
        ).toBe(true);
        expected = structuredClone(session.engine.getSnapshot());
      } else if (cycle === 60) {
        expect((await session.commitCommand({ type: 'AcknowledgeChest', receiptId: 1 })).ok).toBe(
          true,
        );
        expected = structuredClone(session.engine.getSnapshot());
      } else if (!expected.chests.acknowledged) {
        expect(await session.commitCommand({ type: 'OpenChest', chestId: 'chest.silver' })).toEqual(
          { ok: false, error: 'unread-result' },
        );
        expect(session.engine.getSnapshot()).toEqual(expected);
      }
      session.dispose();
    }
    expect(expected.chests.opened).toBe(2);
    expect(expected.inventory['chest.silver']).toBe(1);
    expect(expected.statistics.totalGiftCoin).toBe('1000');
    repository.close();
  }, 15000);
  it('does not lose a card or spend Coin when upgrading cannot be saved', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '100';
    state.cards.owned['card.silver-touch'] = { level: 1, duplicates: 1, convertedGold: '0' };
    const repository = new MemorySaveRepository();
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    repository.failWrites = true;
    expect(
      await session.commitCommand({ type: 'UpgradeCard', cardId: 'card.silver-touch' }),
    ).toEqual({ ok: false, error: 'save-failed' });
    expect(session.engine.getSnapshot()).toEqual(state);
    repository.failWrites = false;
    expect(
      (await session.commitCommand({ type: 'UpgradeCard', cardId: 'card.silver-touch' })).ok,
    ).toBe(true);
    expect(repository.stored!.payload.cards.owned['card.silver-touch']!.level).toBe(2);
    expect(repository.stored!.payload.wallet.coin).toBe('0');
    session.dispose();
  });
  it.each([1, 2, 3])(
    'migrates frozen schema %i without changing earned progression or granting collection rewards',
    async (version) => {
      const { catalog } = gameFixture();
      const raw = JSON.parse(
        readFileSync(new URL(`../fixtures/saves/v${version}.json`, import.meta.url), 'utf8'),
      );
      const loaded = await decodeSave(raw, catalog);
      expect(loaded.schemaVersion).toBe(7);
      expect(loaded.payload.wallet).toEqual(raw.payload.wallet);
      expect(loaded.payload.statistics).toEqual({ ...raw.payload.statistics, totalGiftCoin: '0' });
      expect(loaded.payload.cards).toEqual({ owned: {}, equipped: [] });
      expect(loaded.payload.chests).toMatchObject({
        opened: 0,
        starterClaimed: false,
        lastResult: null,
        acknowledged: true,
      });
      expect(loaded.payload.offlineEfficiency).toBe('0.5');
      expect(await decodeSave(loaded, catalog)).toEqual(loaded);
    },
  );
  it.each([
    'unowned',
    'repeated',
    'locked-slot',
    'unknown-card',
    'max-copies',
    'receipt',
    'rng',
    'offline',
  ] as const)('rejects invalid %s with a valid checksum', async (kind) => {
    const { state, catalog, clock } = gameFixture();
    if (kind === 'unowned') state.cards.equipped = ['card.silver-touch'];
    if (kind === 'repeated') {
      state.cards.owned['card.silver-touch'] = { level: 1, duplicates: 0, convertedGold: '0' };
      state.cards.equipped = ['card.silver-touch', 'card.silver-touch'];
    }
    if (kind === 'locked-slot') {
      for (const id of ['card.silver-touch', 'card.mint-gear', 'card.steady-hand'])
        state.cards.owned[id] = { level: 1, duplicates: 0, convertedGold: '0' };
      state.cards.equipped = Object.keys(state.cards.owned);
    }
    if (kind === 'unknown-card')
      state.cards.owned['card.unknown'] = { level: 1, duplicates: 0, convertedGold: '0' };
    if (kind === 'max-copies')
      state.cards.owned['card.silver-touch'] = { level: 10, duplicates: 1, convertedGold: '0' };
    if (kind === 'receipt') state.chests.opened = 1;
    if (kind === 'rng') state.chests.rng = 0;
    if (kind === 'offline') state.offlineEfficiency = '1.1';
    await expect(
      decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
    ).rejects.toMatchObject({ code: 'invalid' });
  });
});

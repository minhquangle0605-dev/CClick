import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBDatabase } from 'fake-indexeddb';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { gameFixture } from '../helpers/game-fixture';
import { writeRaw } from '../helpers/indexed-db';

describe('Versioned save codec', () => {
  it('round-trips large balances without conversion to Number', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '1000000000000000000000000000001.0001';
    const envelope = await createSave(state, catalog, clock.nowUtc());
    const loaded = await decodeSave(JSON.parse(JSON.stringify(envelope)), catalog);
    expect(loaded.payload).toEqual(state);
  });
  it('reads the frozen v1 fixture for future migration tests', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v1.json', import.meta.url), 'utf8'),
    );
    expect((await decodeSave(raw, catalog)).payload.wallet.coin).toBe('100');
  });
  it('rejects corrupted, newer, and mismatched content saves', async () => {
    const { state, catalog, clock } = gameFixture();
    const saved = await createSave(state, catalog, clock.nowUtc());
    await expect(decodeSave({ ...saved, checksum: '0'.repeat(64) }, catalog)).rejects.toMatchObject(
      { code: 'invalid' },
    );
    await expect(decodeSave({ ...saved, schemaVersion: 8 }, catalog)).rejects.toMatchObject({
      code: 'future-version',
    });
    await expect(decodeSave({ ...saved, contentVersion: '99.0.0' }, catalog)).rejects.toMatchObject(
      { code: 'content-version' },
    );
  });
  it.each([
    'negative',
    'unknown-generator',
    'unknown-upgrade',
    'counter-overflow',
    'balance-inconsistent',
  ])('rejects %s even with a matching checksum', async (kind) => {
    const { state, catalog, clock } = gameFixture();
    if (kind === 'negative') state.wallet.coin = '-1';
    if (kind === 'unknown-generator') state.generators['generator.missing'] = 1;
    if (kind === 'unknown-upgrade') state.purchasedUpgradeIds = ['upgrade.missing'];
    if (kind === 'counter-overflow') state.statistics.clicks = Number.MAX_SAFE_INTEGER + 1;
    if (kind === 'balance-inconsistent') state.wallet.coin = '100';
    await expect(
      decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
    ).rejects.toMatchObject({ code: 'invalid' });
  });
});

describe('IndexedDB adapter (emulated database)', () => {
  it('commits and reloads through a new repository connection', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const first = await openSaveRepository(catalog, factory);
    expect(await first.load()).toBeNull();
    const envelope = await createSave(state, catalog, clock.nowUtc());
    await first.save(envelope);
    first.close();
    const second = await openSaveRepository(catalog, factory);
    expect(await second.load()).toEqual(envelope);
    second.close();
  });
  it('does not report success or replace the previous save on an aborted transaction', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const previous = await createSave(state, catalog, clock.nowUtc());
    await repository.save(previous);
    const transaction = IDBDatabase.prototype.transaction;
    const spy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (
      this: IDBDatabase,
      ...args: Parameters<typeof transaction>
    ) {
      const tx = transaction.apply(this, args);
      if (args[1] === 'readwrite') queueMicrotask(() => tx.abort());
      return tx;
    });
    try {
      await expect(repository.save(previous)).rejects.toThrow();
    } finally {
      spy.mockRestore();
    }
    expect(await repository.load()).toEqual(previous);
    repository.close();
  });
  it('fails closed when the database contains a broken save and preserves the raw record', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const repository = await openSaveRepository(catalog, factory);
    const broken = {
      ...(await createSave(state, catalog, clock.nowUtc())),
      checksum: '0'.repeat(64),
    };
    await writeRaw(factory, 'primary', broken);
    await expect(repository.load()).rejects.toMatchObject({ code: 'invalid' });
    await expect(repository.load()).rejects.toMatchObject({ code: 'invalid' });
    repository.close();
  });
});

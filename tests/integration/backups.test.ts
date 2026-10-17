import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { readFileSync } from 'node:fs';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import {
  createSave,
  decodeSave,
  parseSaveFile,
  MAX_SAVE_BYTES,
} from '@platform/storage/save-codec';
import { gameFixture } from '../helpers/game-fixture';
import { writeRaw } from '../helpers/indexed-db';

describe('Two backups, recovery, migration and file boundary', () => {
  it('round-trips the frozen schema 3 fixture with inventory, effects, RNG and a partially collected rain', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v3.json', import.meta.url), 'utf8'),
    );
    const save = await decodeSave(raw, catalog);
    expect(save.schemaVersion).toBe(8);
    expect(save.payload.wallet).toEqual({ coin: '1006', goldCoin: '26' });
    expect(save.payload.inventory['booster.turbo-mint']).toBe(1);
    expect(save.payload.effects[0]!.expiresAt - save.payload.effectsAtMs).toBe(57000);
    expect(save.payload.events.activeMs).toBe(3000);
    expect(save.payload.events.objects).toHaveLength(9);
    expect(save.payload.events.objects.some((item) => item.id === 'rain-1-0')).toBe(false);
    const repository = await openSaveRepository(catalog, new IDBFactory());
    await repository.save(save);
    expect(await repository.load()).toEqual(save);
    repository.close();
  });
  it('reads the schema 2 fixture with fractional balance, purchases and offline CPS', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v2.json', import.meta.url), 'utf8'),
    );
    const save = await decodeSave(raw, catalog);
    expect(save.payload.wallet.coin).toBe('12345.6789');
    expect(save.payload.offlineCps).toBe('2.4');
    expect(save.payload.purchasedUpgradeIds).toHaveLength(2);
  });
  it('rotates two valid backups and recovers the newest valid one without erasing diagnostic data', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const repository = await openSaveRepository(catalog, factory);
    for (let n = 0; n < 4; n++) {
      state.revision = n;
      state.wallet.coin = state.statistics.totalProducedCoin = String(n);
      await repository.save(await createSave(state, catalog, clock.nowUtc()));
    }
    const backups = await repository.listBackups();
    expect(backups.map((b) => b.envelope.payload.wallet.coin)).toEqual(['2', '1']);
    const broken = { bad: 'interrupted or edited save' };
    await writeRaw(factory, 'primary', broken);
    expect(await repository.readDamaged()).toEqual(broken);
    const restored = await repository.load();
    expect(restored?.payload.wallet.coin).toBe('2');
    expect(repository.recoverySource).toBe('backup-1');
    await repository.save(restored!);
    expect(await repository.readDamaged()).toEqual(broken);
    expect((await repository.load())?.payload.wallet.coin).toBe('2');
    repository.close();
  });
  it('falls back to backup two if backup one is also damaged', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const repository = await openSaveRepository(catalog, factory);
    await repository.save(await createSave(state, catalog, clock.nowUtc()));
    await writeRaw(factory, 'primary', { broken: true });
    await writeRaw(factory, 'backup-1', { broken: true });
    expect((await repository.load())?.payload.wallet.coin).toBe('0');
    expect(repository.recoverySource).toBe('backup-2');
    repository.close();
  });
  it('does not downgrade a newer primary to a compatible backup', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    const repository = await openSaveRepository(catalog, factory);
    const saved = await createSave(state, catalog, clock.nowUtc());
    await repository.save(saved);
    await writeRaw(factory, 'primary', { ...saved, schemaVersion: 9 });
    await expect(repository.load()).rejects.toMatchObject({ code: 'future-version' });
    await expect(repository.save(saved)).rejects.toMatchObject({ code: 'future-version' });
    expect(await repository.readDamaged()).toEqual({ ...saved, schemaVersion: 9 });
    repository.close();
  });
  it('rejects stale revisions and keeps the committed primary', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const old = await createSave(state, catalog, clock.nowUtc());
    state.revision = 1;
    state.wallet.coin = state.statistics.totalProducedCoin = '1';
    const next = await createSave(state, catalog, clock.nowUtc());
    await repository.save(next);
    await expect(repository.save(old)).rejects.toThrow('đã thay đổi');
    expect(await repository.load()).toEqual(next);
    repository.close();
  });
  it('backs up unsaved live progress atomically when restoring an older run', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const old = await createSave(state, catalog, clock.nowUtc());
    await repository.save(old);
    state.revision = 30;
    state.wallet.coin = state.statistics.totalProducedCoin = '30';
    const live = await createSave(state, catalog, clock.nowUtc());
    await repository.save(old, live);
    expect((await repository.listBackups())[0]?.envelope.payload.wallet.coin).toBe('30');
    expect((await repository.load())?.payload.wallet.coin).toBe('0');
    repository.close();
  });
  it('migrates the frozen P1 fixture and can persist/reload it as schema 4', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v1.json', import.meta.url), 'utf8'),
    );
    const migrated = await decodeSave(raw, catalog);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.contentVersion).toBe('0.7.0');
    expect(migrated.payload.wallet.coin).toBe('100');
    expect(migrated.payload.offlineCps).toBe('0');
    expect(await decodeSave(migrated, catalog)).toEqual(migrated);
    const factory = new IDBFactory();
    await writeRaw(factory, 'primary', raw);
    const repository = await openSaveRepository(catalog, factory);
    expect(await repository.load()).toEqual(migrated);
    await repository.save(migrated);
    expect(await repository.load()).toEqual(migrated);
    repository.close();
  });
  it('rejects oversized/malformed/imported negative values without mutating storage', async () => {
    const { state, catalog, clock } = gameFixture();
    await expect(parseSaveFile(' '.repeat(MAX_SAVE_BYTES + 1), catalog)).rejects.toThrow();
    await expect(parseSaveFile('{broken', catalog)).rejects.toThrow();
    state.wallet.coin = '-1';
    const bad = await createSave(state, catalog, clock.nowUtc());
    await expect(parseSaveFile(JSON.stringify(bad), catalog)).rejects.toMatchObject({
      code: 'invalid',
    });
  });
});

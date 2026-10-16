import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBDatabase } from 'fake-indexeddb';
import { createEngine } from '@core/engine/create-engine';
import { createGameSession } from '@app/game-session';
import { createSave, decodeSave } from '@platform/storage/save-codec';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { sourceTotals } from '@core/progression/tracking';
import { dailyStatus } from '@core/daily-rewards/calendar';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';
import { writeRaw } from '../helpers/indexed-db';

describe('Durable daily and achievement claims', () => {
  it('round-trips the frozen schema 5 daily, claimed IDs and source history', async () => {
    const { catalog } = gameFixture();
    const raw = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v5.json', import.meta.url), 'utf8'),
    );
    const save = await decodeSave(raw, catalog);
    expect(save.payload).toMatchObject(raw.payload);
    expect(save.contentVersion).toBe(catalog.balance.contentVersion);
    expect(save.payload.daily.claimCount).toBe(1);
    expect(save.payload.achievements.claimedIds).toEqual(['achievement.click-1']);
    expect(save.payload.tracking.coin.click).toBe('10');
    expect(sourceTotals(save.payload).unclassifiedProduced).toBe('1000000');
  });
  it.each(['daily', 'achievement'] as const)(
    'keeps %s unclaimed on failed writes, commits on retry and survives reload',
    async (kind) => {
      const { state, catalog, clock } = gameFixture();
      state.statistics.clicks = 10;
      const repository = await openSaveRepository(catalog, new IDBFactory());
      const session = createGameSession(
        createEngine(state, catalog, clock),
        catalog,
        repository,
        clock,
      );
      await session.requestSave();
      const save = vi.spyOn(repository, 'save').mockRejectedValueOnce(new Error('quota'));
      const command =
        kind === 'daily'
          ? { type: 'ClaimDaily' as const }
          : { type: 'ClaimAchievement' as const, achievementId: 'achievement.click-1' };
      expect(await session.commitCommand(command)).toEqual({ ok: false, error: 'save-failed' });
      expect(session.engine.getSnapshot().wallet.goldCoin).toBe('0');
      expect(session.engine.getSnapshot().daily.claimCount).toBe(0);
      expect(session.engine.getSnapshot().achievements.claimedIds).toEqual([]);
      expect((await session.commitCommand(command)).ok).toBe(true);
      save.mockRestore();
      const loaded = (await repository.load())!;
      const again = createEngine(loaded.payload, catalog, clock);
      expect(again.dispatch(command)).toMatchObject({ ok: false });
      expect(again.getSnapshot().wallet.goldCoin).toBe('5');
      expect(await decodeSave(loaded, catalog)).toEqual(loaded);
      session.dispose();
      repository.close();
    },
  );
  it('locks concurrent claims while the first write is pending and publishes only after commit', async () => {
    const { state, catalog, clock } = gameFixture();
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
    const pending = session.commitCommand({ type: 'ClaimDaily' });
    try {
      expect(session.engine.getSnapshot().daily.claimCount).toBe(0);
      expect(await session.commitCommand({ type: 'ClaimDaily' })).toEqual({
        ok: false,
        error: 'paused',
      });
      await expect(session.reset('RESET', state.runId)).rejects.toThrow();
    } finally {
      release();
    }
    expect((await pending).ok).toBe(true);
    expect(session.engine.getSnapshot().daily.claimCount).toBe(1);
    session.dispose();
  });
  it.each([1, 2, 3, 4])(
    'migrates frozen schema %i with unclassified history and no automatic reward',
    async (version) => {
      const { catalog } = gameFixture();
      const raw = JSON.parse(
        readFileSync(new URL(`../fixtures/saves/v${version}.json`, import.meta.url), 'utf8'),
      );
      const save = await decodeSave(raw, catalog);
      expect(save.schemaVersion).toBe(7);
      expect(save.payload.wallet).toEqual(raw.payload.wallet);
      expect(sourceTotals(save.payload)).toEqual({
        unclassifiedProduced: raw.payload.statistics.totalProducedCoin,
        unclassifiedGift: raw.payload.statistics.totalGiftCoin ?? '0',
      });
      expect(save.payload.daily.claimCount).toBe(0);
      expect(save.payload.achievements.claimedIds).toEqual([]);
      expect(await decodeSave(save, catalog)).toEqual(save);
    },
  );
  it.each([
    'claimed-locked',
    'duplicate',
    'unknown',
    'daily',
    'highest-day',
    'source',
    'negative',
  ] as const)('rejects inconsistent %s even with a valid checksum', async (kind) => {
    const { state, catalog, clock } = gameFixture();
    if (kind === 'claimed-locked') state.achievements.claimedIds = ['achievement.click-1'];
    if (kind === 'duplicate')
      state.achievements.unlockedIds = ['achievement.click-1', 'achievement.click-1'];
    if (kind === 'unknown') state.achievements.unlockedIds = ['achievement.unknown'];
    if (kind === 'daily') state.daily.claimCount = 1;
    if (kind === 'highest-day') {
      state.daily.claimCount = 1;
      state.daily.lastClaimDay = state.daily.highestDay + 1;
    }
    if (kind === 'source') state.tracking.coin.click = '1';
    if (kind === 'negative') state.tracking.eventCoins = -1;
    await expect(
      decodeSave(await createSave(state, catalog, clock.nowUtc()), catalog),
    ).rejects.toMatchObject({ code: 'invalid' });
  });
});

describe('Reset with a pinned manual backup', () => {
  it('backs up latest unsaved progress, starts an empty run, survives reload and never auto-recovers the old run', async () => {
    const { state, catalog, clock } = gameFixture();
    const factory = new IDBFactory();
    let repository = await openSaveRepository(catalog, factory);
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    session.dispatch({ type: 'ClickCoin' });
    await session.commitCommand({ type: 'ClaimDaily' });
    session.dispatch({ type: 'ClickCoin' });
    const before = structuredClone(session.engine.getSnapshot());
    await expect(session.reset('reset', state.runId)).rejects.toThrow();
    await expect(session.reset('RESET', 'stale')).rejects.toThrow();
    await session.reset('RESET', state.runId);
    const fresh = session.engine.getSnapshot();
    expect(fresh.runId).not.toBe(state.runId);
    expect(fresh.wallet).toEqual({ coin: '0', goldCoin: '0' });
    expect(fresh.daily.claimCount).toBe(0);
    expect(dailyStatus(fresh.daily, clock.nowUtc()).available).toBe(true);
    expect((await repository.loadBackup('reset-backup')).payload).toEqual(before);
    for (let index = 0; index < 4; index++) {
      session.dispatch({ type: 'ClickCoin' });
      await session.requestSave();
    }
    expect((await repository.loadBackup('reset-backup')).payload).toEqual(before);
    const runId = fresh.runId;
    session.dispose();
    repository.close();
    repository = await openSaveRepository(catalog, factory);
    expect((await repository.load())!.payload.runId).toBe(runId);
    await writeRaw(factory, 'primary', { broken: true });
    expect((await repository.load())!.payload.runId).toBe(runId);
    await writeRaw(factory, 'backup-1', { broken: true });
    await writeRaw(factory, 'backup-2', { broken: true });
    await expect(repository.load()).rejects.toMatchObject({ code: 'invalid' });
    expect((await repository.loadBackup('reset-backup')).payload.runId).toBe(state.runId);
    repository.close();
  });
  it('can reset a capped run while preserving its last valid snapshot', async () => {
    const { state, catalog, clock } = gameFixture();
    state.revision = Number.MAX_SAFE_INTEGER;
    state.wallet.coin = state.statistics.totalProducedCoin = '1e100';
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    clock.advance(1000);
    await session.reset('RESET', state.runId);
    expect(session.engine.getSnapshot().runId).not.toBe(state.runId);
    expect(session.engine.getSnapshot().wallet.coin).toBe('0');
    expect((await repository.loadBackup('reset-backup')).payload).toEqual(state);
    expect(session.dispatch({ type: 'ClickCoin' }).ok).toBe(true);
    session.dispose();
    repository.close();
  });
  it('aborts reset atomically with the old primary, backups and live state intact', async () => {
    const { state, catalog, clock } = gameFixture();
    state.wallet.coin = state.statistics.totalProducedCoin = '500';
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.requestSave();
    const previous = await repository.load();
    const backups = await repository.listBackups();
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
      await expect(session.reset('RESET', state.runId)).rejects.toThrow();
    } finally {
      spy.mockRestore();
    }
    expect(session.engine.getSnapshot()).toEqual(state);
    expect(await repository.load()).toEqual(previous);
    expect(await repository.listBackups()).toEqual(backups);
    expect(session.dispatch({ type: 'ClickCoin' }).ok).toBe(true);
    session.dispose();
    repository.close();
  });
  it('restores the pre-reset run only after an explicit restore, including its daily claim', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = await openSaveRepository(catalog, new IDBFactory());
    const session = createGameSession(
      createEngine(state, catalog, clock),
      catalog,
      repository,
      clock,
    );
    await session.commitCommand({ type: 'ClaimDaily' });
    await session.reset('RESET', state.runId);
    const backup = await repository.loadBackup('reset-backup');
    await session.restore(backup);
    expect(session.engine.getSnapshot().runId).toBe(state.runId);
    expect(session.engine.getSnapshot().daily.claimCount).toBe(1);
    expect(await session.commitCommand({ type: 'ClaimDaily' })).toEqual({
      ok: false,
      error: 'daily-claimed',
    });
    session.dispose();
    repository.close();
  });
});

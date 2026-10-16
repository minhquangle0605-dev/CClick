import { afterEach, describe, expect, it, vi } from 'vitest';
import { bootstrapGame } from '@app/bootstrap';
import { exportRecoverableSave, readResetBackupForRecovery } from '@app/recovery';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { acquireTabLock } from '@platform/lifecycle/tab-lock';
import { createSave, SaveReadError } from '@platform/storage/save-codec';
import { gameFixture, MemorySaveRepository } from '../helpers/game-fixture';

vi.mock('@platform/storage/indexed-db-repository', () => ({ openSaveRepository: vi.fn() }));
vi.mock('@platform/lifecycle/tab-lock', () => ({ acquireTabLock: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe('Bootstrap protects existing progress', () => {
  it('previews the pinned reset backup without reading or overwriting damaged autosaves', async () => {
    const { state, catalog, clock } = gameFixture();
    const repository = Object.assign(new MemorySaveRepository(), { close: vi.fn() });
    repository.resetBackup = await createSave(state, catalog, clock.nowUtc());
    const load = vi.spyOn(repository, 'load').mockRejectedValue(new SaveReadError('invalid'));
    const release = vi.fn();
    vi.mocked(acquireTabLock).mockResolvedValue(release);
    vi.mocked(openSaveRepository).mockResolvedValue(repository);
    await expect(readResetBackupForRecovery()).resolves.toEqual(repository.resetBackup);
    expect(load).not.toHaveBeenCalled();
    expect(repository.writes).toBe(0);
    expect(repository.close).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });
  it('exports an unreadable record for recovery without overwriting storage', async () => {
    const raw = { schemaVersion: 99, payload: { unknown: 'preserve this data' } };
    const repository = Object.assign(new MemorySaveRepository(), { close: vi.fn() });
    vi.spyOn(repository, 'load').mockRejectedValue(new SaveReadError('future-version'));
    vi.spyOn(repository, 'readDamaged').mockResolvedValue(raw);
    const release = vi.fn();
    vi.mocked(acquireTabLock).mockResolvedValue(release);
    vi.mocked(openSaveRepository).mockResolvedValue(repository);
    await expect(exportRecoverableSave()).resolves.toEqual(raw);
    expect(repository.writes).toBe(0);
    expect(repository.close).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });
  it.each(['invalid', 'future-version', 'content-version'] as const)(
    'never writes an empty state after %s load failure',
    async (code) => {
      const repository = Object.assign(new MemorySaveRepository(), { close: vi.fn() });
      vi.spyOn(repository, 'load').mockRejectedValue(new SaveReadError(code));
      const release = vi.fn();
      vi.mocked(acquireTabLock).mockResolvedValue(release);
      vi.mocked(openSaveRepository).mockResolvedValue(repository);
      await expect(bootstrapGame()).rejects.toMatchObject({ code });
      expect(repository.writes).toBe(0);
      expect(repository.close).toHaveBeenCalledOnce();
      expect(release).toHaveBeenCalledOnce();
    },
  );
  it('restores an existing save and releases resources on disposal', async () => {
    const { state, catalog, clock } = gameFixture();
    vi.useFakeTimers();
    vi.setSystemTime(clock.wallMilliseconds);
    state.wallet.coin = state.statistics.totalProducedCoin = '9007199254740993';
    const repository = Object.assign(new MemorySaveRepository(), { close: vi.fn() });
    repository.stored = await createSave(state, catalog, clock.nowUtc());
    const release = vi.fn();
    vi.mocked(acquireTabLock).mockResolvedValue(release);
    vi.mocked(openSaveRepository).mockResolvedValue(repository);
    const session = await bootstrapGame();
    expect(session.engine.getSnapshot().wallet.coin).toBe('9007199254740993');
    expect(session.getSaveStatus().phase).toBe('saved');
    expect(repository.writes).toBe(1);
    vi.useRealTimers();
    session.dispose();
    expect(repository.close).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });
});

import { rawCatalog, validateCatalog } from '@content/index';
import { itemIconIds } from '@assets/asset-manifest';
import vi from '@locales/vi.json';
import type { SaveEnvelope } from '@core/state/game-state';
import { productionPerSecond } from '@core/economy/selectors';
import { monotonicUtc } from '@core/offline/settle-offline';
import { acquireTabLock } from '@platform/lifecycle/tab-lock';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { createSave, decodeSave, SaveReadError } from '@platform/storage/save-codec';
import { readSaveFile } from '@platform/storage/save-file';
import { endActiveSession } from '@core/events/end-active-session';
import { offlineEfficiency } from '@core/cards/selectors';
import { refreshProgress } from '@core/progression/refresh-progress';

const catalog = () => validateCatalog(rawCatalog, vi, itemIconIds);
export const readRecoveryFile = (file: File) => readSaveFile(file, catalog());
export async function readResetBackupForRecovery(): Promise<SaveEnvelope> {
  const release = await acquireTabLock();
  let repository: Awaited<ReturnType<typeof openSaveRepository>> | undefined;
  try {
    repository = await openSaveRepository(catalog());
    return await repository.loadBackup('reset-backup');
  } finally {
    repository?.close();
    release();
  }
}
export async function exportRecoverableSave(): Promise<unknown> {
  const release = await acquireTabLock();
  let repository: Awaited<ReturnType<typeof openSaveRepository>> | undefined;
  try {
    repository = await openSaveRepository(catalog());
    try {
      const saved = await repository.load();
      if (saved) return saved;
    } catch {
      /* Export the preserved record for diagnosis. */
    }
    const damaged = await repository.readDamaged();
    if (!damaged) throw new Error('No save to export');
    return damaged;
  } finally {
    repository?.close();
    release();
  }
}
export async function recoverFromFile(candidate: SaveEnvelope) {
  const content = catalog();
  const incoming = await decodeSave(candidate, content);
  const release = await acquireTabLock();
  let repository: Awaited<ReturnType<typeof openSaveRepository>> | undefined;
  try {
    repository = await openSaveRepository(content);
    let before: SaveEnvelope | null = null;
    try {
      before = await repository.load();
    } catch (error) {
      if (!(error instanceof SaveReadError) || error.code !== 'invalid') throw error;
    }
    const now = new Date().toISOString();
    const state = refreshProgress(
      {
        ...endActiveSession(incoming.payload, now),
        revision: incoming.payload.revision + 1,
        lastSimulatedAtUtc: monotonicUtc(incoming.payload.lastSimulatedAtUtc, now),
        offlineCps: productionPerSecond(incoming.payload, content),
        offlineEfficiency: offlineEfficiency(incoming.payload, content),
      },
      content,
      now,
    );
    await repository.save(await createSave(state, content, now), before ?? undefined);
  } finally {
    repository?.close();
    release();
  }
}

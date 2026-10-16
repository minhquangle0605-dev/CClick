import type { BackupRepository } from '@core/ports';
import type { GameCatalog } from '@core/catalog/catalog.types';
import type { SaveEnvelope } from '@core/state/game-state';
import { decodeSave, SaveReadError } from './save-codec';

export const DATABASE_NAME = 'coin-clicker';
const STORE = 'saves';
const keys = ['primary', 'backup-1', 'backup-2', 'damaged', 'reset-backup'] as const;

export async function openSaveRepository(
  catalog: GameCatalog,
  factory: IDBFactory = indexedDB,
  databaseName = DATABASE_NAME,
): Promise<BackupRepository & { close(): void; recoverySource: string | null }> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open(databaseName, 1);
    let abandoned = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error ?? new Error('Không mở được IndexedDB'));
    request.onblocked = () => {
      abandoned = true;
      reject(new Error('Kho lưu đang bị chặn bởi một cửa sổ khác'));
    };
    request.onsuccess = () => {
      if (abandoned) request.result.close();
      else resolve(request.result);
    };
  });
  database.onversionchange = () => database.close();
  let recoverySource: string | null = null;
  async function readRecords(): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, 'readonly');
      const records: Record<string, unknown> = {};
      for (const key of keys) {
        const request = tx.objectStore(STORE).get(key);
        request.onsuccess = () => {
          records[key] = request.result ?? null;
        };
      }
      tx.oncomplete = () => resolve(records);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Không đọc được save'));
    });
  }
  async function valid(raw: unknown): Promise<SaveEnvelope | null> {
    if (!raw) return null;
    try {
      return await decodeSave(raw, catalog);
    } catch (error) {
      if (error instanceof SaveReadError && error.code !== 'invalid') throw error;
      return null;
    }
  }
  async function writeSave(
    envelope: SaveEnvelope,
    beforeReplacement?: SaveEnvelope,
    isReset = false,
  ) {
    const incoming = await decodeSave(envelope, catalog);
    const before = beforeReplacement ? await decodeSave(beforeReplacement, catalog) : null;
    const records = await readRecords();
    const previous = await valid(records.primary);
    if (isReset && (!before || before.payload.runId === incoming.payload.runId))
      throw new Error('Invalid reset');
    if (
      isReset &&
      previous &&
      before &&
      (previous.payload.runId !== before.payload.runId ||
        previous.payload.revision > before.payload.revision)
    )
      throw new Error('Stale reset snapshot');
    if (
      previous &&
      !before &&
      (previous.payload.runId !== incoming.payload.runId ||
        previous.payload.revision > incoming.payload.revision)
    )
      throw new Error('Bản lưu đã thay đổi. Hãy mở lại game.');
    const backup1 = isReset
      ? incoming
      : (before ?? previous ?? (await valid(records['backup-1'])) ?? incoming);
    const backup2 = isReset
      ? incoming
      : before
        ? (previous ?? (await valid(records['backup-1'])) ?? backup1)
        : previous
          ? ((await valid(records['backup-1'])) ?? backup1)
          : ((await valid(records['backup-2'])) ?? backup1);
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const check = store.get('primary');
      check.onsuccess = () => {
        if (JSON.stringify(check.result ?? null) !== JSON.stringify(records.primary)) {
          tx.abort();
          return;
        }
        if (records.primary && !previous && !records.damaged) store.put(records.primary, 'damaged');
        if (isReset) store.put(before, 'reset-backup');
        store.put(backup2, 'backup-2');
        store.put(backup1, 'backup-1');
        store.put(incoming, 'primary');
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () =>
        reject(tx.error ?? new Error('Giao dịch lưu bị hủy; tiến trình cũ được giữ nguyên.'));
    });
  }
  return {
    close: () => database.close(),
    get recoverySource() {
      return recoverySource;
    },
    async load() {
      const records = await readRecords();
      const primary = await valid(records.primary);
      if (primary) return primary;
      for (const id of ['backup-1', 'backup-2']) {
        const backup = await valid(records[id]);
        if (backup) {
          recoverySource = id;
          return backup;
        }
      }
      if (records.primary || records['backup-1'] || records['backup-2'])
        throw new SaveReadError('invalid');
      return null;
    },
    async listBackups() {
      const records = await readRecords();
      const backups = [];
      for (const id of ['backup-1', 'backup-2', 'reset-backup']) {
        try {
          const envelope = await valid(records[id]);
          if (envelope) backups.push({ id, envelope });
        } catch {
          /* Leave incompatible records untouched. */
        }
      }
      return backups;
    },
    async loadBackup(id) {
      if (id !== 'backup-1' && id !== 'backup-2' && id !== 'reset-backup')
        throw new SaveReadError('invalid');
      return decodeSave((await readRecords())[id], catalog);
    },
    async readDamaged() {
      const records = await readRecords();
      if (records.damaged) return records.damaged;
      if (records.primary) {
        try {
          await decodeSave(records.primary, catalog);
        } catch {
          return records.primary;
        }
      }
      return null;
    },
    save: (envelope, beforeReplacement) => writeSave(envelope, beforeReplacement),
    reset: (envelope, beforeReset) => writeSave(envelope, beforeReset, true),
  };
}

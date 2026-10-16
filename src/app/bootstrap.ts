import { rawCatalog, validateCatalog } from '@content/index';
import { createInitialState } from '@core/state/initial-state';
import { itemIconIds } from '@assets/asset-manifest';
import vi from '@locales/vi.json';
import { createEngine } from '@core/engine/create-engine';
import { browserClock } from '@platform/time/browser-clock';
import { openSaveRepository } from '@platform/storage/indexed-db-repository';
import { acquireTabLock } from '@platform/lifecycle/tab-lock';
import { createGameSession } from './game-session';
import { settleOfflineAsync } from '@platform/time/settle-offline-async';
import { createSave } from '@platform/storage/save-codec';

export async function bootstrapGame() {
  const catalog = validateCatalog(rawCatalog, vi, itemIconIds);
  const release = await acquireTabLock();
  let repository: Awaited<ReturnType<typeof openSaveRepository>> | undefined;
  try {
    repository = await openSaveRepository(catalog);
    const saved = await repository.load();
    let state =
      saved?.payload ?? createInitialState(catalog, crypto.randomUUID(), browserClock.nowUtc());
    const offline = saved ? await settleOfflineAsync(state, catalog, browserClock.nowUtc()) : null;
    if (offline) state = offline.state;
    const committed = saved ? await createSave(state, catalog, browserClock.nowUtc()) : null;
    // Offline wallet and watermark commit together before the interactive UI is available.
    if (committed) await repository.save(committed);
    const engine = createEngine(state, catalog, browserClock);
    const session = createGameSession(
      engine,
      catalog,
      repository,
      browserClock,
      committed
        ? { savedAt: committed.savedAtUtc, savedRevision: committed.payload.revision }
        : undefined,
    );
    if (!saved) await session.requestSave();
    session.showInitialNotice(
      offline && (offline.summary.seconds >= 1 || offline.summary.clockRollback)
        ? offline.summary
        : null,
      Boolean(repository.recoverySource),
    );
    return {
      ...session,
      backups: repository,
      dispose() {
        session.dispose();
        repository?.close();
        release();
      },
    };
  } catch (error) {
    repository?.close();
    release();
    throw error;
  }
}

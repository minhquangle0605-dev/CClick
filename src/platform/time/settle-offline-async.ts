import { settleOffline } from '@core/offline/settle-offline';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';

/** The worker computes a candidate only; the session owns the atomic save/commit. */
export async function settleOfflineAsync(
  state: Readonly<GameState>,
  catalog: GameCatalog,
  now: string,
): Promise<ReturnType<typeof settleOffline>> {
  const elapsed = Date.parse(now) - Date.parse(state.lastSimulatedAtUtc);
  if (!state.automation.upgradeEnabled || elapsed < 60000 || typeof Worker === 'undefined')
    return settleOffline(state, catalog, now);
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./offline-worker.ts', import.meta.url), { type: 'module' });
    const finish = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    const fail = () => {
      finish();
      reject(
        new Error(
          'Không tính được tiến trình offline. Tiến trình đã lưu vẫn được giữ; hãy thử lại.',
        ),
      );
    };
    const timeout = setTimeout(fail, 120000);
    worker.onerror = fail;
    worker.onmessageerror = fail;
    worker.onmessage = (
      event: MessageEvent<{ ok: boolean; result: ReturnType<typeof settleOffline> }>,
    ) => {
      if (!event.data.ok) {
        fail();
        return;
      }
      finish();
      resolve(event.data.result);
    };
    try {
      worker.postMessage({ state, catalog, now });
    } catch {
      fail();
    }
  });
}

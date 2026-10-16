import { settleOffline } from '@core/offline/settle-offline';
import type { GameState } from '@core/state/game-state';
import type { GameCatalog } from '@core/catalog/catalog.types';

self.onmessage = (event: MessageEvent<{ state: GameState; catalog: GameCatalog; now: string }>) => {
  try {
    const { state, catalog, now } = event.data;
    self.postMessage({ ok: true, result: settleOffline(state, catalog, now) });
  } catch {
    self.postMessage({ ok: false });
  }
};
